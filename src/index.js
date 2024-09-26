require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
// Importing routes from ./apis.js
const API = require("./apis");
const controllers = require("./controllers");
// Importing database configuration
const config = require("./config");
const ConnectDatabase = require("./config/database");
const vote = require("./models/vote");

const memQueue = require("./memQueue");

// Create an Express app
const app = express();
const port = Number(process.env.HTTP_PORT || 5005);

// Apply middleware
app.use(cors({ origin: "*", methods: ["POST", "GET", "DELETE", "PUT"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, "client", "build")));

// Define routes
const router = express.Router();
API(router);
app.use("/api", router);

// Welcome message route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to my API!" });
});

// Serve the React application for all other routes
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

// Connect to MongoDB database
ConnectDatabase(String(config.mongoURI));

// Start the server
// const server = app.listen(port, () => {
//   console.log(`Server listening on http://localhost:${port}`);
// });

// Initialize Socket.IO
// const httpServer = createServer(server);
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*",
//   },
// });

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});
let liveVotingResults = null;
// let currentAgendaId = null;
let currentAgenda = {};

const currentAgendaVotes = () => memQueue.get(currentAgenda._id) || [];

// Handle socket connections
io.on("connection", (socket) => {
  // if (currentAgendaId) {
  //   io.emit("live_voting_results", currentAgendaId, currentAgendaVotes());
  // }
  if (!currentAgenda._id && liveVotingResults) {
    socket.emit("live_voting_results", liveVotingResults, null);
  }

  socket.on('i_am_in', (arg, callback)=> {
    if(currentAgenda._id) {
      // socket.emit("check_user_voting_permission", currentSessionId, currentAgendaId, currentAgendaVotes());
      callback(currentAgenda, currentAgendaVotes());
    } else {
      callback(null, []);
    }
  })

  socket.on("vote_start", (selectedAgenda, sessionId) => {
    liveVotingResults = selectedAgenda._id;
    currentAgenda = selectedAgenda;
    console.log("voting start for agenda => ", currentAgenda);

    const agendaInfo = { 
      _id: selectedAgenda._id,
      session_id: selectedAgenda.session_id,
      name: selectedAgenda.name,
    }; 

    io.emit("vote_start", agendaInfo);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    io.emit("user_disconnected");
  });

  socket.on("message", (message, id) => {
    console.log("message", id);
    io.emit("message", message, id);
  });

  socket.on("vote_update", async (voteData) => {
    console.log("\n vote data: ", voteData);
    const { user_id, agenda_id, decision } = voteData;
    // only record votes for agenda that match the current agenda
    if(currentAgenda._id === agenda_id) {
      memQueue.push(agenda_id, { user_id, decision });
      console.log("\n notifying users with ",currentAgenda._id, currentAgendaVotes());
      io.emit("live_voting_results", currentAgenda._id, currentAgendaVotes());
     }
  });

  socket.on("vote_close", async (id) => {
    console.log("close", id);
    io.emit("vote_close", id);
    io.emit("live_voting_results", currentAgenda._id, currentAgendaVotes());

    try {
      const filter = { _id: currentAgenda._id };
      const updateDoc = {
        votes: currentAgendaVotes(),
      };
      const options = { upsert: true };
      await controllers.Agenda.updateVote({ filter, updateDoc, options });
      // clear all current agenda states from memory and inform users of successful saving of all votes.
      memQueue.remove(currentAgenda._id);
      io.emit("voting_saved", currentAgenda._id);
      currentAgenda = {};  
    } catch (error) {
      console.error("Error saving vote:", error);
      io.emit("voting_not_saved", currentAgenda._id);
    }
  });

  socket.on("vote_reset", (resetData) => {
    memQueue.remove(resetData.agenda_id);
    currentAgenda = {};
    liveVotingResults = null;
    io.emit("vote_reset", resetData);
    io.emit("live_voting_results", null);
  });
});

// Start listening for Socket.IO connections
// httpServer.listen(4000, () => {
//   console.log("Socket.IO server listening on port 4000");
// });
const socketPort = httpServer.address();
app.get("/socketPort", (req, res) => {
  res.json({ port: socketPort });
});
httpServer.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://localhost:${port}`);
  /* eslint-enable no-console */
});

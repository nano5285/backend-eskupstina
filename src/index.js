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

// Create an Express app
const app = express();
const port = Number(process.env.HTTP_PORT || 8080);

// Apply middleware
app.use(cors({ origin: "*", methods: ["POST", "GET"] }));
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
let liveVotingResults;
let agenda;
// Handle socket connections
io.on("connection", (socket) => {
  if (liveVotingResults) {
    socket.emit("live_voting_results", liveVotingResults);
  }

  socket.on("vote_start", (id, agendaObj) => {
    liveVotingResults = id;
    agenda = agendaObj;
    console.log("voting start for agenda => ", agendaObj);
    io.emit("vote_start", id, agendaObj);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    // io.emit("disconnect");
  });

  socket.on("message", (message, id) => {
    console.log("message", id);
    io.emit("message", message, id);
  });

  socket.on("vote_update", async (message, id, voteUpdate) => {
    console.log("update", agenda, id, voteUpdate);
    liveVotingResults = id;
    agenda = agenda || {}; // Initialize agenda if it's not already set
    agenda.vote_info = JSON.stringify([
      ...JSON.parse(agenda.vote_info || "[]"),

      voteUpdate,
    ]);
    console.log("after updating sending user asdfsathis", message, id, agenda);
    io.emit("vote_update", message, id, agenda);
    try {
      const filter = { _id: id };
      const updateDoc = {
        vote_info: agenda.vote_info,
      };
      const options = { upsert: true };
      await controllers.Agenda.update({ filter, updateDoc, options });
    } catch (error) {
      console.error("Error saving vote:", error);
    }
  });

  socket.on("vote_close", (message, id) => {
    console.log("close", id);
    io.emit("vote_close", id, agenda);
    io.emit("live_voting_results", liveVotingResults);
    agenda = null;
  });

  socket.on("vote_reset", (message, id) => {
    liveVotingResults = null;
    io.emit("vote_reset");
    io.emit("live_voting_results", liveVotingResults);
    agenda = null;
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

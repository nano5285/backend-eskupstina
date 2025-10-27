import express, { Express } from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import API from "../src/apis";
import config from "../src/config";
import ConnectDatabase from "../src/config/database";

const app: Express = express();
const port: number = Number(process.env.HTTP_PORT || 5005);

// ✅ Allow only your frontend domain
const allowedOrigin = "https://e-skupstina-frontend.azurewebsites.net";

// Global CORS middleware for REST API
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const router = express.Router();
API(router);
app.use("/api", router);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to my API!" });
});

// Create HTTP server
const server = createServer(app);

async function startServer() {
  try {
    await ConnectDatabase(String(config.mongoURI));

    // ✅ Socket.IO with explicit CORS
    const io = new Server(server, {
      cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["polling", "websocket"],
    });

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("disconnect", () => console.log("user disconnected"));
      socket.on("message", (message) => io.emit("message", message));
      socket.on("vote_update", (message) => io.emit("vote_update", message));
      socket.on("vote_close", (message) => io.emit("vote_close", message));
    });

    server.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

require("dotenv").config();
import express, { Express } from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";

// External Modules
import API from "../src/apis";
import config from "../src/config";
import ConnectDatabase from "../src/config/database";

// Get router
const router = express.Router();

const app: Express = express();
const port: Number = Number(process.env.HTTP_PORT || 5005);

app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend Load
// app.use(express.static(__dirname + "/build"));
// app.get("/*", function (req: any, res: any) {
//     res.sendFile(__dirname + "/build/index.html", function (err: any) {
//         if (err) {
//             res.status(500).send(err);
//         }
//     });
// });

// API Router
API(router);
app.use("/api", router);
app.get("/", (req, res) => {
  res.json({ message: "Welcome to my API!" });
});

console.log(config.mongoURI);

// 1. Kreiramo server za HTTP promet i povezujemo ga s Express aplikacijom
const server = createServer(app); // Koristimo Express 'app'

// 2. Kreiramo asinkronu funkciju za pokretanje aplikacije
async function startServer() {
  try {
    // Čekamo da se baza podataka spoji (ISPRAVAK ZA TIMEOUT)
    await ConnectDatabase(String(config.mongoURI));

    // 3. Povezujemo Socket.IO s JEDNIM HTTP serverom i forsiramo polling
    const io = new Server(server, {
      // Koristimo 'server' varijablu
      cors: {
        origin: "*",
      },
      // ISPRAVAK ZA 400 BAD REQUEST
      transports: ["polling", "websocket"], // Postavljamo transport na polling i websocket
    });

    // 4. Socket.IO logika
    io.on("connection", (socket: any) => {
      socket.on("disconnect", function () {
        console.log("user disconnected");
      });
      socket.on("message", function (message: any) {
        console.log(message);
        io.emit("message", message);
      });
      socket.on("vote_update", function (message: any) {
        console.log(message);
        io.emit("vote_update", message);
      });

      socket.on("vote_close", function (message: any) {
        console.log(message);
        io.emit("vote_close", message);
      });
    });

    // 5. Pokrećemo server na JEDNOM portu
    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server or connect to database:", error);
    // Ako se baza ne spoji, aplikacija se gasi
    process.exit(1);
  }
}

// Pokrećemo funkciju
startServer();

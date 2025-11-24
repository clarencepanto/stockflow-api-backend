import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
// ... other imports

dotenv.config();

const app = express();
const server = http.createServer(app);

// ⚠️ CRITICAL: CORS configuration BEFORE routes
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://stockflow-api-frontend.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: true, // ← Allows ALL origins
    credentials: true,
  },
});

// ... rest of your code (routes, etc.)

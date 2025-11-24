import dotenv from "dotenv";
dotenv.config(); // ← Keep this one

import express from "express";
import cors from "cors";
import http from "http";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { initializeSocket } from "./utils/socket";

// dotenv.config(); // ← Remove this duplicate

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);
console.log("Socket.io initialized");

// Middleware - IMPORTANT ORDER!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Log all requests
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "StockFlow API is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler (MUST BE LAST!)
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.path,
    message: "This route does not exist",
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
  console.log(`🔌 Socket.IO ready for connections`);
});

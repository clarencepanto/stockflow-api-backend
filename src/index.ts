import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import swaggerUI from "swagger-ui-express";
const { swaggerSpec } = require("./config/swagger");
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import { initializeSocket } from "./utils/socket";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// http seerver for socket io , create a new one
const httpServer = http.createServer(app);

// initialize Socket.IO
const io = initializeSocket(httpServer);
console.log("Socket.io initailized");

// Middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar {display: none}",
    customSiteTitle: "StockFlow API Docs",
  })
);

// Test route (BEFORE API routes)
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

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "StockFlow API",
      version: "1.0.0",
      description:
        "A comprehensive inventory management and orders API with real-time updates",
      contact: {
        name: "API Support",
        email: "support@stockflow.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: 'Enter your JWT token (without "Bearer" prefix)',
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["ADMIN", "STAFF"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            sku: { type: "string" },
            description: { type: "string", nullable: true },
            price: { type: "number", format: "float" },
            stockLevel: { type: "integer" },
            lowStockThreshold: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        InventoryAdjustment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            productId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            quantity: { type: "integer" },
            type: { type: "string", enum: ["IN", "OUT"] },
            reason: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "CANCELLED"],
            },
            totalAmount: { type: "number", format: "float" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
            productId: { type: "string", format: "uuid" },
            quantity: { type: "integer" },
            priceAtTime: { type: "number", format: "float" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // Path to API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };

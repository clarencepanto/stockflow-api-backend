import request from "supertest";
import express from "express";
import cors from "cors";
import productRoutes from "../routes/productRoutes";
import authRoutes from "../routes/authRoutes";
import { cleanDatabase, prisma, createTestUser } from "./helpers";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

describe("Products Tests", () => {
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create admin user
    const adminResponse = await request(app).post("/api/auth/register").send({
      email: "admin@test.com",
      password: "password123",
      name: "Admin User",
      role: "ADMIN",
    });
    adminToken = adminResponse.body.token;

    // Create staff user
    const staffResponse = await request(app).post("/api/auth/register").send({
      email: "staff@test.com",
      password: "password123",
      name: "Staff User",
      role: "STAFF",
    });
    staffToken = staffResponse.body.token;
  });

  afterEach(async () => {
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("POST /api/products", () => {
    it("should create product as ADMIN", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Mouse",
          sku: "MOUSE-TEST-001",
          description: "A test mouse",
          price: 29.99,
          stockLevel: 50,
          lowStockThreshold: 10,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Test Mouse");
      expect(response.body.sku).toBe("MOUSE-TEST-001");
      expect(response.body.price).toBe(29.99);
    });

    it("should fail without auth", async () => {
      const response = await request(app).post("/api/products").send({
        name: "Test Product",
        sku: "TEST-001",
        price: 10.99,
      });

      expect(response.status).toBe(401);
    });

    it("should fail as STAFF (not ADMIN)", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          name: "Test Product",
          sku: "TEST-002",
          price: 10.99,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden: Insufficient permissions");
    });

    it("should fail with duplicate SKU", async () => {
      // Create first product
      await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "First Product",
          sku: "DUPLICATE-SKU",
          price: 10.99,
        });

      // Try duplicate SKU
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Second Product",
          sku: "DUPLICATE-SKU",
          price: 20.99,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Product with this SKU already exists");
    });

    it("should fail with invalid data", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "",
          sku: "",
          price: -10, // Negative price
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/products", () => {
    beforeEach(async () => {
      // Create test products
      await prisma.product.createMany({
        data: [
          {
            name: "Mouse A",
            sku: "MOUSE-A",
            price: 20,
            stockLevel: 50,
            lowStockThreshold: 10,
          },
          {
            name: "Mouse B",
            sku: "MOUSE-B",
            price: 30,
            stockLevel: 30,
            lowStockThreshold: 10,
          },
          {
            name: "Keyboard",
            sku: "KEY-001",
            price: 50,
            stockLevel: 20,
            lowStockThreshold: 10,
          },
        ],
      });
    });

    it("should get all products with pagination", async () => {
      const response = await request(app)
        .get("/api/products?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it("should search products by name", async () => {
      const response = await request(app)
        .get("/api/products?search=mouse")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.products).toHaveLength(2);
      expect(response.body.products[0].name).toContain("Mouse");
    });

    it("should sort products", async () => {
      const response = await request(app)
        .get("/api/products?sortBy=price&sortOrder=asc")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.products[0].price).toBe(20);
      expect(response.body.products[2].price).toBe(50);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should get product by ID", async () => {
      const product = await prisma.product.create({
        data: {
          name: "Test Product",
          sku: "TEST-GET-001",
          price: 25.99,
          stockLevel: 100,
          lowStockThreshold: 10,
        },
      });

      const response = await request(app)
        .get(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(product.id);
      expect(response.body.name).toBe("Test Product");
    });

    it("should return 404 for non-existent product", async () => {
      const response = await request(app)
        .get("/api/products/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("should update product as ADMIN", async () => {
      const product = await prisma.product.create({
        data: {
          name: "Old Name",
          sku: "UPDATE-001",
          price: 10,
          stockLevel: 50,
          lowStockThreshold: 10,
        },
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New Name",
          price: 15.99,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("New Name");
      expect(response.body.price).toBe(15.99);
    });

    it("should fail as STAFF", async () => {
      const product = await prisma.product.create({
        data: {
          name: "Test",
          sku: "UPDATE-002",
          price: 10,
          stockLevel: 50,
          lowStockThreshold: 10,
        },
      });

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ name: "Updated" });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("should delete product as ADMIN", async () => {
      const product = await prisma.product.create({
        data: {
          name: "To Delete",
          sku: "DELETE-001",
          price: 10,
          stockLevel: 50,
          lowStockThreshold: 10,
        },
      });

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Product deleted successfully");

      // Verify it's deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(deletedProduct).toBeNull();
    });

    it("should fail as STAFF", async () => {
      const product = await prisma.product.create({
        data: {
          name: "Test",
          sku: "DELETE-002",
          price: 10,
          stockLevel: 50,
          lowStockThreshold: 10,
        },
      });

      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });
});

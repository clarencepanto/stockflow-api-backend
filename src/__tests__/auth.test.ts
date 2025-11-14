import request from "supertest";
import express from "express";
import cors from "cors";
import authRoutes from "../routes/authRoutes";
import { cleanDatabase, prisma } from "./helpers";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Authentication Tests", () => {
  beforeAll(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "newuser@test.com",
        password: "password123",
        name: "New User",
        role: "ADMIN",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("newuser@test.com");
      expect(response.body.user.role).toBe("ADMIN");
      expect(response.body.user).not.toHaveProperty("password"); // Password shouldn't be returned
    });

    it("should fail with invalid email", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
        password: "password123",
        name: "Test User",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(Array.isArray(response.body.error)).toBe(true);
    });

    it("should fail with short password", async () => {
      const response = await request(app).post("/api/auth/register").send({
        email: "test@test.com",
        password: "123",
        name: "Test User",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should fail if user already exists", async () => {
      // Create first user
      await request(app).post("/api/auth/register").send({
        email: "duplicate@test.com",
        password: "password123",
        name: "First User",
      });

      // Try to create duplicate
      const response = await request(app).post("/api/auth/register").send({
        email: "duplicate@test.com",
        password: "password123",
        name: "Second User",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      // Register user first
      await request(app).post("/api/auth/register").send({
        email: "login@test.com",
        password: "password123",
        name: "Login User",
      });

      // Login
      const response = await request(app).post("/api/auth/login").send({
        email: "login@test.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("login@test.com");
    });

    it("should fail with wrong password", async () => {
      // Register user
      await request(app).post("/api/auth/register").send({
        email: "wrongpass@test.com",
        password: "password123",
        name: "Test User",
      });

      // Try wrong password
      const response = await request(app).post("/api/auth/login").send({
        email: "wrongpass@test.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });

    it("should fail with non-existent user", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@test.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user info with valid token", async () => {
      // Register and get token
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "me@test.com",
          password: "password123",
          name: "Me User",
        });

      const token = registerResponse.body.token;

      // Get current user
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe("me@test.com");
      expect(response.body.name).toBe("Me User");
    });

    it("should fail without token", async () => {
      const response = await request(app).get("/api/auth/me");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("No token provided");
    });

    it("should fail with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid or expired token");
    });
  });
});

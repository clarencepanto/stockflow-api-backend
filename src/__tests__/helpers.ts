import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const cleanDatabase = async () => {
  // delete in order to avoid foreign key constraints
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
};

export const createTestUser = async (role: "ADMIN" | "STAFF" = "ADMIN") => {
  const bycrypt = require("bcrypt");
  const hashedPassword = await bycrypt.hash("password123", 10);

  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@test.com`,
      password: hashedPassword,
      name: "Test User",
      role,
    },
  });
};

export const createTestProduct = async () => {
  return await prisma.product.create({
    data: {
      name: "Test Product",
      sku: `TEST-${Date.now()}`,
      description: "Test description",
      price: 29.99,
      stockLevel: 100,
      lowStockThreshold: 10,
    },
  });
};

export { prisma };

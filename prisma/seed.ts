import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...\n");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning up existing data...");
  await prisma.inventoryAdjustment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Cleanup complete\n");

  // Create Users
  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: hashedPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: "staff@test.com",
      password: hashedPassword,
      name: "Staff Member",
      role: "STAFF",
    },
  });

  console.log("✅ Created 2 users");
  console.log("   📧 admin@test.com / password123 (ADMIN)");
  console.log("   📧 staff@test.com / password123 (STAFF)\n");

  // Create Products
  console.log("📦 Creating products...");
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Wireless Mouse",
        sku: "MOUSE-001",
        description: "Ergonomic wireless mouse with USB receiver",
        price: 29.99,
        stockLevel: 50,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mechanical Keyboard",
        sku: "KB-001",
        description: "RGB mechanical keyboard with blue switches",
        price: 89.99,
        stockLevel: 30,
        lowStockThreshold: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: "USB-C Cable",
        sku: "CABLE-001",
        description: "6ft USB-C charging cable",
        price: 12.99,
        stockLevel: 100,
        lowStockThreshold: 20,
      },
    }),
    prisma.product.create({
      data: {
        name: "Laptop Stand",
        sku: "STAND-001",
        description: "Aluminum adjustable laptop stand",
        price: 45.0,
        stockLevel: 25,
        lowStockThreshold: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: "Webcam HD",
        sku: "CAM-001",
        description: "1080p HD webcam with microphone",
        price: 69.99,
        stockLevel: 15,
        lowStockThreshold: 5,
      },
    }),
    prisma.product.create({
      data: {
        name: "Noise-Cancelling Headphones",
        sku: "HP-001",
        description: "Wireless noise-cancelling headphones",
        price: 149.99,
        stockLevel: 8,
        lowStockThreshold: 10,
      },
    }),
    prisma.product.create({
      data: {
        name: '27" 4K Monitor',
        sku: "MON-001",
        description: "27-inch 4K UHD monitor",
        price: 399.99,
        stockLevel: 12,
        lowStockThreshold: 3,
      },
    }),
    prisma.product.create({
      data: {
        name: "LED Desk Lamp",
        sku: "LAMP-001",
        description: "Adjustable LED desk lamp with USB port",
        price: 34.99,
        stockLevel: 40,
        lowStockThreshold: 8,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products\n`);

  // Create Orders with Items
  console.log("🛒 Creating orders...");

  const order1 = await prisma.order.create({
    data: {
      userId: adminUser.id,
      status: "COMPLETED",
      totalAmount: 149.97, // (29.99 * 2) + 89.99
      orderItems: {
        create: [
          {
            productId: products[0].id,
            quantity: 2,
            priceAtTime: 29.99,
          },
          {
            productId: products[1].id,
            quantity: 1,
            priceAtTime: 89.99,
          },
        ],
      },
    },
  });

  // Update stock for order 1
  await prisma.product.update({
    where: { id: products[0].id },
    data: { stockLevel: { decrement: 2 } },
  });
  await prisma.product.update({
    where: { id: products[1].id },
    data: { stockLevel: { decrement: 1 } },
  });

  // Create inventory adjustments for order 1
  await prisma.inventoryAdjustment.create({
    data: {
      productId: products[0].id,
      userId: adminUser.id,
      quantity: -2,
      type: "OUT",
      reason: `Order ${order1.id}`,
    },
  });
  await prisma.inventoryAdjustment.create({
    data: {
      productId: products[1].id,
      userId: adminUser.id,
      quantity: -1,
      type: "OUT",
      reason: `Order ${order1.id}`,
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: staffUser.id,
      status: "PENDING",
      totalAmount: 64.95, // 12.99 * 5
      orderItems: {
        create: [
          {
            productId: products[2].id,
            quantity: 5,
            priceAtTime: 12.99,
          },
        ],
      },
    },
  });

  await prisma.product.update({
    where: { id: products[2].id },
    data: { stockLevel: { decrement: 5 } },
  });
  await prisma.inventoryAdjustment.create({
    data: {
      productId: products[2].id,
      userId: staffUser.id,
      quantity: -5,
      type: "OUT",
      reason: `Order ${order2.id}`,
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: adminUser.id,
      status: "PENDING",
      totalAmount: 153.97, // 45 + 69.99 + (12.99 * 3)
      orderItems: {
        create: [
          {
            productId: products[3].id,
            quantity: 1,
            priceAtTime: 45.0,
          },
          {
            productId: products[4].id,
            quantity: 1,
            priceAtTime: 69.99,
          },
          {
            productId: products[2].id,
            quantity: 3,
            priceAtTime: 12.99,
          },
        ],
      },
    },
  });

  await prisma.product.update({
    where: { id: products[3].id },
    data: { stockLevel: { decrement: 1 } },
  });
  await prisma.product.update({
    where: { id: products[4].id },
    data: { stockLevel: { decrement: 1 } },
  });
  await prisma.product.update({
    where: { id: products[2].id },
    data: { stockLevel: { decrement: 3 } },
  });

  await prisma.inventoryAdjustment.create({
    data: {
      productId: products[3].id,
      userId: adminUser.id,
      quantity: -1,
      type: "OUT",
      reason: `Order ${order3.id}`,
    },
  });
  await prisma.inventoryAdjustment.create({
    data: {
      productId: products[4].id,
      userId: adminUser.id,
      quantity: -1,
      type: "OUT",
      reason: `Order ${order3.id}`,
    },
  });
  await prisma.inventoryAdjustment.create({
    data: {
      productId: products[2].id,
      userId: adminUser.id,
      quantity: -3,
      type: "OUT",
      reason: `Order ${order3.id}`,
    },
  });

  console.log("✅ Created 3 orders\n");

  // Create Manual Inventory Adjustments
  console.log("📊 Creating manual inventory adjustments...");

  await prisma.$transaction(async (tx) => {
    // Adjustment 1: Stock IN
    await tx.inventoryAdjustment.create({
      data: {
        productId: products[0].id,
        userId: adminUser.id,
        quantity: 20,
        type: "IN",
        reason: "New shipment from supplier",
      },
    });
    await tx.product.update({
      where: { id: products[0].id },
      data: { stockLevel: { increment: 20 } },
    });

    // Adjustment 2: Stock IN
    await tx.inventoryAdjustment.create({
      data: {
        productId: products[1].id,
        userId: staffUser.id,
        quantity: 10,
        type: "IN",
        reason: "Restocking",
      },
    });
    await tx.product.update({
      where: { id: products[1].id },
      data: { stockLevel: { increment: 10 } },
    });

    // Adjustment 3: Stock OUT
    await tx.inventoryAdjustment.create({
      data: {
        productId: products[2].id,
        userId: adminUser.id,
        quantity: -5,
        type: "OUT",
        reason: "Damaged goods",
      },
    });
    await tx.product.update({
      where: { id: products[2].id },
      data: { stockLevel: { decrement: 5 } },
    });

    // Adjustment 4: Stock IN
    await tx.inventoryAdjustment.create({
      data: {
        productId: products[3].id,
        userId: adminUser.id,
        quantity: 15,
        type: "IN",
        reason: "Inventory count correction",
      },
    });
    await tx.product.update({
      where: { id: products[3].id },
      data: { stockLevel: { increment: 15 } },
    });

    // Adjustment 5: Stock OUT
    await tx.inventoryAdjustment.create({
      data: {
        productId: products[5].id,
        userId: staffUser.id,
        quantity: -2,
        type: "OUT",
        reason: "Product samples for trade show",
      },
    });
    await tx.product.update({
      where: { id: products[5].id },
      data: { stockLevel: { decrement: 2 } },
    });

    // Adjustment 6: Stock IN
    await tx.inventoryAdjustment.create({
      data: {
        productId: products[6].id,
        userId: adminUser.id,
        quantity: 5,
        type: "IN",
        reason: "Return from customer",
      },
    });
    await tx.product.update({
      where: { id: products[6].id },
      data: { stockLevel: { increment: 5 } },
    });
  });

  console.log("✅ Created 6 manual inventory adjustments\n");

  console.log("✨ Seeding completed successfully!\n");
  console.log("📊 Summary:");
  console.log("   👤 2 users (admin@test.com, staff@test.com)");
  console.log("   📦 8 products");
  console.log("   🛒 3 orders (1 completed, 2 pending)");
  console.log(
    "   📊 15 inventory adjustments total (9 from orders + 6 manual)"
  );
  console.log(
    "\n🎉 Go check your dashboard at http://localhost:3001/dashboard"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

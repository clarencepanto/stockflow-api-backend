import { Request, Response } from "express";
import z from "zod";
import prisma from "../utils/prisma";
import { getIO } from "../utils/socket";

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
});

// Create order

export const createOrder = async (req: Request, res: Response) => {
  console.log("order called");

  try {
    const data = createOrderSchema.parse(req.body);
    const userId = req.user!.id;

    // step 1: validate all products exist and have enough stocks
    const productIds = data.items.map((item) => item.productId);

    const uniqueProductIds = [...new Set(productIds)];

    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    if (products.length !== uniqueProductIds.length) {
      return res.status(404).json({ error: "One or more products not found" });
    }

    // step 2: check stock levels
    const productQuantities = new Map<string, number>();
    for (const item of data.items) {
      const currentQty = productQuantities.get(item.productId) || 0;
      productQuantities.set(item.productId, currentQty + item.quantity);
    }

    for (const [productId, totalQuantity] of productQuantities) {
      const product = products.find((p) => p.id === productId);
      if (!product) continue;

      if (product.stockLevel < totalQuantity) {
        return res.status(400).json({
          error: "Insufficient stock",
          product: product.name,
          available: product.stockLevel,
          requested: totalQuantity,
        });
      }
    }

    // step 3 : calculate total amount
    let totalAmount = 0;
    const orderItemsData = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: product.price,
      };
    });

    // step 4: create order with items and update stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // create the order
      const order = await tx.order.create({
        data: {
          userId,
          status: data.status || "PENDING",
          totalAmount,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: { name: true, sku: true, price: true },
              },
            },
          },

          user: {
            select: { name: true, email: true },
          },
        },
      });
      // Update stock levels for each product

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockLevel: {
              decrement: item.quantity,
            },
          },
        });

        // create inventory adjustment record

        await tx.inventoryAdjustment.create({
          data: {
            productId: item.productId,
            userId,
            quantity: -item.quantity,
            type: "OUT",
            reason: `Order ${order.id}`,
          },
        });
      }

      return order;
    });

    try {
      const io = getIO();
      io.emit("order:created", {
        orderId: result.id,
        userId: result.userId,
        userName: result.user.name,
        totalAmount: result.totalAmount,
        itemCount: result.orderItems.length,
        status: result.status,
        timestamp: new Date(),
      });
      console.log("emitted order");
    } catch (error) {
      console.error("Failed to emit socket event", error);
    }

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get all orders ( with pagination and filters)
export const getOrders = async (req: Request, res: Response) => {
  console.log("Getorders called");

  try {
    const { page = "1", limit = "10", status, userId } = req.params;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // build filter
    const where: any = {};
    if (status) where.status = status as string;
    if (userId) where.userId = userId as string;

    const [orders, total] = (await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
          orderItems: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ])) as [any[], number];

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get single order
export const getOrderById = async (req: Request, res: Response) => {
  console.log("getOrderById called");

  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, sku: true, price: true },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// update order status

export const updateOrderStatus = async (req: Request, res: Response) => {
  console.log("update status called");

  try {
    const { id } = req.params;
    const data = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        orderItems: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTodaysOrders = async (req: Request, res: Response) => {
  console.log(" getTodays orders called");

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },

      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    res.json({
      count: orders.length,
      totalRevenue,
      orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { getIO } from "../utils/socket";
import { PrismaClient } from "@prisma/client";

const createAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(["IN", "OUT"]),
  reason: z.string().optional(),
});

export const createAdjustment = async (req: Request, res: Response) => {
  console.log("🔥 createAdjustment called!");
  console.log("req.body:", req.body);
  console.log("req.user:", req.user);

  try {
    const data = createAdjustmentSchema.parse(req.body);
    const userId = req.user!.id;

    const product = await prisma.product.findUnique({
      where: {
        id: data.productId,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // validate quantity based on type

    if (data.type === "IN" && data.quantity <= 0) {
      return res.status(400).json({
        error: "IN adjustments must have positive quantity ",
      });
    }

    if (data.type === "OUT" && data.quantity >= 0) {
      return res.status(400).json({
        error: "OUT adjustments must have negative quantity",
      });
    }

    // check if out would make stock negative
    const newStockLevel = product.stockLevel + data.quantity;
    if (newStockLevel < 0) {
      return res.status(400).json({
        error: "Insufficient stock",
        currentStock: product.stockLevel,
        requested: Math.abs(data.quantity),
      });
    }

    // Create adjustment and update product stock in a transaction
    const result = await prisma.$transaction(
      async (
        tx: Omit<
          PrismaClient,
          | "$connect"
          | "$disconnect"
          | "$on"
          | "$transaction"
          | "$use"
          | "$extends"
        >
      ) => {
        const adjustment = await tx.inventoryAdjustment.create({
          data: {
            productId: data.productId,
            userId,
            quantity: data.quantity,
            type: data.type,
            reason: data.reason,
          },
          include: {
            product: {
              select: { name: true, sku: true },
            },
            user: { select: { name: true, email: true } },
          },
        });
        //update product stock
        const updatedProduct = await tx.product.update({
          where: { id: data.productId },
          data: {
            stockLevel: newStockLevel,
          },
        });

        return { adjustment, updatedProduct };
      }
    );

    try {
      const io = getIO();
      io.emit("stock:updated", {
        productId: data.productId,
        productName: product.name,
        oldStock: product.stockLevel,
        newStock: result.updatedProduct.stockLevel,
        change: data.quantity,
        type: data.type,
        reason: data.reason,
        timestamp: new Date(),
      });
      console.log("emited stock: updated event");
    } catch (error) {
      console.error("Failed to emit socket event:", error);
    }

    res.status(201).json({
      adjustment: result.adjustment,
      newStockLevel: result.updatedProduct.stockLevel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        errors: error.issues,
      });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// get all adjustments(with pagination and filter)
export const getAdjustments = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10", productId, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};
    if (productId) where.productId = productId as string;
    if (type) where.type = type as string;

    const [adjustments, total] = (await Promise.all([
      prisma.inventoryAdjustment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.inventoryAdjustment.count({ where }),
    ])) as [any[], number];

    res.json({
      adjustments,
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

// GET Adjustments for a specific product
export const getProductAdjustments = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    console.log("Looking for product with ID:", productId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const adjustments = await prisma.inventoryAdjustment.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    res.json({
      product: {
        id: product?.id,
        name: product?.name,
        sku: product?.sku,
        currentStock: product?.stockLevel,
      },
      adjustments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";

const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stockLevel: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stockLevel: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const createProduct = async (req: Request, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);

    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingProduct) {
      return res
        .status(400)
        .json({ error: "Product with this SKU already exists" });
    }

    const product = await prisma.product.create({ data });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error(error);

    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            {
              name: {
                contains: search as string,
                mode: "insensitive" as const,
              },
            },
            {
              sku: { contains: search as string, mode: "insensitive" as const },
            },
            {
              description: {
                contains: search as string,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    // get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
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

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventoryAdjustments: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Upadate product

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(400).json({ error: "Product not found" });
    }

    // if updating sku, check if its not taken
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuTaken = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuTaken) {
        return res.status(400).json({ error: "SKU already in use" });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }

    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// delete product

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stockLevel: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
      orderBy: { stockLevel: "asc" },
    });
    res.json({ count: products.length, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

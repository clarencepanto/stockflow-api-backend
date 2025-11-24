import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Get total products count
    const totalProducts = await prisma.product.count();

    // Get active (pending) orders count
    const activeOrders = await prisma.order.count({
      where: { status: "PENDING" },
    });

    // Get low stock items (stock <= threshold)
    const lowStockItems = await prisma.product.count({
      where: {
        stockLevel: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
    });

    // Get this month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const ordersThisMonth = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        status: "COMPLETED",
      },
    });

    const revenueThisMonth = ordersThisMonth.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Get recent orders (last 5)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true },
        },
        orderItems: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Get low stock products list
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stockLevel: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
      orderBy: { stockLevel: "asc" },
      take: 10,
    });

    // NEW: Revenue over last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const ordersOnDay = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: "COMPLETED",
        },
      });

      const revenue = ordersOnDay.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );

      last7Days.push({
        date: date.toISOString().split("T")[0], // YYYY-MM-DD
        revenue: Number(revenue.toFixed(2)),
      });
    }

    // NEW: Stock levels (top 8 products by stock)
    const stockLevels = await prisma.product.findMany({
      take: 8,
      orderBy: { stockLevel: "desc" },
      select: {
        name: true,
        stockLevel: true,
        lowStockThreshold: true,
      },
    });

    // NEW: Order status distribution
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const orderStatusChart = ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    res.json({
      stats: {
        totalProducts,
        activeOrders,
        lowStockItems,
        revenueThisMonth,
      },
      recentOrders,
      lowStockProducts,
      charts: {
        revenueChart: last7Days,
        stockLevelsChart: stockLevels,
        orderStatusChart,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

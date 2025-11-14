import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getTodaysOrders,
} from "../controllers/orderController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, authorize("ADMIN", "STAFF"), createOrder);
router.get("/", authenticate, getOrders);
router.get("/today", authenticate, getTodaysOrders);
router.get("/:id", authenticate, getOrderById);
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "STAFF"),
  updateOrderStatus
);

export default router;

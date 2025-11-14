import { Router } from "express";
import {
  createAdjustment,
  getAdjustments,
  getProductAdjustments,
} from "../controllers/inventoryController";

import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, authorize("ADMIN", "STAFF"), createAdjustment);
router.get("/", authenticate, getAdjustments);
router.get("/product/:productId", authenticate, getProductAdjustments);

export default router;

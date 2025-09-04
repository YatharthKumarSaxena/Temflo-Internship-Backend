import express from "express";
import {
  createAllowance,
  getAllowances,
  getAllowanceById,
  updateAllowance,
  deleteAllowance,
} from "../../controllers/payrollController/Allowance.js";

const router = express.Router();

router.post("/", createAllowance);
router.get("/", getAllowances);
router.get("/:id", getAllowanceById);
router.put("/:id", updateAllowance);
router.delete("/:id", deleteAllowance);

export default router;

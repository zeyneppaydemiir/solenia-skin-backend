const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { saleSchema } = require("../validators/sale.validator");
const { getSales, getSale, createSale, cancelSale } = require("../controllers/sale.controller");

router.use(requireAuth);

router.get("/", getSales);
router.get("/:id", getSale);
router.post("/", requireRole("sales_manager"), validate(saleSchema), createSale);
router.put("/:id/cancel", requireRole("sales_manager"), cancelSale);

module.exports = router;
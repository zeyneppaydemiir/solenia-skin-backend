const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { productionOrderSchema } = require("../validators/productionOrder.validator");
const { getProductionOrders, createProductionOrder } = require("../controllers/productionOrder.controller");

router.use(requireAuth);

router.get("/", getProductionOrders);
router.post("/", requireRole("production_manager"), validate(productionOrderSchema), createProductionOrder);

module.exports = router;
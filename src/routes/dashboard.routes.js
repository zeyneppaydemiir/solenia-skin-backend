const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const { getSummary, getCustomerSegments } = require("../controllers/dashboard.controller");
const { getForecast } = require("../controllers/forecast.controller");
const { getSalesAnalysis } = require("../controllers/salesAnalytics.controller");
const { getInventoryAnalysis } = require("../controllers/inventoryAnalytics.controller");
const { getProductionAnalysis } = require("../controllers/productionAnalytics.controller");

router.use(requireAuth);

router.get("/summary", getSummary);
router.get("/customers", requireRole("sales_manager", "finance", "viewer"), getCustomerSegments);
router.get("/forecast", requireRole("sales_manager", "production_manager", "viewer"), getForecast);
router.get("/sales-analysis", requireRole("sales_manager", "finance", "viewer"), getSalesAnalysis);
router.get("/inventory-analysis", requireRole("warehouse_manager", "finance", "viewer"), getInventoryAnalysis);
router.get("/production-analysis", requireRole("production_manager", "finance", "quality_manager", "viewer"), getProductionAnalysis);

module.exports = router;
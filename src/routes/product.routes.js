const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { productSchema, productUpdateSchema } = require("../validators/product.validator");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

router.use(requireAuth);

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", requireRole("warehouse_manager"), validate(productSchema), createProduct);
router.put("/:id", requireRole("warehouse_manager"), validate(productUpdateSchema), updateProduct);
router.delete("/:id", requireRole("warehouse_manager"), deleteProduct);

module.exports = router;
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { rawMaterialSchema, rawMaterialUpdateSchema } = require("../validators/rawMaterial.validator");
const {
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
} = require("../controllers/rawMaterial.controller");

router.use(requireAuth);

router.get("/", getRawMaterials);
router.post("/", requireRole("warehouse_manager", "production_manager"), validate(rawMaterialSchema), createRawMaterial);
router.put("/:id", requireRole("warehouse_manager", "production_manager"), validate(rawMaterialUpdateSchema), updateRawMaterial);
router.delete("/:id", requireRole("warehouse_manager", "production_manager"), deleteRawMaterial);

module.exports = router;
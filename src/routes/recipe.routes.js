const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { recipeSchema } = require("../validators/recipe.validator");
const { getRecipe, setRecipe } = require("../controllers/recipe.controller");

router.use(requireAuth);

router.get("/:productId", getRecipe);
router.put("/:productId", requireRole("production_manager"), validate(recipeSchema), setRecipe);

module.exports = router;
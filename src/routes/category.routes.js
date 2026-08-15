const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { categorySchema } = require("../validators/category.validator");
const { getCategories, createCategory } = require("../controllers/category.controller");

router.use(requireAuth);

router.get("/", getCategories);
router.post("/", validate(categorySchema), createCategory);

module.exports = router;
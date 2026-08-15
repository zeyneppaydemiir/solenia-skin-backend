const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { getLots } = require("../controllers/lot.controller");

router.use(requireAuth);
router.get("/", getLots);

module.exports = router;
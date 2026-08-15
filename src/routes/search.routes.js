const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { search } = require("../controllers/search.controller");

router.use(requireAuth);
router.get("/", search);

module.exports = router;
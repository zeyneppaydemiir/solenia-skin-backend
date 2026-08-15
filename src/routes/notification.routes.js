const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { getNotifications } = require("../controllers/notification.controller");

router.use(requireAuth);
router.get("/", getNotifications);

module.exports = router;
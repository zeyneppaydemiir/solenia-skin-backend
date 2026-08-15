const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { changePasswordSchema } = require("../validators/user.validator");
const { getMe, changePassword, getAllUsers } = require("../controllers/user.controller");

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me/password", validate(changePasswordSchema), changePassword);
router.get("/", requireRole("admin"), getAllUsers);

module.exports = router;
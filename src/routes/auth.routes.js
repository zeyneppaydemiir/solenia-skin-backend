const express = require("express");
const router = express.Router();
const validate = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const { register, login } = require("../controllers/auth.controller");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
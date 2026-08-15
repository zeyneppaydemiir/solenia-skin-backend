const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const requireRole = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { customerSchema, customerUpdateSchema } = require("../validators/customer.validator");
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");

router.use(requireAuth);

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.post("/", requireRole("sales_manager"), validate(customerSchema), createCustomer);
router.put("/:id", requireRole("sales_manager"), validate(customerUpdateSchema), updateCustomer);
router.delete("/:id", requireRole("sales_manager"), deleteCustomer);

module.exports = router;
const { z } = require("zod");

const ROLES = ["admin", "production_manager", "warehouse_manager", "sales_manager", "finance", "quality_manager", "viewer"];

const registerSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  role: z.enum(ROLES).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  password: z.string().min(1, "Şifre zorunlu"),
});

module.exports = { registerSchema, loginSchema, ROLES };
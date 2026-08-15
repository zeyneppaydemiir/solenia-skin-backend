const { z } = require("zod");

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre zorunlu"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
});

module.exports = { changePasswordSchema };
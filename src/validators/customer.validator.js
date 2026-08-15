const { z } = require("zod");

const customerSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir email girin").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

const customerUpdateSchema = customerSchema.partial();

module.exports = { customerSchema, customerUpdateSchema };
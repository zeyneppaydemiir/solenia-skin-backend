const { z } = require("zod");

const rawMaterialSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  code: z.string().min(2, "Kod en az 2 karakter olmalı"),
  unit: z.enum(["g", "kg", "ml", "l", "adet"]),
  stock: z.coerce.number().nonnegative("Stok negatif olamaz"),
  minStock: z.coerce.number().nonnegative().optional(),
  costPerUnit: z.coerce.number().nonnegative().optional(),
});

const rawMaterialUpdateSchema = rawMaterialSchema.partial();

module.exports = { rawMaterialSchema, rawMaterialUpdateSchema };
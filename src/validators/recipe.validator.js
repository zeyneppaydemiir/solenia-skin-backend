const { z } = require("zod");

const recipeSchema = z.object({
  items: z.array(
    z.object({
      rawMaterialId: z.coerce.number().int().positive(),
      quantityPerUnit: z.coerce.number().positive("Miktar sıfırdan büyük olmalı"),
    })
  ),
});

module.exports = { recipeSchema };
const { z } = require("zod");

const productionOrderSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive("Üretim miktarı sıfırdan büyük olmalı"),
});

module.exports = { productionOrderSchema };
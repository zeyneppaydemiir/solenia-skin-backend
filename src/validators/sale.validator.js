const { z } = require("zod");

const saleSchema = z.object({
  customerId: z.coerce.number().int().positive("Müşteri seçmelisin"),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive("Adet en az 1 olmalı"),
      })
    )
    .min(1, "En az 1 ürün eklemelisin"),
});

module.exports = { saleSchema };
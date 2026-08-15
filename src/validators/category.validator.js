const { z } = require("zod");

const categorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalı"),
});

module.exports = { categorySchema };
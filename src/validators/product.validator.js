const { z } = require("zod");

// coerce.number(): form'dan/JSON'dan string olarak gelse bile
// otomatik number'a çevirir - frontend'den zaten Number() ile
// gönderiyoruz ama backend'i tek başına da güvenli kılmak için var.
const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalı"),
  sku: z.string().min(2, "SKU en az 2 karakter olmalı"),
  price: z.coerce.number().positive("Fiyat sıfırdan büyük olmalı"),
  cost: z.coerce.number().nonnegative("Maliyet negatif olamaz").optional(),
  stock: z.coerce.number().int().nonnegative("Stok negatif olamaz"),
  lowStockAlert: z.coerce.number().int().nonnegative().optional(),
  categoryId: z.coerce.number().int().positive("Kategori seçmelisin"),
});

// Güncellemede tüm alanlar opsiyonel - kullanıcı sadece fiyatı
// değiştirmek isteyebilir, tüm alanları yeniden göndermek zorunda kalmamalı.
const productUpdateSchema = productSchema.partial();

module.exports = { productSchema, productUpdateSchema };
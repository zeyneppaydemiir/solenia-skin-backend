// Genel amaçlı validation middleware. Herhangi bir Zod şemasını alıp
// req.body'yi ona göre kontrol eder. Şema doğrularsa, "temizlenmiş"
// (örn. string'den number'a çevrilmiş) veriyi req.body'ye geri yazar -
// yani controller'lar artık Number(req.body.price) gibi manuel
// dönüşümler yapmak zorunda kalmaz.
function validate(schema) {
    return (req, res, next) => {
      const result = schema.safeParse(req.body);
  
      if (!result.success) {
        // Zod'un hata formatını kullanıcıya okunabilir hale getiriyoruz
        const errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return res.status(400).json({ error: "Geçersiz veri", details: errors });
      }
  
      req.body = result.data;
      next();
    };
  }
  
  module.exports = validate;
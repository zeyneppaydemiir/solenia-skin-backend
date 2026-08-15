const jwt = require("jsonwebtoken");

// Bu middleware'i korumak istediğimiz her route'a ekleyeceğiz.
// Örnek kullanım: router.get("/products", requireAuth, getProducts)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token bulunamadı" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role } - sonraki controller'larda req.user.id kullanacağız
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token geçersiz veya süresi dolmuş" });
  }
}

// Sadece admin'lerin erişebileceği route'lar için ekstra katman.
// requireAuth'tan SONRA kullanılmalı çünkü req.user'a ihtiyaç duyar.
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Bu işlem için admin yetkisi gerekli" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
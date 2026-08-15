// requireAuth'tan SONRA kullanılmalı - req.user'a ihtiyaç duyar.
// Kullanımı: router.post("/", requireRole("admin", "warehouse_manager"), createProduct)
function requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (req.user?.role === "admin" || allowedRoles.includes(req.user?.role)) {
        return next();
      }
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok" });
    };
  }
  
  module.exports = requireRole;
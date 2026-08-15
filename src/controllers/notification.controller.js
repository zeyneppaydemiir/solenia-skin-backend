const prisma = require("../lib/prisma");

// GET /api/notifications
// Kalıcı bir "Notification" tablosu tutmuyoruz - bunun yerine mevcut
// verilerden (düşük stok, kritik hammadde, yaklaşan SKT) her istekte
// canlı olarak bir bildirim listesi türetiyoruz. Bu, "okundu/okunmadı"
// gibi bir durumu kalıcı saklamıyor ama basit ve her zaman güncel kalıyor.
async function getNotifications(req, res) {
  const notifications = [];

  // 1) Düşük stoklu ürünler
  const lowStockProducts = await prisma.$queryRaw`
    SELECT id, name, stock, "lowStockAlert" FROM "Product" WHERE stock < "lowStockAlert"
  `;
  for (const p of lowStockProducts) {
    notifications.push({
      id: `low-stock-${p.id}`,
      type: "low_stock",
      severity: "critical",
      title: "Düşük stok",
      message: `${p.name} için sadece ${p.stock} adet kaldı`,
      link: "/inventory",
      createdAt: null,
    });
  }

  // 2) Kritik seviyedeki hammaddeler
  const lowMaterials = await prisma.$queryRaw`
    SELECT id, name, stock, "minStock", unit FROM "RawMaterial" WHERE stock < "minStock"
  `;
  for (const m of lowMaterials) {
    notifications.push({
      id: `low-material-${m.id}`,
      type: "low_material",
      severity: "warning",
      title: "Hammadde kritik seviyede",
      message: `${m.name}: ${m.stock} ${m.unit} kaldı (min: ${m.minStock} ${m.unit})`,
      link: "/raw-materials",
      createdAt: null,
    });
  }

  // 3) SKT'ye 30 günden az kalan lotlar
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringLots = await prisma.productLot.findMany({
    where: { expiryDate: { lte: thirtyDaysFromNow, gte: new Date() } },
    include: { product: true },
    orderBy: { expiryDate: "asc" },
  });
  for (const lot of expiringLots) {
    const daysLeft = Math.ceil((new Date(lot.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `expiry-${lot.id}`,
      type: "expiry",
      severity: daysLeft < 15 ? "critical" : "warning",
      title: "SKT yaklaşıyor",
      message: `${lot.product.name} (Lot ${lot.lotNumber}) - ${daysLeft} gün kaldı`,
      link: "/lots",
      createdAt: null,
    });
  }

  // En kritik olanlar en üstte
  const severityOrder = { critical: 0, warning: 1 };
  notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  res.json({ notifications, count: notifications.length });
}

module.exports = { getNotifications };
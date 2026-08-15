const prisma = require("../lib/prisma");

// GET /api/dashboard/inventory-analysis
async function getInventoryAnalysis(req, res) {
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  const ninetyDaysFromNow = new Date(now);
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  const products = await prisma.product.findMany({ include: { category: true } });

  // Son 90 gündeki satış kalemlerini ürün bazında topluyoruz -
  // hem devir hızı hem "dead stock" tespiti için bu veriye ihtiyacımız var.
  const recentSaleItems = await prisma.saleItem.findMany({
    where: { sale: { createdAt: { gte: ninetyDaysAgo } } },
    select: { productId: true, quantity: true },
  });
  const sold90ByProduct = {};
  for (const item of recentSaleItems) {
    sold90ByProduct[item.productId] = (sold90ByProduct[item.productId] || 0) + item.quantity;
  }

  // Yaklaşan SKT'li lotlar (90 gün içinde)
  const expiringLots = await prisma.productLot.findMany({
    where: { expiryDate: { lte: ninetyDaysFromNow, gte: now } },
    include: { product: true },
    orderBy: { expiryDate: "asc" },
  });
  const expiringProductIds = new Set(expiringLots.map((l) => l.productId));

  // --- 1) Stok Durum Özeti (donut için) ---
  // Her ürünü TEK bir kovaya atıyoruz, önem sırasına göre:
  // Stokta Yok > Kritik Stok > SKT Yaklaşan > Yeterli Stok
  let outOfStock = 0, critical = 0, expiringSoon = 0, sufficient = 0;
  for (const p of products) {
    if (p.stock === 0) outOfStock++;
    else if (p.stock < p.lowStockAlert) critical++;
    else if (expiringProductIds.has(p.id)) expiringSoon++;
    else sufficient++;
  }

  const stockStatusBreakdown = [
    { status: "Yeterli Stok", count: sufficient, color: "#8A9A5B" },
    { status: "Kritik Stok", count: critical, color: "#D4A03C" },
    { status: "SKT Yaklaşan", count: expiringSoon, color: "#4A7059" },
    { status: "Stokta Yok", count: outOfStock, color: "#B3452C" },
  ];

  // --- 2) Stok Devir Hızı ---
  // Basit bir yaklaşım: son 90 gündeki satış miktarı / mevcut stok.
  // 1'e yakın veya üstü -> stok sık dönüyor (hızlı satan).
  // 0'a yakın -> stok yerinde duruyor (yavaş satan / durgun).
  const turnover = products
    .filter((p) => p.stock > 0)
    .map((p) => {
      const sold90 = sold90ByProduct[p.id] || 0;
      const ratio = Math.round((sold90 / p.stock) * 100) / 100;
      const speed = ratio >= 1 ? "fast" : ratio >= 0.3 ? "medium" : "slow";
      return { productId: p.id, name: p.name, stock: p.stock, sold90, ratio, speed };
    })
    .sort((a, b) => b.ratio - a.ratio);

  // --- 3) Dead Stock (son 90 günde hiç satılmamış ama stokta olan ürünler) ---
  const deadStock = products
    .filter((p) => p.stock > 0 && !sold90ByProduct[p.id])
    .map((p) => ({ productId: p.id, name: p.name, stock: p.stock, category: p.category.name }))
    .sort((a, b) => b.stock - a.stock);

  // --- 4) Kritik Stok Listesi ---
  const criticalStock = products
    .filter((p) => p.stock < p.lowStockAlert)
    .map((p) => ({ productId: p.id, name: p.name, stock: p.stock, lowStockAlert: p.lowStockAlert }))
    .sort((a, b) => a.stock - b.stock);

  // --- 5) SKT Riski (lot bazında, aciliyet sırasına göre) ---
  const expiryRisk = expiringLots.map((lot) => {
    const daysLeft = Math.ceil((new Date(lot.expiryDate) - now) / (1000 * 60 * 60 * 24));
    return {
      lotNumber: lot.lotNumber,
      productName: lot.product.name,
      quantity: lot.quantity,
      expiryDate: lot.expiryDate,
      daysLeft,
      severity: daysLeft < 30 ? "critical" : daysLeft < 60 ? "warning" : "notice",
    };
  });

  res.json({ stockStatusBreakdown, turnover, deadStock, criticalStock, expiryRisk });
}

module.exports = { getInventoryAnalysis };
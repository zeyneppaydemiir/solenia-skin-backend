const prisma = require("../lib/prisma");

// GET /api/dashboard/sales-analysis
async function getSalesAnalysis(req, res) {
  const products = await prisma.product.findMany({ include: { category: true } });
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { status: "completed" } },
    include: { product: { include: { category: true } }, sale: { select: { createdAt: true } } },
  });

  // Her ürün için satış istatistiklerini topluyoruz - hiç satılmamış
  // ürünler de listede 0 olarak yer alsın diye önce tüm ürünlerle
  // başlangıç objesi kuruyoruz, sonra satışlarla dolduruyoruz.
  const productStats = {};
  for (const p of products) {
    productStats[p.id] = {
      productId: p.id,
      name: p.name,
      category: p.category.name,
      quantity: 0,
      revenue: 0,
      cost: 0,
    };
  }
  for (const item of saleItems) {
    const stat = productStats[item.productId];
    if (!stat) continue;
    stat.quantity += item.quantity;
    stat.revenue += item.quantity * item.unitPrice;
    stat.cost += item.quantity * item.product.cost;
  }
  const productList = Object.values(productStats);

  const topProducts = [...productList].sort((a, b) => b.quantity - a.quantity).slice(0, 8);
  const bottomProducts = [...productList].sort((a, b) => a.quantity - b.quantity).slice(0, 8);

  // Kategori bazlı toplama
  const categoryMap = {};
  for (const stat of productList) {
    if (!categoryMap[stat.category]) categoryMap[stat.category] = { category: stat.category, quantity: 0, revenue: 0 };
    categoryMap[stat.category].quantity += stat.quantity;
    categoryMap[stat.category].revenue += stat.revenue;
  }
  const categorySales = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

  // Aylık satış (miktar + gelir)
  const monthlyMap = {};
  for (const item of saleItems) {
    const d = new Date(item.sale.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, quantity: 0, revenue: 0 };
    monthlyMap[key].quantity += item.quantity;
    monthlyMap[key].revenue += item.quantity * item.unitPrice;
  }
  const monthlySales = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  // Kâr analizi - sadece en az 1 satılan ürünler için anlamlı
  const profitAnalysis = productList
    .filter((p) => p.quantity > 0)
    .map((p) => ({
      ...p,
      profit: p.revenue - p.cost,
      marginPercent: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.profit - a.profit);

  const totalRevenue = productList.reduce((s, p) => s + p.revenue, 0);
  const totalCost = productList.reduce((s, p) => s + p.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const overallMarginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;

  res.json({
    topProducts,
    bottomProducts,
    categorySales,
    monthlySales,
    profitAnalysis,
    totalRevenue,
    totalCost,
    totalProfit,
    overallMarginPercent,
  });
}

module.exports = { getSalesAnalysis };
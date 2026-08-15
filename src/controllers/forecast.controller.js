const prisma = require("../lib/prisma");

// Basit doğrusal regresyon (least squares).
// x: [0, 1, 2, ...] ay index'leri, y: o aydaki satış miktarları.
// Döndürdüğü {slope, intercept} ile "bir sonraki ay ne kadar satılır" tahmin ediyoruz.
function linearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// GET /api/dashboard/forecast
async function getForecast(req, res) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  // Son 6 ayın tüm satış kalemlerini, hangi üründen olduğu ve tarihiyle çekiyoruz
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { createdAt: { gte: sixMonthsAgo }, status: "completed" } },
    include: { product: true, sale: { select: { createdAt: true } } },
  });

  // Son 6 ayın "ay anahtarlarını" (ör. "2026-03") sırayla üretiyoruz.
  // Bu, bir üründe hiç satış olmayan ayları da 0 olarak seride tutmamızı sağlıyor -
  // yoksa regresyon eksik verilerle yanlış eğim hesaplar.
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }

  // productId -> { name, stock, monthly: { "2026-03": 12, ... } }
  const productMap = {};
  for (const item of saleItems) {
    const key = item.productId;
    if (!productMap[key]) {
      productMap[key] = {
        name: item.product.name,
        stock: item.product.stock,
        monthly: Object.fromEntries(months.map((m) => [m, 0])),
      };
    }
    const mk = monthKey(new Date(item.sale.createdAt));
    if (mk in productMap[key].monthly) {
      productMap[key].monthly[mk] += item.quantity;
    }
  }

  const forecasts = Object.entries(productMap).map(([productId, data]) => {
    const series = months.map((m, i) => ({ x: i, y: data.monthly[m] }));
    const totalSold = series.reduce((s, p) => s + p.y, 0);

    // En az 2 ayda satış olmalı ki anlamlı bir trend hesaplayalım
    const monthsWithSales = series.filter((p) => p.y > 0).length;
    if (monthsWithSales < 2) {
      return {
        productId: Number(productId),
        name: data.name,
        stock: data.stock,
        monthlySales: months.map((m) => ({ month: m, quantity: data.monthly[m] })),
        forecastNextMonth: null,
        recommendedProduction: null,
        note: "Yeterli satış geçmişi yok",
      };
    }

    const { slope, intercept } = linearRegression(series);
    const nextMonthIndex = months.length; // bir sonraki ay
    const rawForecast = intercept + slope * nextMonthIndex;
    const forecastNextMonth = Math.max(0, Math.round(rawForecast));

    // Öneri: tahmin edilen talep, mevcut stoktan fazlaysa aradaki farkı üret
    const recommendedProduction = Math.max(0, forecastNextMonth - data.stock);

    return {
      productId: Number(productId),
      name: data.name,
      stock: data.stock,
      monthlySales: months.map((m) => ({ month: m, quantity: data.monthly[m] })),
      forecastNextMonth,
      trend: slope > 0.5 ? "up" : slope < -0.5 ? "down" : "stable",
      recommendedProduction,
    };
  });

  // En çok satılandan en aza sırala - dashboard'da öncelikli ürünler üstte görünsün
  forecasts.sort((a, b) => (b.forecastNextMonth || 0) - (a.forecastNextMonth || 0));

  res.json(forecasts);
}

module.exports = { getForecast };
const prisma = require("../lib/prisma");

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// GET /api/dashboard/production-analysis
async function getProductionAnalysis(req, res) {
  const orders = await prisma.productionOrder.findMany({
    where: { status: "completed" },
    include: {
      product: {
        include: { recipeItems: { include: { rawMaterial: true } } },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const batchPerformance = orders.map((o) => {
    const totalUnits = o.quantity + o.wastageQuantity;
    const costPerUnit = o.product.recipeItems.reduce(
      (sum, item) => sum + item.quantityPerUnit * item.rawMaterial.costPerUnit,
      0
    );
    const totalCost = Math.round(costPerUnit * totalUnits * 100) / 100;
    const wastagePercent = totalUnits > 0 ? Math.round((o.wastageQuantity / totalUnits) * 1000) / 10 : 0;
    const daysAgo = Math.floor((new Date() - new Date(o.completedAt)) / (1000 * 60 * 60 * 24));

    return {
      orderId: o.id,
      productName: o.product.name,
      quantity: o.quantity,
      wastageQuantity: o.wastageQuantity,
      wastagePercent,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      totalCost,
      completedAt: o.completedAt,
      daysAgo,
    };
  });

  const monthlyMap = {};
  for (const b of batchPerformance) {
    const key = monthKey(b.completedAt);
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, quantity: 0, cost: 0 };
    monthlyMap[key].quantity += b.quantity;
    monthlyMap[key].cost += b.totalCost;
  }
  const monthlyProduction = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  const productWastageMap = {};
  for (const o of orders) {
    const key = o.product.name;
    if (!productWastageMap[key]) productWastageMap[key] = { name: key, produced: 0, wasted: 0 };
    productWastageMap[key].produced += o.quantity;
    productWastageMap[key].wasted += o.wastageQuantity;
  }
  const wastageByProduct = Object.values(productWastageMap)
    .map((p) => ({
      ...p,
      wastagePercent: p.produced + p.wasted > 0 ? Math.round((p.wasted / (p.produced + p.wasted)) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.wastagePercent - a.wastagePercent);

  const totalProduced = orders.reduce((s, o) => s + o.quantity, 0);
  const totalWasted = orders.reduce((s, o) => s + o.wastageQuantity, 0);
  const totalCost = batchPerformance.reduce((s, b) => s + b.totalCost, 0);
  const overallWastagePercent =
    totalProduced + totalWasted > 0 ? Math.round((totalWasted / (totalProduced + totalWasted)) * 1000) / 10 : 0;

  res.json({
    totalProduced,
    totalWasted,
    totalCost: Math.round(totalCost * 100) / 100,
    overallWastagePercent,
    monthlyProduction,
    wastageByProduct,
    batchPerformance: batchPerformance.slice(0, 20),
  });
}

module.exports = { getProductionAnalysis };
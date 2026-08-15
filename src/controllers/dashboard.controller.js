const prisma = require("../lib/prisma");

async function getSummary(req, res) {
  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: { sale: { status: "completed" } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const topProducts = await Promise.all(
    topProductsRaw.map(async (row) => {
      const product = await prisma.product.findUnique({
        where: { id: row.productId },
        select: { id: true, name: true, sku: true },
      });
      return { ...product, totalSold: row._sum.quantity };
    })
  );

  const monthlyRevenueRaw = await prisma.$queryRaw`
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM') AS month,
      SUM("totalAmount") AS revenue
    FROM "Sale"
    WHERE status = 'completed'
    GROUP BY month
    ORDER BY month ASC
  `;
  const monthlyRevenue = monthlyRevenueRaw.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue),
  }));

  const lowStockProducts = await prisma.$queryRaw`
    SELECT id, name, sku, stock, "lowStockAlert"
    FROM "Product"
    WHERE stock < "lowStockAlert"
    ORDER BY stock ASC
  `;

  const totalRevenueResult = await prisma.sale.aggregate({
    where: { status: "completed" },
    _sum: { totalAmount: true },
  });
  const totalCustomers = await prisma.customer.count();
  const totalProducts = await prisma.product.count();
  const totalSales = await prisma.sale.count({ where: { status: "completed" } });

  res.json({
    totalRevenue: totalRevenueResult._sum.totalAmount || 0,
    totalCustomers,
    totalProducts,
    totalSales,
    topProducts,
    monthlyRevenue,
    lowStockProducts,
  });
}

async function getCustomerSegments(req, res) {
  const customers = await prisma.customer.findMany({
    include: { sales: { where: { status: "completed" }, select: { totalAmount: true } } },
  });

  const segmented = customers.map((c) => {
    const totalSpent = c.sales.reduce((sum, s) => sum + s.totalAmount, 0);

    let segment;
    if (c.sales.length === 0) segment = "New";
    else if (totalSpent >= 5000) segment = "VIP";
    else segment = "Regular";

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      totalSpent,
      orderCount: c.sales.length,
      segment,
    };
  });

  segmented.sort((a, b) => b.totalSpent - a.totalSpent);

  res.json(segmented);
}

module.exports = { getSummary, getCustomerSegments };
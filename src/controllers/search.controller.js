const prisma = require("../lib/prisma");

// GET /api/search?q=vitamin
async function search(req, res) {
  const q = (req.query.q || "").trim();

  if (q.length < 2) {
    return res.json({ products: [], customers: [] });
  }

  // Prisma'da "contains" + "mode: insensitive" ile büyük/küçük harf
  // duyarsız arama yapıyoruz. Ürün ve müşteri sorgularını paralel
  // çalıştırıyoruz - birbirini beklemeden ikisi de aynı anda döner.
  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, sku: true, stock: true },
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
  ]);

  res.json({ products, customers });
}

module.exports = { search };
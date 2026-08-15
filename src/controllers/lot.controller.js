const prisma = require("../lib/prisma");

// GET /api/lots
async function getLots(req, res) {
  const lots = await prisma.productLot.findMany({
    include: { product: true },
    orderBy: { expiryDate: "asc" }, // en yakın SKT en üstte
  });
  res.json(lots);
}

module.exports = { getLots };
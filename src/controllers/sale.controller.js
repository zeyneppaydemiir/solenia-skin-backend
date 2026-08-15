const prisma = require("../lib/prisma");

// GET /api/sales?page=1&limit=10
async function getSales(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 10);

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count(),
  ]);

  res.json({
    data: sales,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// GET /api/sales/:id
async function getSale(req, res) {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      customer: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  if (!sale) return res.status(404).json({ error: "Satış bulunamadı" });
  res.json(sale);
}

// POST /api/sales
async function createSale(req, res) {
  const { customerId, items } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product) throw new Error(`Ürün bulunamadı: id=${item.productId}`);
        if (product.stock < item.quantity) {
          throw new Error(
            `Yetersiz stok: "${product.name}" için ${product.stock} adet var, ${item.quantity} istendi`
          );
        }

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        const lineTotal = product.price * item.quantity;
        totalAmount += lineTotal;

        saleItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      const sale = await tx.sale.create({
        data: {
          customerId,
          userId: req.user.id,
          totalAmount,
          items: { create: saleItemsData },
        },
        include: { items: { include: { product: true } }, customer: true },
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    if (err.message.startsWith("Ürün bulunamadı") || err.message.startsWith("Yetersiz stok")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Satış oluşturulamadı" });
  }
}

// PUT /api/sales/:id/cancel
// İptal edilen satışın her kalemi için stoğu GERİ EKLİYORUZ.
// Satış silinmiyor - "cancelled" olarak işaretleniyor, böylece geçmiş
// kayıtta tutuluyor (muhasebe/denetim için silme asla doğru değil).
async function cancelSale(req, res) {
  const saleId = Number(req.params.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale) throw new Error("Satış bulunamadı");
      if (sale.status === "cancelled") throw new Error("Bu satış zaten iptal edilmiş");

      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.sale.update({
        where: { id: saleId },
        data: { status: "cancelled", cancelledAt: new Date() },
        include: { customer: true, items: { include: { product: true } } },
      });
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Satış iptal edilemedi" });
  }
}

module.exports = { getSales, getSale, createSale, cancelSale };
const prisma = require("../lib/prisma");

// GET /api/production-orders
async function getProductionOrders(req, res) {
  const orders = await prisma.productionOrder.findMany({
    include: { product: true, lot: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
}

// POST /api/production-orders
// Beklenen body: { productId, quantity }
//
// Bu, Faz 5'teki satış transaction'ıyla aynı prensipte çalışır ama tersine:
// satışta STOK AZALIR, burada hammadde stoğu AZALIR + ürün stoğu ARTAR.
// Her şey tek bir $transaction içinde - reçete eksikse veya hammadde
// yetersizse HİÇBİR ŞEY değişmeden işlem tamamen iptal olur (rollback).
async function createProductionOrder(req, res) {
  const { productId, quantity } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Ürün bulunamadı");

      const recipeItems = await tx.recipeItem.findMany({
        where: { productId },
        include: { rawMaterial: true },
      });

      if (recipeItems.length === 0) {
        throw new Error("Bu ürünün henüz bir reçetesi yok - önce reçete tanımla");
      }

      // Önce TÜM hammaddelerin yeterli olup olmadığını kontrol ediyoruz.
      // Kontrolü döngünün başında ayrı yapmamızın sebebi: "ilk 2 hammadde
      // düşüldükten sonra 3.'sünde yetersiz stok" durumunda yarım kalmış
      // bir işlem istemiyoruz - transaction zaten rollback yapar ama
      // önce kontrol etmek daha temiz bir hata mesajı vermemizi sağlıyor.
      for (const item of recipeItems) {
        const needed = item.quantityPerUnit * quantity;
        if (item.rawMaterial.stock < needed) {
          throw new Error(
            `Yetersiz hammadde: "${item.rawMaterial.name}" için ${item.rawMaterial.stock} ${item.rawMaterial.unit} var, ${needed} ${item.rawMaterial.unit} gerekiyor`
          );
        }
      }

      // Hammaddeleri düş
      for (const item of recipeItems) {
        const needed = item.quantityPerUnit * quantity;
        await tx.rawMaterial.update({
          where: { id: item.rawMaterialId },
          data: { stock: { decrement: needed } },
        });
      }

      // Ürün stoğunu artır
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });

      // Üretim emrini "tamamlandı" olarak oluştur
      const order = await tx.productionOrder.create({
        data: {
          productId,
          quantity,
          status: "completed",
          completedAt: new Date(),
        },
      });

      // Lot numarası: SKU + tarih + sıra no, benzersiz olması yeterli.
      // Gerçek üretimde daha katı bir standart (örn. YYYYMMDD-001) kullanılır,
      // burada basitçe timestamp ekliyoruz.
      const lotNumber = `${product.sku}-${Date.now()}`;
      const productionDate = new Date();
      const expiryDate = new Date(productionDate);
      expiryDate.setMonth(expiryDate.getMonth() + product.shelfLifeMonths);

      const lot = await tx.productLot.create({
        data: {
          lotNumber,
          productId,
          productionOrderId: order.id,
          quantity,
          productionDate,
          expiryDate,
        },
      });

      return { ...order, lot };
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    if (err.message.startsWith("Yetersiz hammadde") || err.message.includes("reçetesi yok") || err.message === "Ürün bulunamadı") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Üretim emri oluşturulamadı" });
  }
}

module.exports = { getProductionOrders, createProductionOrder };
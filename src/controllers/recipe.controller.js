const prisma = require("../lib/prisma");

// GET /api/recipes/:productId
async function getRecipe(req, res) {
  const items = await prisma.recipeItem.findMany({
    where: { productId: Number(req.params.productId) },
    include: { rawMaterial: true },
  });
  res.json(items);
}

// PUT /api/recipes/:productId
// Beklenen body: { items: [{ rawMaterialId, quantityPerUnit }, ...] }
// Reçeteyi TAMAMEN yeniden yazıyoruz - eskisini silip yenisini oluşturuyoruz.
// Bu, "hangi kalem eklendi/çıkarıldı" diye tek tek uğraşmaktan daha basit
// ve reçete satır sayısı az olduğu için performans sorunu yaratmaz.
async function setRecipe(req, res) {
  const productId = Number(req.params.productId);
  const { items } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { productId } });

      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((item) => ({
            productId,
            rawMaterialId: item.rawMaterialId,
            quantityPerUnit: item.quantityPerUnit,
          })),
        });
      }

      return tx.recipeItem.findMany({
        where: { productId },
        include: { rawMaterial: true },
      });
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Reçete kaydedilemedi" });
  }
}

module.exports = { getRecipe, setRecipe };
const prisma = require("../lib/prisma");

// GET /api/products?page=1&limit=10&search=vitamin
async function getProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 10);
  const search = req.query.search || "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  // Toplam kayıt sayısını ve o sayfadaki kayıtları PARALEL çekiyoruz -
  // ikisi de aynı "where" filtresini kullanıyor, birbirini beklemeden
  // aynı anda çalışıyor, sonra ikisini birlikte döndürüyoruz.
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: Number(req.params.id) },
    include: { category: true },
  });
  if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });
  res.json(product);
}

async function createProduct(req, res) {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Bu SKU zaten kullanılıyor" });
    }
    console.error(err);
    res.status(500).json({ error: "Ürün oluşturulamadı" });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(product);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    res.status(500).json({ error: "Ürün güncellenemedi" });
  }
}

async function deleteProduct(req, res) {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    res.status(500).json({ error: "Ürün silinemedi" });
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
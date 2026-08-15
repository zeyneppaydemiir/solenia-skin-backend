const prisma = require("../lib/prisma");

async function getCategories(req, res) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
}

async function createCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name zorunlu" });

    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Bu kategori zaten var" });
    }
    res.status(500).json({ error: "Kategori oluşturulamadı" });
  }
}

module.exports = { getCategories, createCategory };
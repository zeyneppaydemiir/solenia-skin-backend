const prisma = require("../lib/prisma");

async function getRawMaterials(req, res) {
  const materials = await prisma.rawMaterial.findMany({ orderBy: { name: "asc" } });
  res.json(materials);
}

async function createRawMaterial(req, res) {
  try {
    const material = await prisma.rawMaterial.create({ data: req.body });
    res.status(201).json(material);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Bu kod zaten kullanılıyor" });
    }
    res.status(500).json({ error: "Hammadde oluşturulamadı" });
  }
}

async function updateRawMaterial(req, res) {
  try {
    const material = await prisma.rawMaterial.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(material);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Hammadde bulunamadı" });
    res.status(500).json({ error: "Hammadde güncellenemedi" });
  }
}

async function deleteRawMaterial(req, res) {
  try {
    await prisma.rawMaterial.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Hammadde bulunamadı" });
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Bu hammadde bir reçetede kullanıldığı için silinemez" });
    }
    res.status(500).json({ error: "Hammadde silinemedi" });
  }
}

module.exports = { getRawMaterials, createRawMaterial, updateRawMaterial, deleteRawMaterial };
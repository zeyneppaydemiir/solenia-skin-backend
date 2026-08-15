const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const rawMaterials = [
  { code: "RM-001", name: "Saf Su", unit: "l", stock: 500, minStock: 50, costPerUnit: 2 },
  { code: "RM-002", name: "Gliserin", unit: "kg", stock: 100, minStock: 10, costPerUnit: 45 },
  { code: "RM-003", name: "Koruyucu (Fenoksietanol)", unit: "kg", stock: 20, minStock: 3, costPerUnit: 180 },
  { code: "RM-004", name: "Emülgatör", unit: "kg", stock: 30, minStock: 5, costPerUnit: 120 },
  { code: "RM-005", name: "Hyaluronik Asit", unit: "kg", stock: 10, minStock: 1, costPerUnit: 850 },
  { code: "RM-006", name: "Vitamin C (Askorbik Asit)", unit: "kg", stock: 10, minStock: 1, costPerUnit: 320 },
  { code: "RM-007", name: "SPF Filtre (Titanyum Dioksit)", unit: "kg", stock: 15, minStock: 2, costPerUnit: 210 },
  { code: "RM-008", name: "Niacinamide", unit: "kg", stock: 8, minStock: 1, costPerUnit: 290 },
  { code: "RM-009", name: "Retinol", unit: "kg", stock: 5, minStock: 0.5, costPerUnit: 1200 },
  { code: "RM-010", name: "Squalane", unit: "kg", stock: 12, minStock: 1, costPerUnit: 480 },
  { code: "RM-011", name: "Peptit Kompleksi", unit: "kg", stock: 4, minStock: 0.5, costPerUnit: 1500 },
  { code: "RM-012", name: "Cam Şişe 30ml", unit: "adet", stock: 2000, minStock: 200, costPerUnit: 7 },
  { code: "RM-013", name: "Cam Şişe 50ml", unit: "adet", stock: 1500, minStock: 150, costPerUnit: 9 },
  { code: "RM-014", name: "Tüp Ambalaj 50ml", unit: "adet", stock: 1500, minStock: 150, costPerUnit: 6 },
  { code: "RM-015", name: "Roll-On Ambalaj", unit: "adet", stock: 1000, minStock: 100, costPerUnit: 5 },
  { code: "RM-016", name: "Etiket", unit: "adet", stock: 4000, minStock: 400, costPerUnit: 0.5 },
  { code: "RM-017", name: "Kutu Ambalaj", unit: "adet", stock: 1500, minStock: 150, costPerUnit: 4 },
];

const recipes = {
  "SOL-CLN-001": [{ code: "RM-001", qty: 0.08 }, { code: "RM-004", qty: 0.005 }, { code: "RM-003", qty: 0.001 }, { code: "RM-014", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-CLN-002": [{ code: "RM-001", qty: 0.15 }, { code: "RM-003", qty: 0.001 }, { code: "RM-013", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-CLN-003": [{ code: "RM-001", qty: 0.1 }, { code: "RM-004", qty: 0.008 }, { code: "RM-003", qty: 0.001 }, { code: "RM-014", qty: 1 }, { code: "RM-016", qty: 1 }],

  "SOL-SER-001": [{ code: "RM-001", qty: 0.02 }, { code: "RM-006", qty: 0.01 }, { code: "RM-005", qty: 0.002 }, { code: "RM-003", qty: 0.001 }, { code: "RM-012", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-SER-002": [{ code: "RM-001", qty: 0.025 }, { code: "RM-005", qty: 0.004 }, { code: "RM-002", qty: 0.003 }, { code: "RM-012", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-SER-003": [{ code: "RM-001", qty: 0.02 }, { code: "RM-008", qty: 0.005 }, { code: "RM-002", qty: 0.002 }, { code: "RM-012", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-SER-004": [{ code: "RM-001", qty: 0.015 }, { code: "RM-009", qty: 0.001 }, { code: "RM-010", qty: 0.002 }, { code: "RM-012", qty: 1 }, { code: "RM-016", qty: 1 }],

  "SOL-MOI-001": [{ code: "RM-001", qty: 0.03 }, { code: "RM-002", qty: 0.005 }, { code: "RM-004", qty: 0.004 }, { code: "RM-003", qty: 0.001 }, { code: "RM-014", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-MOI-002": [{ code: "RM-001", qty: 0.025 }, { code: "RM-010", qty: 0.005 }, { code: "RM-011", qty: 0.001 }, { code: "RM-014", qty: 1 }, { code: "RM-017", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-MOI-003": [{ code: "RM-010", qty: 0.008 }, { code: "RM-002", qty: 0.006 }, { code: "RM-004", qty: 0.003 }, { code: "RM-014", qty: 1 }, { code: "RM-016", qty: 1 }],

  "SOL-SUN-001": [{ code: "RM-001", qty: 0.025 }, { code: "RM-007", qty: 0.015 }, { code: "RM-002", qty: 0.005 }, { code: "RM-014", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-SUN-002": [{ code: "RM-001", qty: 0.03 }, { code: "RM-007", qty: 0.01 }, { code: "RM-013", qty: 1 }, { code: "RM-016", qty: 1 }],

  "SOL-EYE-001": [{ code: "RM-001", qty: 0.01 }, { code: "RM-005", qty: 0.003 }, { code: "RM-011", qty: 0.001 }, { code: "RM-014", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-EYE-002": [{ code: "RM-001", qty: 0.008 }, { code: "RM-005", qty: 0.002 }, { code: "RM-015", qty: 1 }, { code: "RM-016", qty: 1 }],
  "SOL-EYE-003": [{ code: "RM-001", qty: 0.009 }, { code: "RM-008", qty: 0.002 }, { code: "RM-011", qty: 0.0008 }, { code: "RM-015", qty: 1 }, { code: "RM-016", qty: 1 }],
};

async function main() {
  console.log("Hammaddeler oluşturuluyor...");
  const materialByCode = {};
  for (const rm of rawMaterials) {
    const material = await prisma.rawMaterial.upsert({ where: { code: rm.code }, update: {}, create: rm });
    materialByCode[rm.code] = material;
  }

  console.log("Reçeteler oluşturuluyor...");
  for (const [sku, items] of Object.entries(recipes)) {
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) {
      console.log(`  Atlandı: ${sku} - ürün bulunamadı`);
      continue;
    }
    for (const item of items) {
      const material = materialByCode[item.code];
      await prisma.recipeItem.upsert({
        where: { productId_rawMaterialId: { productId: product.id, rawMaterialId: material.id } },
        update: { quantityPerUnit: item.qty },
        create: { productId: product.id, rawMaterialId: material.id, quantityPerUnit: item.qty },
      });
    }
    console.log(`  ${product.name}: ${items.length} hammadde eklendi`);
  }
  console.log("Tamamlandı!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
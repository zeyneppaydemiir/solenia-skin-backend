const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

function randomDateInLastMonths(months) {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seed başlıyor (Solenia Skin - cilt bakım markası)...");

  const existingUser = await prisma.user.findUnique({ where: { email: "admin@solenia.com" } });
  let user = existingUser;
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@solenia.com",
        password: await bcrypt.hash("admin123", 10),
        name: "Admin",
        role: "admin",
      },
    });
  }
  // --- Test için farklı rollerde kullanıcılar ---
  const roleUsers = [
    { email: "uretim@solenia.com", name: "Ayşe Üretim", role: "production_manager" },
    { email: "depo@solenia.com", name: "Mert Depo", role: "warehouse_manager" },
    { email: "satis@solenia.com", name: "Selin Satış", role: "sales_manager" },
    { email: "finans@solenia.com", name: "Kaan Finans", role: "finance" },
    { email: "kalite@solenia.com", name: "Ece Kalite", role: "quality_manager" },
  ];
  for (const ru of roleUsers) {
    await prisma.user.upsert({
      where: { email: ru.email },
      update: {},
      create: { ...ru, password: await bcrypt.hash("123456", 10) },
    });
  }

  // --- Kategoriler: sadece cilt bakımı alt dalları ---
  const categoryNames = ["Temizleyiciler", "Serumlar", "Nemlendiriciler", "Güneş Bakımı", "Göz Bakımı"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories.push(category);
  }

  // --- Ürünler: hepsi "Solenia" markalı, sadece cilt bakımı ---
  const productData = [
    { name: "Solenia Gentle Cleanser", sku: "SOL-CLN-001", price: 349, cost: 140, category: "Temizleyiciler" },
    { name: "Solenia Micellar Water", sku: "SOL-CLN-002", price: 299, cost: 110, category: "Temizleyiciler" },
    { name: "Solenia Foaming Cleanser", sku: "SOL-CLN-003", price: 329, cost: 130, category: "Temizleyiciler" },

    { name: "Solenia Vitamin C Serum", sku: "SOL-SER-001", price: 649, cost: 280, category: "Serumlar" },
    { name: "Solenia Hyaluronic Acid Serum", sku: "SOL-SER-002", price: 599, cost: 260, category: "Serumlar" },
    { name: "Solenia Niacinamide Serum", sku: "SOL-SER-003", price: 549, cost: 230, category: "Serumlar" },
    { name: "Solenia Retinol Serum", sku: "SOL-SER-004", price: 699, cost: 310, category: "Serumlar" },

    { name: "Solenia Daily Moisturizer", sku: "SOL-MOI-001", price: 449, cost: 190, category: "Nemlendiriciler" },
    { name: "Solenia Night Repair Cream", sku: "SOL-MOI-002", price: 599, cost: 260, category: "Nemlendiriciler" },
    { name: "Solenia Barrier Repair Balm", sku: "SOL-MOI-003", price: 529, cost: 220, category: "Nemlendiriciler" },

    { name: "Solenia Radiance SPF50", sku: "SOL-SUN-001", price: 479, cost: 200, category: "Güneş Bakımı" },
    { name: "Solenia Glow Sun Mist SPF30", sku: "SOL-SUN-002", price: 399, cost: 165, category: "Güneş Bakımı" },

    { name: "Solenia Eye Cream", sku: "SOL-EYE-001", price: 499, cost: 210, category: "Göz Bakımı" },
    { name: "Solenia Eye Serum Roll-On", sku: "SOL-EYE-002", price: 449, cost: 190, category: "Göz Bakımı" },
    { name: "Solenia Dark Circle Corrector", sku: "SOL-EYE-003", price: 529, cost: 225, category: "Göz Bakımı" },
  ];

  const products = [];
  for (const p of productData) {
    const category = categories.find((c) => c.name === p.category);
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        stock: randomInt(10, 90),
        lowStockAlert: 15,
        shelfLifeMonths: 24,
        categoryId: category.id,
      },
    });
    products.push(product);
  }

  await prisma.product.update({ where: { sku: "SOL-SER-004" }, data: { stock: 4 } });
  await prisma.product.update({ where: { sku: "SOL-EYE-003" }, data: { stock: 7 } });

  // --- Müşteriler ---
  const customerData = [
    { name: "Ahmet Yılmaz", email: "ahmet2@test.com", phone: "5551110001" },
    { name: "Elif Demir", email: "elif@test.com", phone: "5551110002" },
    { name: "Mehmet Kaya", email: "mehmet@test.com", phone: "5551110003" },
    { name: "Zeynep Şahin", email: "zeynepsahin@test.com", phone: "5551110004" },
    { name: "Can Öztürk", email: "can@test.com", phone: "5551110005" },
    { name: "Selin Arslan", email: "selin@test.com", phone: "5551110006" },
    { name: "Burak Çelik", email: "burak@test.com", phone: "5551110007" },
    { name: "Deniz Yıldız", email: "deniz@test.com", phone: "5551110008" },
  ];

  const customers = [];
  for (const c of customerData) {
    const customer = await prisma.customer.upsert({ where: { email: c.email }, update: {}, create: c });
    customers.push(customer);
  }

  // --- Satışlar (son 6 aya yayılmış, 70 adet) ---
  console.log("Satışlar oluşturuluyor...");
  for (let i = 0; i < 70; i++) {
    const customer = customers[randomInt(0, customers.length - 1)];
    const itemCount = randomInt(1, 3);
    const chosenProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, itemCount);

    let totalAmount = 0;
    const items = chosenProducts.map((p) => {
      const quantity = randomInt(1, 4);
      totalAmount += p.price * quantity;
      return { productId: p.id, quantity, unitPrice: p.price };
    });

    await prisma.sale.create({
      data: {
        customerId: customer.id,
        userId: user.id,
        totalAmount,
        createdAt: randomDateInLastMonths(6),
        items: { create: items },
      },
    });
  }

  console.log("Seed tamamlandı! Solenia Skin: 5 kategori, 15 ürün, 8 müşteri, 70 satış");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
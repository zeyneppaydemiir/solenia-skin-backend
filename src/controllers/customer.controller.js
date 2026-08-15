const prisma = require("../lib/prisma");

// GET /api/customers?page=1&limit=10&search=ahmet
async function getCustomers(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 10);
  const search = req.query.search || "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    data: customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

async function getCustomer(req, res) {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      sales: {
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
    },
  });

  if (!customer) return res.status(404).json({ error: "Müşteri bulunamadı" });

  const totalSpent = customer.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  res.json({ ...customer, totalSpent });
}

async function createCustomer(req, res) {
  try {
    const { name, email, phone } = req.body;
    const customer = await prisma.customer.create({
      data: { name, email: email || null, phone: phone || null },
    });
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Bu email zaten kayıtlı bir müşteride var" });
    }
    console.error(err);
    res.status(500).json({ error: "Müşteri oluşturulamadı" });
  }
}

async function updateCustomer(req, res) {
  try {
    const { name, email, phone } = req.body;
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone },
    });
    res.json(customer);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Müşteri bulunamadı" });
    }
    res.status(500).json({ error: "Müşteri güncellenemedi" });
  }
}

async function deleteCustomer(req, res) {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Müşteri bulunamadı" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Bu müşterinin satış geçmişi olduğu için silinemez" });
    }
    res.status(500).json({ error: "Müşteri silinemedi" });
  }
}

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
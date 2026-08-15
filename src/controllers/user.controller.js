const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

// GET /api/users/me
async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  res.json(user);
}

// PUT /api/users/me/password
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isValid = await bcrypt.compare(currentPassword, user.password);

  if (!isValid) {
    return res.status(400).json({ error: "Mevcut şifre hatalı" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword, refreshToken: null },
  });

  res.json({ message: "Şifre başarıyla değiştirildi" });
}

// GET /api/users - sadece admin, ekip listesini görmek için
async function getAllUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
}

module.exports = { getMe, changePassword, getAllUsers };
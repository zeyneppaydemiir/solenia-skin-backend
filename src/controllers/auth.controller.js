const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function register(req, res) {
  try {
    const { email, password, name, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Bu email zaten kayıtlı" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "sales_manager",
      },
    });

    const { accessToken, refreshToken } = await issueTokens(user);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kayıt sırasında hata oluştu" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Email veya şifre hatalı" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Email veya şifre hatalı" });
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Giriş sırasında hata oluştu" });
  }
}

// POST /api/auth/refresh
// Frontend, access token süresi dolduğunda (401 aldığında) bu endpoint'e
// refresh token'ı gönderir, yeni bir access token alır. Kullanıcı bunu
// hiç fark etmez - arka planda sessizce olur.
async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token eksik" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: "Oturum geçersiz, tekrar giriş yapın" });
    }

    // DB'de HASH'lenmiş halini sakladığımız için, gelen token'ı hash'leyip
    // karşılaştırıyoruz - düz metin token'ı asla veritabanında tutmuyoruz,
    // tıpkı şifre gibi. Biri DB'ye erişse bile token'ları çalamaz.
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return res.status(401).json({ error: "Oturum geçersiz, tekrar giriş yapın" });
    }

    // Rotasyon: her refresh'te YENİ bir refresh token da üretiyoruz ve
    // eskisini geçersiz kılıyoruz. Bu, çalınmış bir refresh token'ın
    // sonsuza kadar kullanılabilir olmasını engeller.
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: "Oturum geçersiz, tekrar giriş yapın" });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(204).send();

  try {
    const payload = jwt.decode(refreshToken);
    if (payload?.id) {
      await prisma.user.update({ where: { id: payload.id }, data: { refreshToken: null } });
    }
  } catch {
    // token zaten geçersizse yapacak bir şey yok, sorun değil
  }
  res.status(204).send();
}

// Access token: kısa ömürlü (15 dk), her istekte kullanılır.
// Refresh token: uzun ömürlü (7 gün), sadece yeni access token almak için.
// Refresh token'ı hash'leyip DB'de saklıyoruz (şifre gibi).
async function issueTokens(user) {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashedRefreshToken } });

  return { accessToken, refreshToken };
}

module.exports = { register, login, refresh, logout };
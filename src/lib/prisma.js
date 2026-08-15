const { PrismaClient } = require("@prisma/client");

// Neden singleton? Her route dosyasında "new PrismaClient()" yaparsan
// her biri ayrı bir DB connection pool açar. Geliştirme sırasında
// nodemon her reload'da yeni instance yaratır ve "too many connections"
// hatası alırsın. Bu yüzden tek instance'ı burada oluşturup her yerde
// bunu import ediyoruz.
const prisma = new PrismaClient();

module.exports = prisma;

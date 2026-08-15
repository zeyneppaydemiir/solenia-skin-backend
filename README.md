# Solenia Skin ERP — Backend

Cilt bakımı odaklı bir kozmetik markası için geliştirilmiş, uçtan uca bir ERP sisteminin backend'i. Klasik stok/satış/müşteri yönetiminin ötesinde, **hammadde–reçete–üretim–lot** zincirini ve **rol bazlı yetkilendirmeyi** içeren gerçekçi bir üretim ERP'si olarak tasarlandı.

**Canlı API:** `https://solenia-skin-backend-production-2a82.up.railway.app`
**Frontend reposu:** [solenia-skin-frontend](https://github.com/zeyneppaydemiir/solenia-skin-frontend)

---

## Özellikler

- **Auth & Yetkilendirme** — JWT access + refresh token, bcrypt ile şifre hash'leme, 6 farklı role dayalı yetkilendirme (RBAC)
- **Ürün / Kategori / Müşteri Yönetimi** — arama, sayfalama ve Zod ile veri doğrulamalı tam CRUD
- **Satış** — transaction içinde stok güncelleyen sipariş akışı, iptal/iade mekanizması (stok otomatik geri eklenir)
- **Üretim Zinciri** — hammadde stoğu → reçete (BOM) → üretim emri → lot/batch oluşturma, fire takibi
- **SKT (Son Kullanma Tarihi) İzlenebilirliği** — lot bazlı üretim/son kullanma tarihi kaydı, yaklaşan SKT uyarıları
- **Analitik Endpoint'leri** — satış, stok (devir hızı, durgun stok, kritik stok), üretim (maliyet, fire oranı) analizleri
- **İstatistiksel Talep Tahmini** — doğrusal regresyon ile aylık satış verisinden gelecek ay tahmini ve üretim önerisi
- **Bildirim Sistemi** — düşük stok, kritik hammadde ve yaklaşan SKT'yi canlı tarayan bildirim endpoint'i
- **Global Arama** — ürün ve müşteri isimlerinde debounce'lu arama

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Runtime | Node.js + Express |
| ORM | Prisma |
| Veritabanı | PostgreSQL |
| Auth | JWT (access + refresh token), bcrypt |
| Doğrulama | Zod |
| Deploy | Railway |

## Veritabanı Şeması

Ana varlıklar: `User`, `Category`, `Product`, `Customer`, `Sale` / `SaleItem`, `RawMaterial`, `RecipeItem`, `ProductionOrder`, `ProductLot`.

Üretim zinciri özetle şöyle işler:

```
RawMaterial ──(RecipeItem: BOM)──> Product
                                       │
                              ProductionOrder
                                       │
                              ┌────────┴────────┐
                        hammadde düşer      ProductLot oluşur
                        ürün stoğu artar    (lot no + SKT)
```

## Kurulum

```bash
git clone https://github.com/zeyneppaydemiir/solenia-skin-backend.git
cd solenia-skin-backend
npm install
cp .env.example .env
```

`.env` dosyasını doldur:

```
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/solenia_skin?schema=public"
JWT_SECRET="uzun-rastgele-bir-string"
JWT_REFRESH_SECRET="JWT_SECRET'tan farklı, uzun rastgele bir string"
PORT=4000
```

Veritabanını oluştur ve doldur:

```bash
npx prisma migrate dev
npx prisma db seed
npm run seed:materials
```

Sunucuyu başlat:

```bash
npm run dev
```

`http://localhost:4000/api/health` adresi `{"status":"ok"}` dönüyorsa hazırsın.

## Test Kullanıcıları

Seed script'i farklı rollerde 6 kullanıcı oluşturur:

| Email | Şifre | Rol |
|---|---|---|
| admin@solenia.com | admin123 | Admin (her şeye erişir) |
| uretim@solenia.com | 123456 | Üretim Sorumlusu |
| depo@solenia.com | 123456 | Depo Sorumlusu |
| satis@solenia.com | 123456 | Satış Sorumlusu |
| finans@solenia.com | 123456 | Finans |
| kalite@solenia.com | 123456 | Kalite Sorumlusu |

## API Uç Noktaları (özet)

```
POST   /api/auth/register | /login | /refresh | /logout
GET    /api/products | /categories | /customers | /sales
POST   /api/products | /customers | /sales
PUT    /api/sales/:id/cancel
GET    /api/raw-materials | /recipes/:productId | /production-orders | /lots
POST   /api/production-orders
GET    /api/dashboard/summary | /forecast | /sales-analysis | /inventory-analysis | /production-analysis
GET    /api/search?q=... | /notifications
```

Tüm route'lar (auth hariç) `Authorization: Bearer <token>` header'ı gerektirir.

## Proje Yapısı

```
src/
├── controllers/   # İş mantığı
├── routes/        # Endpoint tanımları + yetki kontrolleri
├── middleware/     # auth, role, validation
├── validators/     # Zod şemaları
└── lib/           # Prisma client, Anthropic client
prisma/
├── schema.prisma
├── seed.js              # Ürün/müşteri/satış verisi
└── seedRawMaterials.js  # Hammadde/reçete verisi
```

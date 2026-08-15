require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://solenia-skin-frontend.vercel.app",
  ],
}));
app.use(express.json());

// Sağlık kontrolü - server ayakta mı, DB bağlantısı çalışıyor mu diye
// buradan test edeceğiz (Faz 1 sonunda)
app.get("/api/health", async (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Faz 2: Auth ---
app.use("/api/auth", require("./routes/auth.routes"));

// Token'ın gerçekten çalıştığını test etmek için geçici bir endpoint.
// İstersen kalsın, işine yaramıyorsa silebilirsin.
const { requireAuth } = require("./middleware/auth.middleware");
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ message: "Token geçerli", user: req.user });
});

// --- Faz 3: Products + Categories ---
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/categories", require("./routes/category.routes"));

app.use("/api/customers", require("./routes/customer.routes"));

app.use("/api/sales", require("./routes/sale.routes"));

app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/raw-materials", require("./routes/rawMaterial.routes"));
app.use("/api/recipes", require("./routes/recipe.routes"));
app.use("/api/production-orders", require("./routes/productionOrder.routes"));
app.use("/api/lots", require("./routes/lot.routes"));
app.use("/api/search", require("./routes/search.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/users", require("./routes/user.routes"));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend ayakta -> http://localhost:${PORT}`);
});
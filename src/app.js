require("dotenv").config();
const express      = require("express");
const mongoose     = require("mongoose");
const cors         = require("cors");
const morgan       = require("morgan");
const errorHandler = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000",
           "https://expense-tracker-psi-lemon-67.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// ── Routes ─────────────────────────────────────────────────────────
app.use("/api/transactions", require("./routes/transactions"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Expense Tracker API is running 🚀",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler (must be last)
app.use(errorHandler);

// ── MongoDB Connection + Start ─────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/expense_tracker";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`✅  MongoDB connected: ${MONGODB_URI}`);
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
      console.log(`📋  API Docs:`);
      console.log(`    GET    /api/transactions`);
      console.log(`    POST   /api/transactions`);
      console.log(`    PUT    /api/transactions/:id`);
      console.log(`    DELETE /api/transactions/:id`);
      console.log(`    GET    /api/health`);
    });
  })
  .catch((err) => {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = app;

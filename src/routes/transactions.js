const express     = require("express");
const router      = express.Router();
const Transaction = require("../models/Transaction");

// ── Helper ────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─────────────────────────────────────────────────────────────────
// GET /api/transactions
// Query params: ?type=income|expense  ?category=Food  ?limit=50
// ─────────────────────────────────────────────────────────────────
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type, category, limit = 200 } = req.query;

    const filter = {};
    if (type     && ["income", "expense"].includes(type))        filter.type     = type;
    if (category && category !== "All")                          filter.category = category;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Summary stats
    const all    = await Transaction.find();
    const income  = all.filter((t) => t.type === "income" ).reduce((s, t) => s + t.amount, 0);
    const expense = all.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    res.json({
      success: true,
      count: transactions.length,
      summary: {
        totalIncome:  parseFloat(income.toFixed(2)),
        totalExpense: parseFloat(expense.toFixed(2)),
        balance:      parseFloat((income - expense).toFixed(2)),
      },
      data: transactions,
    });
  })
);

// ─────────────────────────────────────────────────────────────────
// GET /api/transactions/:id
// ─────────────────────────────────────────────────────────────────
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.json({ success: true, data: transaction });
  })
);

// ─────────────────────────────────────────────────────────────────
// POST /api/transactions
// Body: { description, amount, type, category }
// ─────────────────────────────────────────────────────────────────
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { description, amount, type, category } = req.body;

    const transaction = await Transaction.create({
      description,
      amount: parseFloat(amount),
      type,
      category: category || "Other",
    });

    res.status(201).json({ success: true, data: transaction });
  })
);

// ─────────────────────────────────────────────────────────────────
// PUT /api/transactions/:id
// ─────────────────────────────────────────────────────────────────
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { description, amount, type, category } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { description, amount: parseFloat(amount), type, category },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, data: transaction });
  })
);

// ─────────────────────────────────────────────────────────────────
// DELETE /api/transactions/:id
// ─────────────────────────────────────────────────────────────────
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, message: "Transaction deleted", id: req.params.id });
  })
);

// ─────────────────────────────────────────────────────────────────
// DELETE /api/transactions   (delete ALL — dev utility)
// ─────────────────────────────────────────────────────────────────
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    await Transaction.deleteMany({});
    res.json({ success: true, message: "All transactions deleted" });
  })
);

module.exports = router;

import { Router } from "express";
import { db } from "@workspace/db";
import { tradesTable, balancesTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth";
import { requireAuth } from "../middlewares/auth";
import { PRICES } from "./balances";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(tradesTable).where(eq(tradesTable.userId, req.userId!));
    res.json(rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      price: parseFloat(r.price),
      total: parseFloat(r.total),
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { symbol, side, amount } = req.body;
    if (!symbol || !side || !amount) {
      res.status(400).json({ error: "symbol, side and amount required" });
      return;
    }
    const price = PRICES[symbol.toUpperCase()] ?? 1;
    const total = +(amount * price).toFixed(2);

    // Update user balance
    const currency = symbol.toUpperCase();
    const usdtCurrency = "USDT";

    const [existing] = await db.select().from(balancesTable)
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, currency))).limit(1);
    const [usdtBal] = await db.select().from(balancesTable)
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, usdtCurrency))).limit(1);

    if (side === "buy") {
      const usdtAmount = parseFloat(usdtBal?.amount ?? "0");
      if (usdtAmount < total) {
        res.status(400).json({ error: "Insufficient USDT balance" });
        return;
      }
      // Deduct USDT
      const newUsdt = +(usdtAmount - total).toFixed(8);
      await db.update(balancesTable).set({ amount: String(newUsdt), updatedAt: new Date() })
        .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, usdtCurrency)));
      // Add coin
      if (existing) {
        const newAmount = +(parseFloat(existing.amount) + amount).toFixed(8);
        await db.update(balancesTable).set({ amount: String(newAmount), updatedAt: new Date() })
          .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, currency)));
      } else {
        await db.insert(balancesTable).values({ userId: req.userId!, currency, amount: String(amount) });
      }
    } else {
      // sell
      const coinAmount = parseFloat(existing?.amount ?? "0");
      if (coinAmount < amount) {
        res.status(400).json({ error: "Insufficient balance" });
        return;
      }
      const newCoin = +(coinAmount - amount).toFixed(8);
      await db.update(balancesTable).set({ amount: String(newCoin), updatedAt: new Date() })
        .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, currency)));
      const newUsdt = +(parseFloat(usdtBal?.amount ?? "0") + total).toFixed(8);
      if (usdtBal) {
        await db.update(balancesTable).set({ amount: String(newUsdt), updatedAt: new Date() })
          .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, usdtCurrency)));
      } else {
        await db.insert(balancesTable).values({ userId: req.userId!, currency: usdtCurrency, amount: String(total) });
      }
    }

    const [trade] = await db.insert(tradesTable).values({
      userId: req.userId!, symbol: currency, side, amount: String(amount),
      price: String(price), total: String(total), status: "filled",
    }).returning();

    await db.insert(transactionsTable).values({
      userId: req.userId!, type: "trade", currency,
      amount: String(amount), status: "completed",
      description: `${side.toUpperCase()} ${amount} ${currency} @ $${price}`,
    });

    res.status(201).json({
      ...trade,
      amount: parseFloat(trade.amount),
      price: parseFloat(trade.price),
      total: parseFloat(trade.total),
      createdAt: trade.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { db } from "@workspace/db";
import { swapsTable, balancesTable, transactionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth";
import { requireAuth } from "../middlewares/auth";
import { PRICES } from "./balances";

const router = Router();
const FEE_PERCENT = 0.3;

function getRate(from: string, to: string): number {
  const fromPrice = PRICES[from.toUpperCase()] ?? 1;
  const toPrice = PRICES[to.toUpperCase()] ?? 1;
  return fromPrice / toPrice;
}

router.post("/quote", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    if (!fromCurrency || !toCurrency || !amount) {
      res.status(400).json({ error: "fromCurrency, toCurrency and amount required" });
      return;
    }
    const rate = getRate(fromCurrency, toCurrency);
    const fee = +(amount * (FEE_PERCENT / 100)).toFixed(8);
    const toAmount = +((amount - fee) * rate).toFixed(8);
    res.json({
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: +amount,
      toAmount,
      rate: +rate.toFixed(8),
      fee,
      feePercent: FEE_PERCENT,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    if (!fromCurrency || !toCurrency || !amount) {
      res.status(400).json({ error: "fromCurrency, toCurrency and amount required" });
      return;
    }
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    const rate = getRate(from, to);
    const fee = +(amount * (FEE_PERCENT / 100)).toFixed(8);
    const toAmount = +((amount - fee) * rate).toFixed(8);

    const [fromBal] = await db.select().from(balancesTable)
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, from))).limit(1);

    if (!fromBal || parseFloat(fromBal.amount) < amount) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    const newFrom = +(parseFloat(fromBal.amount) - amount).toFixed(8);
    await db.update(balancesTable).set({ amount: String(newFrom), updatedAt: new Date() })
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, from)));

    const [toBal] = await db.select().from(balancesTable)
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, to))).limit(1);
    if (toBal) {
      const newTo = +(parseFloat(toBal.amount) + toAmount).toFixed(8);
      await db.update(balancesTable).set({ amount: String(newTo), updatedAt: new Date() })
        .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, to)));
    } else {
      await db.insert(balancesTable).values({ userId: req.userId!, currency: to, amount: String(toAmount) });
    }

    const [swap] = await db.insert(swapsTable).values({
      userId: req.userId!, fromCurrency: from, toCurrency: to,
      fromAmount: String(amount), toAmount: String(toAmount),
      rate: String(rate), fee: String(fee),
    }).returning();

    await db.insert(transactionsTable).values({
      userId: req.userId!, type: "swap", currency: from,
      amount: String(amount), status: "completed",
      description: `Swapped ${amount} ${from} → ${toAmount} ${to}`,
    });

    res.status(201).json({
      ...swap,
      fromAmount: parseFloat(swap.fromAmount),
      toAmount: parseFloat(swap.toAmount),
      rate: parseFloat(swap.rate),
      fee: parseFloat(swap.fee),
      createdAt: swap.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

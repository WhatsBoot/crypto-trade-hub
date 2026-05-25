import { Router } from "express";
import { db } from "@workspace/db";
import { balancesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const PRICES: Record<string, number> = {
  BTC: 67420.50, ETH: 3512.80, USDT: 1.00, BNB: 598.40, SOL: 172.30,
  XRP: 0.5872, USDC: 1.00, ADA: 0.4521, DOGE: 0.1624, DOT: 7.84,
  AVAX: 38.92, LINK: 14.82, TRX: 0.1241, MATIC: 0.7823,
};

function getUsdValue(currency: string, amount: number): number {
  const price = PRICES[currency.toUpperCase()] ?? 0;
  return +(amount * price).toFixed(2);
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(balancesTable).where(eq(balancesTable.userId, req.userId!));
    res.json(rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      usdValue: getUsdValue(r.currency, parseFloat(r.amount)),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/portfolio", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(balancesTable).where(eq(balancesTable.userId, req.userId!));
    const balances = rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
      usdValue: getUsdValue(r.currency, parseFloat(r.amount)),
      updatedAt: r.updatedAt.toISOString(),
    }));
    const totalUsdValue = balances.reduce((sum, b) => sum + (b.usdValue ?? 0), 0);
    const change24h = (Math.random() - 0.3) * 5;
    res.json({ totalUsdValue: +totalUsdValue.toFixed(2), change24h: +change24h.toFixed(2), balances });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { getUsdValue, PRICES };
export default router;

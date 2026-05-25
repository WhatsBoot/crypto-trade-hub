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

export function getCoinAvatar(symbol: string) {
  const map: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '₮',
    SOL: '◎',
    ADA: 'S',
    DOGE: '₳',
    AVAX: '₳'
  };
  return map[symbol] || symbol.charAt(0);
}

export function getCoinColor(symbol: string) {
  const map: Record<string, string> = {
    BTC: 'text-orange-500',
    ETH: 'text-indigo-400',
    USDT: 'text-green-400',
    SOL: 'text-purple-400',
  };
  return map[symbol] || 'text-blue-400';
}

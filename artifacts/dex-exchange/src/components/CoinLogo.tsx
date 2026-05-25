import { useState } from "react";
import { getCoinLogo, getCoinAvatar, getCoinColor, cn } from "@/lib/utils";

interface CoinLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CoinLogo({ symbol, size = 32, className }: CoinLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src={getCoinLogo(symbol)}
        alt={symbol}
        width={size}
        height={size}
        className={cn("rounded-full object-contain", className)}
        style={{ width: size, height: size, minWidth: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold",
        getCoinColor(symbol),
        className
      )}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.4 }}
    >
      {getCoinAvatar(symbol)}
    </div>
  );
}

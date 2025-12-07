import { NextResponse } from 'next/server';

const PLATFORM_FEE = 0.009;

function generateMemo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crypto = searchParams.get('crypto') || 'USDT';
  const amount = parseFloat(searchParams.get('amount') || '0');

  // Mock Rate Aggregation
  const baseRates: Record<string, number> = {
    "USDT": 1680.00, "BTC": 115000000.00, "ETH": 6200000.00,
    "BNB": 1050000.00, "TRX": 195.00, "DOGE": 280.00
  };

  const marketPrice = baseRates[crypto] || 1000.0;

  // Simulate providers
  const providers = {
    "Binance P2P": marketPrice * (0.99 + Math.random() * 0.02),
    "Transak": marketPrice * (0.98 + Math.random() * 0.02),
    "Breet": marketPrice * (0.97 + Math.random() * 0.02),
    "YellowCard": marketPrice * (0.98 + Math.random() * 0.025)
  };

  // Find best provider
  let bestProvider = "Binance P2P";
  let bestRate = 0;

  Object.entries(providers).forEach(([provider, rate]) => {
    if (rate > bestRate) {
      bestRate = rate;
      bestProvider = provider;
    }
  });

  const grossNgn = amount * bestRate;
  const feeAmount = grossNgn * PLATFORM_FEE;
  const netNgn = grossNgn - feeAmount;

  return NextResponse.json({
    provider: bestProvider,
    rate: Number(bestRate.toFixed(2)),
    gross_ngn: Number(grossNgn.toFixed(2)),
    fee: Number(feeAmount.toFixed(2)),
    net_ngn: Number(netNgn.toFixed(2)),
    memo: generateMemo()
  });
}

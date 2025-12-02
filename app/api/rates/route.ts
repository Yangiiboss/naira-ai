import { NextResponse } from "next/server";
import { fetchBanxaRate, fetchBinanceSpotPrice, fetchMoonPayRate, fetchWyreRate } from "./helpers/helpers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const crypto = (searchParams.get("crypto") || "USDT").toUpperCase();
    const amount = parseFloat(searchParams.get("amount") || "0");

    // Validate crypto symbol
    const supportedCryptos = ["USDT", "BTC", "ETH", "BNB", "TRX", "DOGE"];
    if (!supportedCryptos.includes(crypto)) {
      return NextResponse.json(
        { error: "Unsupported cryptocurrency symbol." },
        { status: 400 }
      );
    }

    // Fetch rates concurrently
    const [
      binanceRate,
      moonPayRate,
      banxaRate,
      wyreRate,
    ] = await Promise.all([
        fetchBinanceSpotPrice(crypto),
        fetchMoonPayRate(crypto),
        fetchBanxaRate(crypto),
        fetchWyreRate(crypto),
    ]);

    // Build providers object (only those with rates)
    const providers: Record<string, number> = {};
    if (binanceRate) providers["Binance"] = binanceRate;
    if (moonPayRate) providers["Moon Pay"] = moonPayRate;
    if (banxaRate) providers["Banxa"] = banxaRate;
    if (wyreRate) providers["Wyre"] = wyreRate;

    if (Object.keys(providers).length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch any rates from providers." },
        { status: 503 }
      );
    }

    // Pick best provider with highest rate (you can change logic if needed)
    const best_provider = Object.keys(providers).reduce((a, b) =>
      providers[a] > providers[b] ? a : b
    );
    const best_rate = providers[best_provider];

    const PLATFORM_FEE = 0.009;

    const gross_ngn = amount * best_rate;
    const fee_amount = gross_ngn * PLATFORM_FEE;
    const net_ngn = gross_ngn - fee_amount;

    return NextResponse.json({
      providers,
      best_provider,
      rate: Number(best_rate.toFixed(2)),
      gross_ngn: Number(gross_ngn.toFixed(2)),
      fee: Number(fee_amount.toFixed(2)),
      net_ngn: Number(net_ngn.toFixed(2)),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

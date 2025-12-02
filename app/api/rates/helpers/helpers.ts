import axios from "axios";

async function fetchUsdToNgnRate(): Promise<number | null> {
  try {
    const fxUrl = "https://open.er-api.com/v6/latest/USD";
    const res = await axios.get(fxUrl);
    const rate = parseFloat(res.data?.rates?.NGN);
    return isNaN(rate) ? null : rate;
  } catch {
    return null;
  }
}


export async function fetchBinanceSpotPrice(crypto: string): Promise<number | null> {
  try {
    const symbol = crypto.toUpperCase() === "USDT"
      ? "USDTUSDT"
      : `${crypto.toUpperCase()}USDT`;

    let cryptoToUsd: number;

    if (symbol === "USDTUSDT") {
      cryptoToUsd = 1;
    } else {
      const res = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
      );
      cryptoToUsd = parseFloat(res.data.price);
      if (isNaN(cryptoToUsd)) return null;
    }

    const usdToNgn = await fetchUsdToNgnRate();
    if (!usdToNgn) return null;

    return cryptoToUsd * usdToNgn;
  } catch (err:any) {
    console.log("Binance Spot Error:", err.message);
    return null;
  }
}


export async function fetchMoonPayRate(crypto: string): Promise<number | null> {
  try {
    const apiKey = process.env.MOONPAY_API_KEY;
    if (!apiKey) throw new Error("Missing MoonPay API Key");

    const url = `https://api.moonpay.com/v3/currencies/${crypto.toLowerCase()}?apiKey=${apiKey}`;
    const res = await axios.get(url);

    const usdPrice = res.data?.price;
    if (!usdPrice) return null;

    const usdToNgn = await fetchUsdToNgnRate();
    if (!usdToNgn) return null;

    return usdPrice * usdToNgn;
  } catch (err:any) {
    console.log("MoonPay Error:", err.message);
    return null;
  }
}


export async function fetchBanxaRate(crypto: string): Promise<number | null> {
  try {
    const key = process.env.BANXA_API_KEY;
    if (!key) throw new Error("Missing Banxa API Key");

    const url = `https://api.banxa.com/api/price?digital_currency=${crypto}&fiat_currency=USD`;

    const res = await axios.get(url, {
      headers: { "x-api-key": key }
    });

    const usdPrice = res.data?.data?.price;
    if (!usdPrice) return null;

    const usdToNgn = await fetchUsdToNgnRate();
    if (!usdToNgn) return null;

    return parseFloat(usdPrice) * usdToNgn;
  } catch (err:any) {
    console.log("Banxa Error:", err.message);
    return null;
  }
}




export async function fetchWyreRate(crypto: string): Promise<number | null> {
  try {
    const key = process.env.WYRE_API_KEY;
    if (!key) throw new Error("Missing Wyre API Key");

    const url = `https://api.sendwyre.com/v3/rates?apiKey=${key}`;

    const res = await axios.get(url);
    const usdPrice = res.data?.[`${crypto.toUpperCase()}USD`];

    if (!usdPrice) return null;

    const usdToNgn = await fetchUsdToNgnRate();
    if (!usdToNgn) return null;

    return usdPrice * usdToNgn;
  } catch (err:any) {
    console.log("Wyre Error:", err.message);
    return null;
  }
}



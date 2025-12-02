"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const CRYPTOS = ["USDT", "BTC", "ETH", "BNB", "TRX", "DOGE"];

export default function Dashboard() {
    const [step, setStep] = useState(1);
    const [crypto, setCrypto] = useState("USDT");
    const [amount, setAmount] = useState(10);
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Rate Fetching
    useEffect(() => {
        const fetchRate = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/rates?crypto=${crypto}&amount=${amount}`);
                const data = res.data;
                setQuote(data);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };

        const timer = setTimeout(fetchRate, 500); // Debounce
        return () => clearTimeout(timer);
    }, [crypto, amount]);

    return (
        <div className="min-h-screen p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-primary">NairaAI 2.0</h1>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                    <span>User</span>
                </div>
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Input */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6"
                >
                    <h2 className="text-xl font-semibold mb-6">💱 Exchange</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Asset</label>
                            <select
                                value={crypto}
                                onChange={(e) => setCrypto(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                            >
                                {CRYPTOS.map(c => <option className="text-gray-700" key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>

                        {quote && (
                            <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-300">Best Rate ({quote.best_provider}):</span>
                                    <span className="font-bold text-primary">₦{quote.rate.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-400 mb-4">
                                    <span>Fee (0.9%):</span>
                                    <span>- ₦{quote.fee.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-white/10 pt-4 flex justify-between text-xl font-bold">
                                    <span>You Receive:</span>
                                    <span className="text-secondary">₦{quote.net_ngn.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStep(2)}
                            className="w-full mt-4 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-black font-bold hover:opacity-90 transition-opacity"
                        >
                            Lock Rate & Continue
                        </button>
                    </div>
                </motion.div>

                {/* Right Column: Dynamic Content based on Step */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-6 flex flex-col justify-center items-center text-center"
                >
                    {step === 1 && (
                        <div className="text-gray-400">
                            <p className="mb-4 text-4xl">🚀</p>
                            <p>Select your crypto and amount to see the best rates instantly.</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="w-full">
                            <h3 className="text-xl font-semibold mb-4">📥 Deposit Address</h3>
                            <div className="bg-white p-4 rounded-lg inline-block mb-4">
                                {/* QR Code Placeholder */}
                                <div className="w-48 h-48 bg-black"></div>
                            </div>
                            <p className="font-mono text-sm bg-black/30 p-3 rounded break-all">
                                0x72fb93c58ab7afadbf75e982a5b6d2cb6134247b
                            </p>
                            <p className="text-yellow-400 text-sm mt-2">Send only BEP-20 {crypto}</p>

                            <button
                                className="mt-6 text-sm text-gray-400 underline"
                                onClick={() => setStep(1)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

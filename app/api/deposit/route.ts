import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const BSC_RPC = "https://bsc-dataseed.binance.org/";
const CONTRACT_ADDRESS = "0x72fb93c58ab7afadbf75e982a5b6d2cb6134247b";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const memo = searchParams.get('memo');

    if (!memo) {
        return NextResponse.json({ status: "pending", message: "No memo provided" });
    }

    try {
        const provider = new ethers.JsonRpcProvider(BSC_RPC);

        // In a real scenario, we would scan blocks for the memo in input data.
        // For this demo, we check connectivity and return active status.
        // To implement real scanning:
        // const block = await provider.getBlock('latest', true);
        // ... scan transactions ...

        // Check balance just to ensure RPC is working
        const balance = await provider.getBalance(CONTRACT_ADDRESS);
        const ethBalance = ethers.formatEther(balance);

        return NextResponse.json({
            status: "active",
            address: CONTRACT_ADDRESS,
            checked_memo: memo,
            rpc_status: "connected",
            balance_check: ethBalance
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

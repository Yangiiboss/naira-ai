// import { NextResponse } from "next/server";
// import Web3 from "web3";

// const BSC_RPC = "https://bsc-dataseed.binance.org/";
// const CONTRACT_ADDRESS = "0x72fb93c58ab7afadbf75e982a5b6d2cb6134247b";

// const web3 = new Web3(new Web3.providers.HttpProvider(BSC_RPC));

// export async function GET() {
//   try {
//     const balanceWei = await web3.eth.getBalance(CONTRACT_ADDRESS);
//     const balance = web3.utils.fromWei(balanceWei, "ether");

//     return NextResponse.json({
//       address: CONTRACT_ADDRESS,
//       balance: Number(balance),
//       status: "active",
//     });
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

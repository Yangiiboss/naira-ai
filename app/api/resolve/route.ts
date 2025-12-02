import { NextResponse } from "next/server";

interface ResolveRequest {
  account_number: string;
  bank_code: string;
}

export async function POST(req: Request) {
  const body: ResolveRequest = await req.json();
  const { account_number, bank_code } = body;

  if (account_number && account_number.toString().length === 10) {
    return NextResponse.json({
      status: true,
      account_name: "MOCK USER NAME",
    });
  }

  return NextResponse.json(
    { status: false, message: "Invalid account" },
    { status: 400 }
  );
}

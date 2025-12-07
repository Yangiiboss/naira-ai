import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { account_number } = body;

  // Mock Paystack Resolution
  if (account_number && account_number.toString().length === 10) {
    return NextResponse.json({
      status: true,
      account_name: "MOCK USER NAME"
    });
  }

  return NextResponse.json(
    { status: false, message: "Invalid account" },
    { status: 400 }
  );
}

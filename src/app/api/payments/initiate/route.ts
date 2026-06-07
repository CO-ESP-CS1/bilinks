import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.userId || !body?.planId || !body?.phone || !body?.provider) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  await new Promise((r) => setTimeout(r, 1500));

  const transactionId = `BL-${Math.floor(10000000 + Math.random() * 90000000)}`;

  return NextResponse.json({ success: true, transactionId });
}

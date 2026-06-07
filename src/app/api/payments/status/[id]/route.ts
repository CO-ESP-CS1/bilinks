import { NextResponse } from "next/server";

const pollCounts = new Map<string, number>();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
  }

  const count = (pollCounts.get(id) ?? 0) + 1;
  pollCounts.set(id, count);

  if (count < 3) {
    return NextResponse.json({ status: "pending" });
  }

  pollCounts.delete(id);
  return NextResponse.json({ status: "success" });
}

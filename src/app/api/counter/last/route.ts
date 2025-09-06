// /app/api/counter/last/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const lastEntry = await prisma.counter_data.findFirst({
      where: { date: today },
      orderBy: { counter: "desc" }, // highest counter today
    });

    return NextResponse.json(lastEntry);
  } catch (error) {
    console.error("❌ Failed to fetch last entry:", error);
    return NextResponse.json({ error: "Failed to fetch last entry" }, { status: 500 });
  }
}

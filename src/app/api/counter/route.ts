import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    console.log("📡 Fetching today's first unserved counter...");

    // Format today's date like "YYYY-MM-DD"
    const today = new Date().toISOString().split("T")[0];

    const counter = await prisma.counter_data.findFirst({
      where: {
        Served: false,
        date: today, // match today's date column
      },
      orderBy: { timestamp: "asc" }, // earliest for today
    });

    console.log("✅ Today's query result:", counter);

    return NextResponse.json(counter || null);
  } catch (error) {
    console.error("❌ Database fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch counter" }, { status: 500 });
  }
}

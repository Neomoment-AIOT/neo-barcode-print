import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId");

    if (!pharmacyId) {
      return NextResponse.json({ error: "pharmacyId is required" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    const counter = await prisma.counter_data.findFirst({
      where: {
        Served: false,
        date: today,
        phar_id: parseInt(pharmacyId, 10), // ✅ filter in DB
      },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(counter || null);
  } catch (error) {
    console.error("❌ Database fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch counter" }, { status: 500 });
  }
}

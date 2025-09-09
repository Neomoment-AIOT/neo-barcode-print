import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pharIdParam = searchParams.get("pharmacyId");
    if (!pharIdParam) {
      return NextResponse.json({ error: "Pharmacy ID required" }, { status: 400 });
    }
    const phar_id = parseInt(pharIdParam, 10);

    const today = new Date().toISOString().split("T")[0];

    const lastEntry = await prisma.counter_data.findFirst({
      where: { date: today, phar_id },
      orderBy: { counter: "desc" }, // highest counter for this pharmacy today
    });

    return NextResponse.json(lastEntry || { counter: 0 }); // if none, return 0
  } catch (error) {
    console.error("❌ Failed to fetch last entry:", error);
    return NextResponse.json({ error: "Failed to fetch last entry" }, { status: 500 });
  }
}

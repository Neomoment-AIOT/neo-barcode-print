// app/api/counter/increment/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Small helper to get YYYY-MM-DD
function todayDate() {
  return new Date().toISOString().split("T")[0];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { iqamaId, prescriptionNumber, deviceId } = body;

    if (!iqamaId || !prescriptionNumber) {
      return NextResponse.json(
        { error: "Iqama and Prescription are required" },
        { status: 400 }
      );
    }

    // Check if already exists for today
    const today = todayDate();
    const existing = await prisma.counter_data.findFirst({
      where: {
        iqama_id: iqamaId,
        prescription_number: prescriptionNumber,
        date: today,
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Find today's max counter
    const highestToday = await prisma.counter_data.findFirst({
      where: { date: today },
      orderBy: { counter: "desc" },
    });

    const nextCounter = (highestToday?.counter || 0) + 1;

    const newRow = await prisma.counter_data.create({
      data: {
        unique_key: `${today}_${iqamaId}_${prescriptionNumber}`,
        counter: nextCounter,
        iqama_id: iqamaId,
        prescription_number: prescriptionNumber,
        date: today,
        device_id: deviceId ?? null,
      },
    });


    return NextResponse.json(newRow);
  } catch (err) {
    console.error("❌ API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

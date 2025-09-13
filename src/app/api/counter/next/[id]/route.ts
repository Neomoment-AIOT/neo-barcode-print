import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`⚡ Updating counter id=${id} with next_time...`);

    const now = new Date();
    const updated = await prisma.counter_data.update({
      where: { id: Number(id) },
      data: { next_time: now },
    });

    console.log("✅ Next time updated:", updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Database update error:", error);
    return NextResponse.json({ error: "Failed to update next_time" }, { status: 500 });
  }
}

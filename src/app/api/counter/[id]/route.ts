import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ⬅ await is required in Next 15
    console.log(`⚡ Updating counter id=${id} as served...`);

    const updated = await prisma.counter_data.update({
      where: { id: Number(id) },
      data: { Served: true },
    });

    console.log("✅ Update result:", updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Database update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

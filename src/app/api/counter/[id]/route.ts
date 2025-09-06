import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`⚡ Updating counter id=${params.id} as served...`);

    const updated = await prisma.counter_data.update({
      where: { id: Number(params.id) },
      data: { Served: true },
    });

    console.log("✅ Update result:", updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Database update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

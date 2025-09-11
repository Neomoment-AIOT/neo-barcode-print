import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // 👈 params is a Promise
): Promise<NextResponse> {
  const { id } = await context.params; // 👈 await to get actual object
  const parsedId = Number(id);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "Invalid pharmacy ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { phar_id } = body;

    if (!phar_id) {
      return NextResponse.json({ error: "phar_id required" }, { status: 400 });
    }

    // Delete from counter_data first
    await prisma.counter_data.deleteMany({ where: { phar_id } });

    // Delete from pharmacy_id_table
    await prisma.pharmacy_id_table.deleteMany({ where: { phar_id } });

    // Delete pharmacy itself
    await prisma.pharmacy.delete({ where: { id: parsedId } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete pharmacy failed:", err);
    return NextResponse.json(
      { error: "Failed to delete pharmacy" },
      { status: 500 }
    );
  }
}

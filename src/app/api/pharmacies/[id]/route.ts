import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid pharmacy ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { phar_id } = body;

    if (!phar_id) {
      return NextResponse.json({ error: "phar_id required" }, { status: 400 });
    }

    // Delete from counter_data first
    await prisma.counter_data.deleteMany({
      where: { phar_id },
    });

    // Delete from pharmacy_id_table
    await prisma.pharmacy_id_table.deleteMany({
      where: { phar_id },
    });

    // Delete pharmacy itself
    await prisma.pharmacy.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete pharmacy" }, { status: 500 });
  }
}

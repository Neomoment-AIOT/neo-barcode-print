import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);

    // Update pharmacy table by phar_id
    const updatedPharmacy = await prisma.pharmacy.update({
      where: { phar_id: id },
      data: {
        pharmacy_name: body.pharmacy_name,
        geo_location: body.geo_location,
        address: body.address,
        contact_name: body.contact_name,
        contact_number: body.contact_number,
        functional: body.functional,
      },
    });

    // Update pharmacy_id_table if needed
    if (body.pharmacy_name != null || body.functional != null) {
      await prisma.pharmacy_id_table.updateMany({
        where: { phar_id: id },
        data: {
          phar_name: body.pharmacy_name,
          functional: body.functional,
        },
      });
    }

    return NextResponse.json(updatedPharmacy);
  } catch (err) {
    console.error("Update pharmacy failed:", err);
    return NextResponse.json({ error: "Failed to update pharmacy" }, { status: 500 });
  }
}

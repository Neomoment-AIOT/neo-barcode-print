import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    console.log("Incoming body:", body);
    console.log("Pharmacy id param:", params.id);

    // ✅ Update pharmacy table by phar_id
    const updatedPharmacy = await prisma.pharmacy.updateMany({
      where: { phar_id: Number(params.id) },
      data: {
        pharmacy_name: body.pharmacy_name,
        geo_location: body.geo_location,
        address: body.address,
        contact_name: body.contact_name,
        contact_number: body.contact_number,
        functional: body.functional,
      },
    });
    console.log("Updated pharmacy result:", updatedPharmacy);

    // ✅ Update pharmacy_id_table with new name if provided
    if (body.pharmacy_name) {
      const updatedPharmacyIdTable = await prisma.pharmacy_id_table.updateMany({
        where: { phar_id: Number(params.id) },
        data: { phar_name: body.pharmacy_name },
      });
      console.log("Updated pharmacy_id_table result:", updatedPharmacyIdTable);
    } else {
      console.log("No 'pharmacy_name' provided → skipping pharmacy_id_table update");
    }

    return NextResponse.json(updatedPharmacy);
  } catch (err) {
    console.error("Update pharmacy failed:", err);
    return NextResponse.json(
      { error: "Failed to update pharmacy" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pharmacy_name,
      geo_location,
      address,
      contact_name,
      contact_number,
      functional,
      device_id,
    } = body;

    if (!pharmacy_name) {
      return NextResponse.json(
        { message: "Pharmacy name is required" },
        { status: 400 }
      );
    }

    // Get last phar_id
    const lastPharmacy = await prisma.pharmacy.findFirst({
      orderBy: { phar_id: "desc" },
    });
    const newPharId = (lastPharmacy?.phar_id ?? 0) + 1;

    // Insert into pharmacy
    const pharmacy = await prisma.pharmacy.create({
      data: {
        phar_id: newPharId,
        pharmacy_name,
        geo_location,
        address,
        contact_name,
        contact_number,
        functional,
      },
    });

    // Insert into pharmacy_id_table
    await prisma.pharmacy_id_table.create({
      data: {
        phar_id: newPharId,
        device_id: device_id ?? null,
        phar_name: pharmacy_name
      },
    });

    return NextResponse.json(pharmacy);
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

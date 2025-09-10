// src/app/api/getPharmacyId/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId");

    if (!deviceId)
      return NextResponse.json({ success: false, message: "No deviceId" });

    // Debug log to verify deviceId received
    console.log("🔍 Device ID from client:", deviceId);

    const pharmacy = await prisma.pharmacy_id_table.findFirst({
      where: { device_id: deviceId.trim() }, // trim in case extra spaces
    });

    console.log("🔍 Query result =", pharmacy);

    if (!pharmacy)
      return NextResponse.json({ success: false, message: "Pharmacy not found" });

    return NextResponse.json({
      success: true,
      phar_id: pharmacy.phar_id,
      phar_name: pharmacy.phar_name,
    });
  } catch (err) {
    console.error("Error fetching pharmacy:", err);
    return NextResponse.json({ success: false, message: "Error fetching pharmacy" });
  }
}
 
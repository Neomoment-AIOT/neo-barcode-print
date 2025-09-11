// src/app/api/getPharmacy/route.ts
import { NextResponse } from "next/server";
import {prisma } from "../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phar_id = searchParams.get("phar_id");

    if (!phar_id) {
      return NextResponse.json({ success: false, message: "Missing phar_id" }, { status: 400 });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { phar_id: Number(phar_id) },
      select: {
        phar_id: true,
        pharmacy_name: true,
        functional: true,
      },
    });

    if (!pharmacy) {
      return NextResponse.json({ success: false, message: "Pharmacy not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      pharmacy,
    });
  } catch (error) {
    console.error("❌ Error fetching pharmacy:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

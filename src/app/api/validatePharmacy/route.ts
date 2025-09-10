// File: src/app/api/validatePharmacy/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phar_id_str = searchParams.get("phar_id");

    if (!phar_id_str) {
      return NextResponse.json({ exists: false, message: "No pharmacy ID provided" });
    }

    const phar_id = Number(phar_id_str); // ✅ convert string to number

    if (isNaN(phar_id)) {
      return NextResponse.json({ exists: false, message: "Invalid pharmacy ID" });
    }

    const entry = await prisma.pharmacy_id_table.findFirst({
      where: { phar_id }, // now it matches the number type
    });

    return NextResponse.json({ exists: !!entry });
  } catch (err) {
    console.error("Validation error:", err);
    return NextResponse.json({ exists: false, message: "Error validating pharmacy" });
  }
}

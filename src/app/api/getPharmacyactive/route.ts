// /app/api/getPharmacy/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phar_id = searchParams.get("phar_id");

    if (!phar_id) {
      return NextResponse.json({ success: false, error: "phar_id missing" });
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: Number(phar_id) },
    });

    if (!pharmacy) {
      return NextResponse.json({ success: false, error: "Pharmacy not found" });
    }

    return NextResponse.json({ success: true, pharmacy });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to fetch pharmacy" }, { status: 500 });
  }
}

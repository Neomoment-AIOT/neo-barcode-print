import { NextResponse } from "next/server";
import {prisma} from "../../../../../src/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pharmacyId = searchParams.get("pharmacyId");

    if (!pharmacyId) {
      return NextResponse.json({ exists: false });
    }

    // Simple query to check if id exists
    const record = await prisma.pharmacy_id_table.findFirst({
      where: { phar_id: parseInt(pharmacyId, 10) },
    });

    return NextResponse.json({ exists: !!record });
  } catch (error) {
    console.error("Error checking pharmacyId:", error);
    return NextResponse.json({ exists: false });
  }
}

// src/app/api/pharmacies/route.ts
import { NextResponse } from "next/server";
import {prisma} from "@/app/lib/prisma";

export async function GET() {
  try {
    const pharmacies = await prisma.pharmacy.findMany({
      orderBy: { phar_id: "desc" },
    });
    return NextResponse.json(pharmacies);
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    return NextResponse.json({ error: "Failed to fetch pharmacies" }, { status: 500 });
  }
}

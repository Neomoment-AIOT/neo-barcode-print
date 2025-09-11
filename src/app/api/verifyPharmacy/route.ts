import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phar_id = searchParams.get("phar_id");
  const phar_name = searchParams.get("phar_name");

  if (!phar_id || !phar_name) {
    return NextResponse.json({ exists: false });
  }

  try {
    const record = await prisma.pharmacy_id_table.findFirst({
      where: {
        phar_id: Number(phar_id),
        phar_name: phar_name,
      },
    });

    return NextResponse.json({ exists: !!record });
  } catch (err) {
    console.error("DB error", err);
    return NextResponse.json({ exists: false });
  }
}

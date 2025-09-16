import { NextResponse } from "next/server";
import {prisma} from "@/app/lib/prisma";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const user = await prisma.users.findUnique({
    where: { username },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: "Wrong username" });
  }

  if (user.password !== password) {
    return NextResponse.json({ success: false, message: "Wrong password" });
  }

  // ✅ If login ok, return success
  return NextResponse.json({ success: true, username: user.username });
}

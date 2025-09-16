// app/api/login/route.ts
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

  if (user.password !== password) { // ⚠️ Use bcrypt in production
    return NextResponse.json({ success: false, message: "Wrong password" });
  }

  // Create response and attach cookie
  const res = NextResponse.json({ success: true });
  res.cookies.set("session", String(user.id), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return res;
}

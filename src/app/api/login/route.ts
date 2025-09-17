import { NextResponse } from "next/server";
import {prisma} from "../../lib/prisma";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.users.findUnique({
    where: { username },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: "Wrong username" });
  }

  if (user.password !== password) {
    return NextResponse.json({ success: false, message: "Wrong password" });
  }

  return NextResponse.json({ success: true, username: user.username });
}

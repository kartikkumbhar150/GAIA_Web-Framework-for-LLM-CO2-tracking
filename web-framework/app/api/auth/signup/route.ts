import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signJWT } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const password_hash = await hashPassword(password);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email`,
      [name, email, password_hash]
    );

    const token = await signJWT({ userId: result.rows[0].id }); // Added await here

    const res = NextResponse.json({ success: true });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Also fixed this - should match environment
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // Added maxAge for consistency
      path: "/",
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }
}
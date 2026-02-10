import { NextResponse } from "next/server";
import { signJWT } from "@/lib/jwt";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { email, name } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    // Check if user exists
    let result = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    let userId;

    if (result.rows.length === 0) {
      // User doesn't exist - create new user
      console.log("📝 Creating new user for:", email);
      
      const insertResult = await db.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name || email.split('@')[0], email, ''] // Empty password for OAuth users
      );
      
      userId = insertResult.rows[0].id;
      console.log("✅ New user created:", userId);
    } else {
      // User exists
      userId = result.rows[0].id;
      console.log("✅ Existing user found:", userId);
    }

    const token = await signJWT({ userId });

    const res = NextResponse.json({ success: true });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("❌ OAuth JWT error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
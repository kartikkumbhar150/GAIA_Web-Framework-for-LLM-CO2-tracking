import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signJWT(payload: { userId: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}
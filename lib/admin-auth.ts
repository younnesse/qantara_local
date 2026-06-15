import { jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export async function verifyAdmin() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload && payload.role === "admin") {
      return payload as { id: string; name: string; email: string; role: "admin" }
    }
  } catch (error) {
    console.error("JWT Verification error:", error)
  }
  return null
}

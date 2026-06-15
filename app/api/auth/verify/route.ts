import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "Missing verification token." }, { status: 400 })
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 })
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ error: "Token has expired. Please sign up again or request a new link." }, { status: 400 })
    }

    // Find if it's a provider or client and verify them
    const provider = await prisma.provider.findUnique({ where: { email: verificationToken.email } })
    const client = await prisma.client.findUnique({ where: { email: verificationToken.email } })

    if (provider) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { emailVerified: true }
      })
    } else if (client) {
      await prisma.client.update({
        where: { id: client.id },
        data: { emailVerified: true }
      })
    } else {
      return NextResponse.json({ error: "User associated with this token no longer exists." }, { status: 400 })
    }

    // Clean up the token
    await prisma.verificationToken.delete({ where: { token } })

    // Clean up development verification code file
    try {
      const fs = await import("fs")
      const path = await import("path")
      const codeFilePath = path.join(process.cwd(), "verification_code.txt")
      if (fs.existsSync(codeFilePath)) {
        fs.unlinkSync(codeFilePath)
      }
    } catch (e) {
      console.error("Failed to delete verification_code.txt file:", e)
    }

    return NextResponse.json({ message: "Email verified successfully!" }, { status: 200 })

  } catch (error) {
    console.error("Verification API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

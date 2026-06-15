import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required." },
        { status: 400 }
      )
    }

    // Check if email is permanently banned
    const bannedEmail = await prisma.bannedEmail.findUnique({
      where: { email },
    })

    if (bannedEmail) {
      return NextResponse.json(
        { error: "This email address has been permanently banned from the platform." },
        { status: 403 }
      )
    }

    // Check if the user already exists for this exact role
    let existingUser = null;
    if (role.toUpperCase() === "PROVIDER") {
      existingUser = await prisma.provider.findUnique({ where: { email } })
    } else {
      existingUser = await prisma.client.findUnique({ where: { email } })
    }

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: `An account with this email already exists and is verified for the role: ${role.toLowerCase()}` },
          { status: 400 }
        )
      }
      // If the user exists but is not verified, we will allow updating their signup info
    }

    // Hash the password securely
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create or update the user
    let newUser = null;
    if (role.toUpperCase() === "PROVIDER") {
      if (existingUser) {
        newUser = await prisma.provider.update({
          where: { email },
          data: { name, password: hashedPassword },
        })
      } else {
        newUser = await prisma.provider.create({
          data: { name, email, password: hashedPassword },
        })
      }
    } else {
      if (existingUser) {
        newUser = await prisma.client.update({
          where: { email },
          data: { name, password: hashedPassword },
        })
      } else {
        newUser = await prisma.client.create({
          data: { name, email, password: hashedPassword },
        })
      }
    }

    // Delete any existing verification tokens for this email to prevent duplicates/stale data
    await prisma.verificationToken.deleteMany({
      where: { email: newUser.email }
    })

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await prisma.verificationToken.create({
      data: {
        email: newUser.email,
        token: code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    })

    // Send the email
    const { sendVerificationEmail } = await import("@/lib/email")
    const emailSent = await sendVerificationEmail(newUser.email, code)

    // Send the Telegram notification (fails silently if not configured)
    try {
      const { sendTelegramNotification } = await import("@/lib/telegram")
      await sendTelegramNotification(
        `🔑 <b>[Qantara Signup]</b>\n` +
        `<b>Email:</b> <code>${newUser.email}</code>\n` +
        `<b>Verification Code:</b> <code>${code}</code>\n` +
        `<b>Role:</b> ${role.toLowerCase()}\n` +
        `<b>Time:</b> ${new Date().toLocaleString()}`
      )
    } catch (tgErr) {
      console.error("Failed to send Telegram notification:", tgErr)
    }

    // Development/Fallback Logging: Write to a file in the workspace so the dev can see it easily
    try {
      const fs = await import("fs")
      const path = await import("path")
      const codeFilePath = path.join(process.cwd(), "verification_code.txt")
      fs.writeFileSync(
        codeFilePath,
        `Email: ${newUser.email}\nVerification Code: ${code}\nSent At: ${new Date().toISOString()}\nStatus: ${
          emailSent ? "Sent via Email" : "Email failed, fallback active"
        }\n`
      )
      console.log(`\n========================================\n[DEV ONLY] OTP verification code written to verification_code.txt\nEmail: ${newUser.email}\nCode: ${code}\n========================================\n`)
    } catch (fsErr) {
      console.error("Failed to write verification code to file:", fsErr)
    }

    return NextResponse.json({ 
      message: "Account created successfully. Please check your email to verify your account." 
    }, { status: 201 })

  } catch (error) {
    console.error("Signup API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

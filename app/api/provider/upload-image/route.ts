import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const userId = formData.get("userId") as string | null
    const file = formData.get("file") as File | null

    if (!userId || !file) {
      return NextResponse.json({ message: "User ID and file are required." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Invalid file type. Please upload a JPEG, PNG, or WebP image." }, { status: 400 })
    }

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ message: "File is too large. Maximum size is 4MB." }, { status: 400 })
    }

    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    // Clean up any existing profile images for this user
    try {
      const files = await fs.readdir(uploadsDir)
      const prefix = `profile_${userId}_`
      for (const f of files) {
        if (f.startsWith(prefix)) {
          await fs.unlink(path.join(uploadsDir, f))
        }
      }
    } catch (err) {
      console.warn("Failed to clean up old profile images:", err)
    }

    // Save the new file
    const ext = path.extname(file.name) || ".jpg"
    const fileName = `profile_${userId}_${Date.now()}${ext}`
    const filePath = path.join(uploadsDir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    const imageUrl = `/uploads/${fileName}`

    // Update database record
    await prisma.provider.update({
      where: { id: userId },
      data: { profileImage: imageUrl }
    })

    return NextResponse.json({
      success: true,
      url: imageUrl
    })

  } catch (error) {
    console.error("Upload Image API Error:", error)
    return NextResponse.json({
      message: `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`
    }, { status: 500 })
  }
}

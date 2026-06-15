import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdmin } from "@/lib/admin-auth"

export async function GET() {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const certificates = await prisma.authorityCertificate.findMany({
      orderBy: [
        { category: "asc" },
        { holderName: "asc" }
      ]
    })

    return NextResponse.json({ certificates }, { status: 200 })
  } catch (error) {
    console.error("GET Authority Registry Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { certId, holderName, receivedDate, category } = await req.json()

    if (!certId || !holderName || !receivedDate || !category) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })
    }

    const ALLOWED_CATEGORIES = ["doctors", "programmer", "translator"]
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category selection." }, { status: 400 })
    }

    // Check if duplicate ID exists
    const existing = await prisma.authorityCertificate.findUnique({
      where: { certId }
    })
    if (existing) {
      return NextResponse.json({ error: `A certificate with ID "${certId}" already exists in the registry.` }, { status: 400 })
    }

    const newCert = await prisma.authorityCertificate.create({
      data: {
        certId,
        holderName,
        receivedDate: new Date(receivedDate),
        category
      }
    })

    return NextResponse.json({ success: true, certificate: newCert }, { status: 201 })
  } catch (error) {
    console.error("POST Authority Registry Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID parameter is required." }, { status: 400 })
    }

    await prisma.authorityCertificate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Certificate removed from authority registry." }, { status: 200 })
  } catch (error) {
    console.error("DELETE Authority Registry Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

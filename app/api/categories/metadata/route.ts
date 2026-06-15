// app/api/categories/metadata/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.professionalCategory.findMany({
      include: {
        regulatoryBodies: true,
        trades: true,
        autoEntrepreneurActivities: true
      },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (err) {
    console.error("Failed to fetch categories metadata:", err)
    return NextResponse.json({ error: "Failed to fetch categories metadata" }, { status: 500 })
  }
}

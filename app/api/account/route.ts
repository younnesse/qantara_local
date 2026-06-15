import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request) {
  try {
    const { userId, role } = await req.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required." },
        { status: 400 }
      )
    }

    // Soft delete the account by setting the deletedAt timestamp
    if (role.toUpperCase() === "PROVIDER") {
      await prisma.provider.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      })
    } else {
      await prisma.client.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, message: "Account marked for deletion." }, { status: 200 })
  } catch (error) {
    console.error("Account Deletion API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, role, email, password } = await req.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required." },
        { status: 400 }
      )
    }

    const dataToUpdate: any = {}
    if (email) dataToUpdate.email = email
    if (password) dataToUpdate.password = password

    if (role.toUpperCase() === "PROVIDER") {
      await prisma.provider.update({
        where: { id: userId },
        data: dataToUpdate,
      })
    } else {
      await prisma.client.update({
        where: { id: userId },
        data: dataToUpdate,
      })
    }

    return NextResponse.json({ success: true, message: "Account updated successfully." }, { status: 200 })
  } catch (error) {
    console.error("Account Update API Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    let userId = formData.get("userId") as string | null
    const idCardFile = formData.get("idCard") as File | null
    const selfieBase64 = formData.get("selfie") as string | null
    const yotiSessionId = formData.get("diditSessionId") as string | null

    if (!userId) {
      // Fallback: Try to read userId from auth_token cookie
      const authHeader = req.headers.get("cookie")
      if (authHeader) {
        const token = authHeader.split("; ").find(c => c.startsWith("auth_token="))?.split("=")[1]
        if (token) {
          try {
            const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")
            const { payload } = await jwtVerify(token, JWT_SECRET)
            userId = (payload as any).id || null
          } catch (jwtError) {
            console.error("JWT verification failed in verify-identity fallback:", jwtError)
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ message: "User ID is required. Please log in again." }, { status: 400 })
    }

    const hasDidit = !!yotiSessionId
    const isMissingRequiredFields = hasDidit
      ? false
      : (!idCardFile || !selfieBase64)

    if (isMissingRequiredFields) {
      return NextResponse.json({ message: "ID Card image and Selfie photo are required for manual verification." }, { status: 400 })
    }

    // Retrieve provider
    const provider = await prisma.provider.findUnique({
      where: { id: userId }
    })
    if (!provider) {
      return NextResponse.json({ message: "Provider not found." }, { status: 404 })
    }

    if (hasDidit) {
      let updatedProvider = null
      try {
        const { checkAndUpdateDiditStatus } = await import("@/lib/didit")
        updatedProvider = await checkAndUpdateDiditStatus(userId, yotiSessionId!)
      } catch (diditError: any) {
        console.error("Didit check failed during submission:", diditError)
      }

      if (updatedProvider) {
        // Send Telegram alert
        try {
          const { sendTelegramNotification } = await import("@/lib/telegram")
          await sendTelegramNotification(
            `👤 <b>[Identity Verification Updated]</b>\n` +
            `<b>Provider:</b> ${provider.name || "Unknown"} (ID: <code>${userId}</code>)\n` +
            `<b>Mode:</b> Didit IDV\n` +
            `<b>Status:</b> ${updatedProvider.identityStatus}\n` +
            `<b>AI message:</b> <i>${updatedProvider.aiAnalysisMessage}</i>\n` +
            `<b>Time:</b> ${new Date().toLocaleString()}`
          )
        } catch (tgErr) {
          console.error("Failed to send Telegram notification:", tgErr)
        }

        return NextResponse.json({
          success: true,
          message: updatedProvider.identityStatus === "APPROVED" ? "Identity verified successfully." : "Identity verification failed.",
          identityStatus: updatedProvider.identityStatus,
          overallStatus: updatedProvider.certificateStatus
        })
      } else {
        // Still pending/in-review. Save the session ID in yotiName and set status to PENDING.
        const identityStatus = "PENDING"
        const overallStatus = "PENDING"

        await prisma.provider.update({
          where: { id: userId },
          data: {
            identityStatus,
            certificateStatus: overallStatus,
            aiAnalysisMessage: "Didit verification is in review.",
            yotiName: yotiSessionId, // Store the session ID here to poll later
            verificationSubmittedAt: new Date()
          }
        })

        // Send Telegram alert
        try {
          const { sendTelegramNotification } = await import("@/lib/telegram")
          await sendTelegramNotification(
            `👤 <b>[Identity Verification Submitted - In Review]</b>\n` +
            `<b>Provider:</b> ${provider.name || "Unknown"} (ID: <code>${userId}</code>)\n` +
            `<b>Mode:</b> Didit IDV (In Review)\n` +
            `<b>Time:</b> ${new Date().toLocaleString()}`
          )
        } catch (tgErr) {
          console.error("Failed to send Telegram notification:", tgErr)
        }

        return NextResponse.json({
          success: true,
          message: "Identity verification submitted. Status: In Review.",
          identityStatus,
          overallStatus
        })
      }

    } else {
      // Manual upload mode
      const idCardBuffer = Buffer.from(await idCardFile!.arrayBuffer())
      const idCardExt = path.extname(idCardFile!.name) || ".jpg"
      
      const selfieCleaned = selfieBase64!.replace(/^data:image\/\w+;base64,/, "")
      const selfieBuffer = Buffer.from(selfieCleaned, "base64")
      
      const aiFaceMatch = true
      const aiNameMatch = true
      const aiAnalysisMessage = "Manual ID verification submitted. Ready for admin review."

      // Save files
      const uploadsDir = path.join(process.cwd(), "public", "uploads")
      await fs.mkdir(uploadsDir, { recursive: true })

      const idCardUrl = `/uploads/${userId}_id${idCardExt}`
      const selfieUrl = `/uploads/${userId}_selfie.jpg`

      await fs.writeFile(path.join(uploadsDir, `${userId}_id${idCardExt}`), idCardBuffer)
      await fs.writeFile(path.join(uploadsDir, `${userId}_selfie.jpg`), selfieBuffer)

      // Check professional status
      let isProfessionalOk = false
      if (provider.category === "regulated_profession") {
        isProfessionalOk = provider.licenseStatus === "VERIFIED"
      } else if (provider.category === "artisan") {
        isProfessionalOk = provider.cnamCardStatus === "VERIFIED"
      } else if (provider.category === "auto_entrepreneur") {
        isProfessionalOk = provider.anaeCardStatus === "VERIFIED"
      }

      const identityStatus = "PENDING"
      const overallStatus = "PENDING"

      await prisma.provider.update({
        where: { id: userId },
        data: {
          identityStatus,
          certificateStatus: overallStatus,
          idCardImage: idCardUrl,
          selfieImage: selfieUrl,
          aiFaceMatch,
          aiNameMatch,
          aiAnalysisMessage,
          verificationSubmittedAt: new Date()
        }
      })

      // Send Telegram alert
      try {
        const { sendTelegramNotification } = await import("@/lib/telegram")
        await sendTelegramNotification(
          `👤 <b>[Identity Verification Submitted]</b>\n` +
          `<b>Provider:</b> ${provider.name || "Unknown"} (ID: <code>${userId}</code>)\n` +
          `<b>Mode:</b> Manual Upload (Pending)\n` +
          `<b>Time:</b> ${new Date().toLocaleString()}`
        )
      } catch (tgErr) {
        console.error("Failed to send Telegram notification:", tgErr)
      }

      return NextResponse.json({
        success: true,
        message: "Identity documents submitted for admin review.",
        identityStatus,
        overallStatus
      })
    }

  } catch (error) {
    console.error("Verify Identity API Error:", error)
    return NextResponse.json({ 
      message: `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}` 
    }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import bcrypt from "bcryptjs"
import { getVerificationPrompt } from "@/lib/gemini-prompts"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    let userId = formData.get("userId") as string | null
    const professionalCategoryId = formData.get("professionalCategoryId") as string | null
    const subCategoryId = formData.get("subCategoryId") as string | null
    const customActivityName = formData.get("customActivityName") as string | null
    const certificateId = formData.get("certificateId") as string | null
    const certificateFile = formData.get("certificate") as File | null

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
            console.error("JWT verification failed in verify-professional fallback:", jwtError)
          }
        }
      }
    }

    if (!userId || !professionalCategoryId || !certificateFile) {
      return NextResponse.json({ message: "All verification fields are required." }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ message: "Gemini API key is not configured on the server." }, { status: 500 })
    }

    // Retrieve provider
    const provider = await prisma.provider.findUnique({
      where: { id: userId }
    })
    if (!provider) {
      return NextResponse.json({ message: "Provider not found." }, { status: 404 })
    }

    // Look up category record
    const categoryRecord = await prisma.professionalCategory.findFirst({
      where: {
        OR: [
          { id: professionalCategoryId },
          { name: professionalCategoryId }
        ]
      }
    })
    if (!categoryRecord) {
      return NextResponse.json({ message: "Professional category not found." }, { status: 400 })
    }

    // Save certificate file
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })
    const certExt = path.extname(certificateFile.name) || ".jpg"
    const certFileName = `${userId}_cert${certExt}`
    const certPath = path.join(uploadsDir, certFileName)
    const certBuffer = Buffer.from(await certificateFile.arrayBuffer())
    await fs.writeFile(certPath, certBuffer)
    const certUrl = `/uploads/${certFileName}`

    // Call LayoutLMv3 local server for OCR/Extraction
    let aiFaceMatch = true
    let aiNameMatch = false
    let aiAnalysisMessage = "LayoutLMv3 OCR completed."
    let extractedFullName = ""
    let extractedDate = ""
    let extractedNumber = ""

    try {
      const localFormData = new FormData()
      const fileBlob = new Blob([certBuffer], { type: certificateFile.type || "image/jpeg" })
      localFormData.append("file", fileBlob, certificateFile.name || "cert.jpg")

      const lmv3Response = await fetch("http://localhost:8000/verify-certificate", {
        method: "POST",
        body: localFormData
      })

      if (!lmv3Response.ok) {
        const errText = await lmv3Response.text()
        console.error("LMv3 local API Error details:", errText)
        aiAnalysisMessage = `LayoutLMv3 model local server error: ${lmv3Response.statusText}`
      } else {
        const lmv3Data = await lmv3Response.json()
        if (lmv3Data.status === "success" && lmv3Data.extracted_data) {
          extractedFullName = lmv3Data.extracted_data.FULL_NAME || ""
          extractedDate = lmv3Data.extracted_data.DATE || ""
          extractedNumber = lmv3Data.extracted_data.ID || ""

          // Compare name on card with Yoti-extracted name, or provider's profile name if Yoti not used
          const targetCompareName = (provider.yotiName || provider.name || "").trim().toLowerCase()
          const cardName = extractedFullName.trim().toLowerCase()
          
          if (targetCompareName && cardName) {
            const wordsTarget = targetCompareName.split(/\s+/)
            const wordsCard = cardName.split(/\s+/)
            // Check if at least 2 words match
            const commonWords = wordsTarget.filter(w => wordsCard.includes(w))
            aiNameMatch = commonWords.length >= Math.min(2, wordsTarget.length)
          } else {
            aiNameMatch = targetCompareName === cardName
          }

          aiAnalysisMessage = lmv3Data.message || `LayoutLMv3 OCR complete. Match status: ${aiNameMatch ? "Name Matches" : "Name Mismatch"}.`
        } else {
          aiAnalysisMessage = lmv3Data.message || "LayoutLMv3 model processing failed or returned empty results."
        }
      }
    } catch (lmv3Error: any) {
      console.error("Failed to run LayoutLMv3 OCR:", lmv3Error)
      aiAnalysisMessage = "Failed to call local LayoutLMv3 server. Make sure it is running on http://localhost:8000!"
    }

    // Process "Other" activity selection for Auto-Entrepreneur
    let finalSubCategoryId = subCategoryId
    if (categoryRecord.name === "auto_entrepreneur" && subCategoryId === "other") {
      if (!customActivityName || !customActivityName.trim()) {
        return NextResponse.json({ message: "Custom activity name is required when choosing Other." }, { status: 400 })
      }
      const trimmedName = customActivityName.trim()
      let activityRecord = await prisma.autoEntrepreneurActivity.findFirst({
        where: {
          categoryId: categoryRecord.id,
          nameFr: { equals: trimmedName, mode: "insensitive" }
        }
      })
      if (!activityRecord) {
        activityRecord = await prisma.autoEntrepreneurActivity.create({
          data: {
            name: trimmedName.toLowerCase().replace(/\s+/g, "_"),
            nameFr: trimmedName,
            nameEn: trimmedName,
            nameAr: trimmedName,
            categoryId: categoryRecord.id
          }
        })
      }
      finalSubCategoryId = activityRecord.id
    }

    // Use extracted number from Gemini OCR or fallback to manually typed ID if any, or default to PENDING_OCR
    const finalCertId = (extractedNumber || certificateId || "PENDING_OCR").trim()

    // Hash the ID for security logs
    let extractedIdHash = null
    const rawIdToHash = finalCertId
    if (rawIdToHash) {
      const salt = await bcrypt.genSalt(10)
      extractedIdHash = await bcrypt.hash(rawIdToHash, salt)
    }

    // Update database fields
    const dataUpdate: any = {
      certificateId: finalCertId,
      certificateImage: certUrl,
      certificateIdHash: extractedIdHash,
      extractedFullName: extractedFullName || null,
      extractedDate: extractedDate || null,
      aiNameMatch,
      aiFaceMatch, // selfie checked separately in identity verification
      aiAnalysisMessage,
      professionalCategoryId: categoryRecord.id,
      category: categoryRecord.name,
      certificateStatus: "PENDING" // keeps pending overall review
    }

    if (categoryRecord.name === "regulated_profession") {
      dataUpdate.regulatoryBodyId = finalSubCategoryId
      dataUpdate.licenseNumber = finalCertId
      dataUpdate.licenseDocumentUrl = certUrl
      dataUpdate.licenseStatus = "PENDING"
    } else if (categoryRecord.name === "artisan") {
      dataUpdate.tradeId = finalSubCategoryId
      dataUpdate.cnamCardNumber = finalCertId
      dataUpdate.cnamCardDocumentUrl = certUrl
      dataUpdate.cnamCardStatus = "PENDING"
    } else if (categoryRecord.name === "auto_entrepreneur") {
      dataUpdate.autoEntrepreneurActivityId = finalSubCategoryId
      dataUpdate.anaeCardNumber = finalCertId
      dataUpdate.anaeCardDocumentUrl = certUrl
      dataUpdate.anaeCardStatus = "PENDING"
    }

    await prisma.provider.update({
      where: { id: userId },
      data: dataUpdate
    })

    // Send Telegram alert
    try {
      const { sendTelegramNotification } = await import("@/lib/telegram")
      await sendTelegramNotification(
        `📄 <b>[Professional Proof Submitted]</b>\n` +
        `<b>Provider:</b> ${provider.name || "Unknown"} (ID: <code>${userId}</code>)\n` +
        `<b>Category:</b> ${categoryRecord.nameFr}\n` +
        `<b>AI Name Match:</b> ${aiNameMatch ? "✅ Yes" : "❌ No"}\n` +
        `<b>Extracted Name:</b> ${extractedFullName || "N/A"}\n` +
        `<b>Extracted No:</b> ${extractedNumber || "N/A"}\n` +
        `<b>AI message:</b> <i>${aiAnalysisMessage}</i>\n` +
        `<b>Time:</b> ${new Date().toLocaleString()}`
      )
    } catch (tgErr) {
      console.error("Failed to send Telegram notification:", tgErr)
    }

    return NextResponse.json({
      success: true,
      message: "Professional credentials submitted for admin audit and review.",
      ai_audit: {
        faces_match: true,
        names_match: aiNameMatch,
        message: aiAnalysisMessage
      }
    })

  } catch (error) {
    console.error("Verify Professional API Error:", error)
    return NextResponse.json({ 
      message: `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}` 
    }, { status: 500 })
  }
}

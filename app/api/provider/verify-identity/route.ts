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

    let idCardBuffer: Buffer
    let selfieBuffer: Buffer
    let idCardExt = ".jpg"
    let aiFaceMatch = false
    let aiNameMatch = false
    let aiAnalysisMessage = "AI identity verification completed."
    let selfieCleaned = ""
    let yotiName: string | null = null

    if (hasDidit) {
      const apiKey = process.env.DIDIT_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ message: "Didit API Key is not configured on the server." }, { status: 500 });
      }

      try {
        const diditRes = await fetch(`https://verification.didit.me/v3/session/${yotiSessionId}/decision/`, {
          headers: {
            "x-api-key": apiKey
          }
        });

        if (!diditRes.ok) {
          const errText = await diditRes.text();
          console.error("Didit API decision retrieval failed:", errText);
          return NextResponse.json({ message: `Didit API Error: ${diditRes.statusText || errText}` }, { status: 400 });
        }

        const session = await diditRes.json();
        
        if (session.status !== "Approved") {
          return NextResponse.json({ message: `Didit session is not approved. Current status: ${session.status}` }, { status: 400 });
        }

        const idDocs = session.id_verifications || [];
        if (idDocs.length === 0) {
          return NextResponse.json({ message: "No identity documents found in the Didit session." }, { status: 400 });
        }

        const primaryDoc = idDocs[0];
        const frontImageUrl = primaryDoc.front_image;
        const portraitImageUrl = primaryDoc.portrait_image || primaryDoc.front_image;

        if (!frontImageUrl) {
          return NextResponse.json({ message: "Document image is not available in Didit session." }, { status: 400 });
        }

        // Download front image
        const idCardRes = await fetch(frontImageUrl);
        if (!idCardRes.ok) {
          return NextResponse.json({ message: "Failed to retrieve document image from Didit." }, { status: 400 });
        }
        idCardBuffer = Buffer.from(await idCardRes.arrayBuffer());
        
        if (frontImageUrl.includes(".png")) idCardExt = ".png";
        else if (frontImageUrl.includes(".gif")) idCardExt = ".gif";
        else idCardExt = ".jpg";

        // Download portrait image (selfie)
        if (portraitImageUrl) {
          const selfieRes = await fetch(portraitImageUrl);
          if (selfieRes.ok) {
            selfieBuffer = Buffer.from(await selfieRes.arrayBuffer());
          }
        }
        
        if (!selfieBuffer!) {
          selfieBuffer = idCardBuffer;
        }

        aiFaceMatch = true;
        aiNameMatch = true;

        const firstName = primaryDoc.first_name || "";
        const lastName = primaryDoc.last_name || "";
        yotiName = `${firstName} ${lastName}`.trim();

        aiAnalysisMessage = `Successfully verified via Didit IDV Session. Status: Approved. Extracted Name: "${yotiName}".`;

      } catch (diditError: any) {
        console.error("Didit Session Retrieval Error:", diditError);
        return NextResponse.json({ message: `Failed to retrieve Didit session results: ${diditError.message || diditError}` }, { status: 400 });
      }

    } else {
      // Manual upload mode
      idCardBuffer = Buffer.from(await idCardFile!.arrayBuffer())
      idCardExt = path.extname(idCardFile!.name) || ".jpg"
      
      selfieCleaned = selfieBase64!.replace(/^data:image\/\w+;base64,/, "")
      selfieBuffer = Buffer.from(selfieCleaned, "base64")
      
      aiFaceMatch = true
      aiNameMatch = true
      aiAnalysisMessage = "Manual ID verification submitted. Ready for admin review."
    }

    // Save files
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })

    const idCardUrl = `/uploads/${userId}_id${idCardExt}`
    const selfieUrl = `/uploads/${userId}_selfie.jpg`

    await fs.writeFile(path.join(uploadsDir, `${userId}_id${idCardExt}`), idCardBuffer!)
    await fs.writeFile(path.join(uploadsDir, `${userId}_selfie.jpg`), selfieBuffer!)

    // Check professional status of the provider.
    // If they have completed professional verification already, set certificateStatus to VALID.
    let isProfessionalOk = false
    if (provider.category === "regulated_profession") {
      isProfessionalOk = provider.licenseStatus === "VERIFIED"
    } else if (provider.category === "artisan") {
      isProfessionalOk = provider.cnamCardStatus === "VERIFIED"
    } else if (provider.category === "auto_entrepreneur") {
      isProfessionalOk = provider.anaeCardStatus === "VERIFIED"
    }

    // Didit can auto-approve identity, manual submits as PENDING
    const identityStatus = hasDidit ? "APPROVED" : "PENDING"
    const overallStatus = (identityStatus === "APPROVED" && isProfessionalOk) ? "VALID" : "PENDING"

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
        yotiName,
        verificationSubmittedAt: new Date()
      }
    })

    // Send Telegram alert
    try {
      const { sendTelegramNotification } = await import("@/lib/telegram")
      await sendTelegramNotification(
        `👤 <b>[Identity Verification Submitted]</b>\n` +
        `<b>Provider:</b> ${provider.name || "Unknown"} (ID: <code>${userId}</code>)\n` +
        `<b>Mode:</b> ${hasDidit ? "Didit IDV (Auto-approved)" : "Manual Upload (Pending)"}\n` +
        `<b>AI message:</b> <i>${aiAnalysisMessage}</i>\n` +
        `<b>Time:</b> ${new Date().toLocaleString()}`
      )
    } catch (tgErr) {
      console.error("Failed to send Telegram notification:", tgErr)
    }

    return NextResponse.json({
      success: true,
      message: hasDidit ? "Identity verified successfully." : "Identity documents submitted for admin review.",
      identityStatus,
      overallStatus
    })

  } catch (error) {
    console.error("Verify Identity API Error:", error)
    return NextResponse.json({ 
      message: `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}` 
    }, { status: 500 })
  }
}

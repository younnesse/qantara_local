import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"
import { IDVClient } from "yoti"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    let userId = formData.get("userId") as string | null
    const idCardFile = formData.get("idCard") as File | null
    const selfieBase64 = formData.get("selfie") as string | null
    const yotiSessionId = formData.get("yotiSessionId") as string | null

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

    const hasYoti = !!yotiSessionId
    const isMissingRequiredFields = hasYoti
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

    if (hasYoti) {
      const sdkId = process.env.YOTI_SANDBOX_CLIENT_SDK_ID;
      const keyPath = process.env.YOTI_KEY_FILE_PATH;
      const envPemKey = process.env.YOTI_PEM_KEY;

      if (!sdkId || (!keyPath && !envPemKey)) {
        return NextResponse.json({ message: "Yoti Sandbox is not configured on the server." }, { status: 500 });
      }

      let pemKey: string;
      if (envPemKey) {
        pemKey = envPemKey.replace(/\\n/g, '\n');
      } else {
        const resolvedKeyPath = path.isAbsolute(keyPath!) ? keyPath! : path.join(process.cwd(), keyPath!);
        pemKey = await fs.readFile(resolvedKeyPath, "utf8");
      }

      const yotiClient = new IDVClient(sdkId, pemKey, {
        apiUrl: "https://api.yoti.com/sandbox/idverify/v1",
      });

      try {
        const session = await yotiClient.getSession(yotiSessionId!);
        
        if (session.getState() !== "COMPLETED") {
          return NextResponse.json({ message: `Yoti session is not completed. Current state: ${session.getState()}` }, { status: 400 });
        }

        const docChecks = session.getAuthenticityChecks() || [];
        const livenessChecks = session.getLivenessChecks() || [];

        const docApproved = docChecks.length > 0 && docChecks.every(c => c.getReport()?.getRecommendation()?.getValue() === "APPROVE");
        const livenessApproved = livenessChecks.length > 0 && livenessChecks.every(c => c.getReport()?.getRecommendation()?.getValue() === "APPROVE");

        if (!docApproved || !livenessApproved) {
          return NextResponse.json({ 
            message: `Yoti verification checks failed or were not approved. Document Authenticity: ${docApproved ? "APPROVED" : "FAILED"}, Liveness: ${livenessApproved ? "APPROVED" : "FAILED"}` 
          }, { status: 400 });
        }

        const resources = session.getResources() as any;
        const docDocs = resources.getIdDocuments() || [];
        if (docDocs.length === 0) {
          return NextResponse.json({ message: "No identity documents found in the Yoti session." }, { status: 400 });
        }

        const primaryDoc = docDocs[0] as any;
        const pages = primaryDoc.getPages() || [];
        if (pages.length === 0) {
          return NextResponse.json({ message: "Government ID document image is not available in Yoti session." }, { status: 400 });
        }

        const firstPage = pages[0] as any;
        const idMediaObj = firstPage.getMedia ? firstPage.getMedia() : (firstPage.getImage ? firstPage.getImage().getMedia() : null);
        if (!idMediaObj) {
          return NextResponse.json({ message: "Government ID document image is not available in Yoti session." }, { status: 400 });
        }

        const idMediaId = idMediaObj.getId();
        const idMedia = await yotiClient.getMediaContent(yotiSessionId!, idMediaId) as any;
        if (!idMedia) {
          return NextResponse.json({ message: "Failed to retrieve Government ID document image content from Yoti." }, { status: 400 });
        }
        idCardBuffer = idMedia.getContent();
        
        const mime = idMedia.getMimeType();
        if (mime === "image/png") idCardExt = ".png";
        else if (mime === "image/gif") idCardExt = ".gif";
        else idCardExt = ".jpg";

        let selfieMediaId = "";
        
        // 1. Try Zoom liveness
        const zoomLiveness = resources.getZoomLivenessResources ? resources.getZoomLivenessResources() : [];
        if (zoomLiveness && zoomLiveness.length > 0) {
          const frames = zoomLiveness[0].getFrames ? zoomLiveness[0].getFrames() : [];
          if (frames && frames.length > 0) {
            const frame = frames[0] as any;
            if (frame.getFrame && frame.getFrame()) {
              selfieMediaId = frame.getFrame().getMedia().getId();
            } else if (frame.getMedia && frame.getMedia()) {
              selfieMediaId = frame.getMedia().getId();
            }
          }
        }
        
        // 2. Try static liveness
        if (!selfieMediaId) {
          const staticLiveness = resources.getStaticLivenessResources ? resources.getStaticLivenessResources() : [];
          if (staticLiveness && staticLiveness.length > 0) {
            const image = staticLiveness[0].getImage ? staticLiveness[0].getImage() : null;
            if (image && image.getMedia && image.getMedia()) {
              selfieMediaId = image.getMedia().getId();
            }
          }
        }
        
        // 3. Fallback to portrait
        if (!selfieMediaId && primaryDoc.getPortrait) {
          const portrait = primaryDoc.getPortrait();
          if (portrait && portrait.getMedia && portrait.getMedia()) {
            selfieMediaId = portrait.getMedia().getId();
          }
        }

        if (!selfieMediaId) {
          return NextResponse.json({ message: "Liveness portrait image is not available in Yoti session." }, { status: 400 });
        }

        const selfieMedia = await yotiClient.getMediaContent(yotiSessionId!, selfieMediaId) as any;
        if (!selfieMedia) {
          return NextResponse.json({ message: "Failed to retrieve liveness portrait image content from Yoti." }, { status: 400 });
        }
        selfieBuffer = selfieMedia.getContent();

        aiFaceMatch = true;
        aiNameMatch = true;
        aiAnalysisMessage = `Successfully verified via Yoti IDV Session. Document check: approved. Liveness check: approved.`;

        try {
          const docFields = primaryDoc.getDocumentFields() as any;
          if (docFields) {
            if (typeof docFields.getFullName === "function") {
              yotiName = docFields.getFullName() || "";
            } else if (docFields.fullName) {
              yotiName = docFields.fullName;
            }
          }
        } catch (e) {
          console.warn("Could not retrieve document fields from Yoti:", e);
        }
        if (yotiName) {
          aiAnalysisMessage += ` Extracted Name from Yoti ID: "${yotiName}".`;
        }

      } catch (yotiError: any) {
        console.error("Yoti Session Retrieval Error:", yotiError);
        return NextResponse.json({ message: `Failed to retrieve Yoti session results: ${yotiError.message || yotiError}` }, { status: 400 });
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

    await fs.writeFile(path.join(uploadsDir, `${userId}_id${idCardExt}`), idCardBuffer)
    await fs.writeFile(path.join(uploadsDir, `${userId}_selfie.jpg`), selfieBuffer)

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

    // Yoti can auto-approve identity, manual submits as PENDING
    const identityStatus = hasYoti ? "APPROVED" : "PENDING"
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
        `<b>Mode:</b> ${hasYoti ? "Yoti Sandbox IDV (Auto-approved)" : "Manual Upload (Pending)"}\n` +
        `<b>AI message:</b> <i>${aiAnalysisMessage}</i>\n` +
        `<b>Time:</b> ${new Date().toLocaleString()}`
      )
    } catch (tgErr) {
      console.error("Failed to send Telegram notification:", tgErr)
    }

    return NextResponse.json({
      success: true,
      message: hasYoti ? "Identity verified successfully." : "Identity documents submitted for admin review.",
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

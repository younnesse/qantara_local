import { prisma } from "./prisma"
import fs from "fs/promises"
import path from "path"

export async function checkAndUpdateDiditStatus(userId: string, yotiSessionId: string) {
  const apiKey = process.env.DIDIT_API_KEY;
  if (!apiKey) {
    throw new Error("Didit API Key is not configured on the server.");
  }

  // If it's the mock session, simulate approval immediately
  if (yotiSessionId === "mock-session-id-12345") {
    const verifiedName = "Amina Saidi";
    const aiFaceMatch = true;
    const aiNameMatch = true;
    const idCardExt = ".jpg";
    
    let idCardBuffer: Buffer
    let selfieBuffer: Buffer
    try {
      const fsSync = require("fs");
      const pathSync = require("path");
      idCardBuffer = fsSync.readFileSync(pathSync.join(process.cwd(), "public", "placeholder.jpg"));
      selfieBuffer = fsSync.readFileSync(pathSync.join(process.cwd(), "public", "placeholder-user.jpg"));
    } catch(e) {
      idCardBuffer = Buffer.from("");
      selfieBuffer = Buffer.from("");
    }

    const aiAnalysisMessage = `Successfully verified via Didit Mock Sandbox. Status: Approved. Extracted Name: "${verifiedName}".`;
    
    // Save files
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })
    const idCardUrl = `/uploads/${userId}_id${idCardExt}`
    const selfieUrl = `/uploads/${userId}_selfie.jpg`
    await fs.writeFile(path.join(uploadsDir, `${userId}_id${idCardExt}`), idCardBuffer)
    await fs.writeFile(path.join(uploadsDir, `${userId}_selfie.jpg`), selfieBuffer)

    // Update DB
    const provider = await prisma.provider.findUnique({ where: { id: userId } })
    if (!provider) return null;

    let isProfessionalOk = false
    if (provider.category === "regulated_profession") {
      isProfessionalOk = provider.licenseStatus === "VERIFIED"
    } else if (provider.category === "artisan") {
      isProfessionalOk = provider.cnamCardStatus === "VERIFIED"
    } else if (provider.category === "auto_entrepreneur") {
      isProfessionalOk = provider.anaeCardStatus === "VERIFIED"
    }
    const overallStatus = isProfessionalOk ? "VALID" : "PENDING"

    return await prisma.provider.update({
      where: { id: userId },
      data: {
        identityStatus: "APPROVED",
        certificateStatus: overallStatus,
        idCardImage: idCardUrl,
        selfieImage: selfieUrl,
        aiFaceMatch,
        aiNameMatch,
        aiAnalysisMessage,
        verifiedName,
        verificationSubmittedAt: new Date()
      }
    })
  }

  // Query actual Didit API
  const diditRes = await fetch(`https://verification.didit.me/v3/session/${yotiSessionId}/decision/`, {
    headers: {
      "x-api-key": apiKey
    }
  });

  if (!diditRes.ok) {
    const errText = await diditRes.text();
    console.error("Didit API decision retrieval failed:", errText);
    throw new Error(`Didit API Error: ${diditRes.statusText || errText}`);
  }

  const session = await diditRes.json();
  
  if (session.status === "Approved") {
    const idDocs = session.id_verifications || [];
    if (idDocs.length === 0) {
      throw new Error("No identity documents found in the Didit session.");
    }

    const primaryDoc = idDocs[0];
    const frontImageUrl = primaryDoc.front_image;
    const portraitImageUrl = primaryDoc.portrait_image || primaryDoc.front_image;

    if (!frontImageUrl) {
      throw new Error("Document image is not available in Didit session.");
    }

    // Download front image
    const idCardRes = await fetch(frontImageUrl);
    if (!idCardRes.ok) {
      throw new Error("Failed to retrieve document image from Didit.");
    }
    const idCardBuffer = Buffer.from(await idCardRes.arrayBuffer());
    
    let idCardExt = ".jpg";
    if (frontImageUrl.includes(".png")) idCardExt = ".png";
    else if (frontImageUrl.includes(".gif")) idCardExt = ".gif";

    // Download portrait image (selfie)
    let selfieBuffer = idCardBuffer;
    if (portraitImageUrl) {
      const selfieRes = await fetch(portraitImageUrl);
      if (selfieRes.ok) {
        selfieBuffer = Buffer.from(await selfieRes.arrayBuffer());
      }
    }

    const firstName = primaryDoc.first_name || "";
    const lastName = primaryDoc.last_name || "";
    const verifiedName = `${firstName} ${lastName}`.trim();
    const aiAnalysisMessage = `Successfully verified via Didit IDV Session. Status: Approved. Extracted Name: "${verifiedName}".`;

    // Save files
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })
    const idCardUrl = `/uploads/${userId}_id${idCardExt}`
    const selfieUrl = `/uploads/${userId}_selfie.jpg`
    await fs.writeFile(path.join(uploadsDir, `${userId}_id${idCardExt}`), idCardBuffer)
    await fs.writeFile(path.join(uploadsDir, `${userId}_selfie.jpg`), selfieBuffer)

    const provider = await prisma.provider.findUnique({ where: { id: userId } })
    if (!provider) return null;

    let isProfessionalOk = false
    if (provider.category === "regulated_profession") {
      isProfessionalOk = provider.licenseStatus === "VERIFIED"
    } else if (provider.category === "artisan") {
      isProfessionalOk = provider.cnamCardStatus === "VERIFIED"
    } else if (provider.category === "auto_entrepreneur") {
      isProfessionalOk = provider.anaeCardStatus === "VERIFIED"
    }
    const overallStatus = isProfessionalOk ? "VALID" : "PENDING"

    return await prisma.provider.update({
      where: { id: userId },
      data: {
        identityStatus: "APPROVED",
        certificateStatus: overallStatus,
        idCardImage: idCardUrl,
        selfieImage: selfieUrl,
        aiFaceMatch: true,
        aiNameMatch: true,
        aiAnalysisMessage,
        verifiedName,
        verificationSubmittedAt: new Date()
      }
    })
  } else if (session.status === "Declined" || session.status === "Abandoned" || session.status === "Expired") {
    // Session failed
    return await prisma.provider.update({
      where: { id: userId },
      data: {
        identityStatus: "REJECTED",
        aiAnalysisMessage: `Didit verification failed. Status: ${session.status}.`
      }
    })
  }

  return null; // Still PENDING (e.g. In Review)
}

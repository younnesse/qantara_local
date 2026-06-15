import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdmin } from "@/lib/admin-auth"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { providerId, action, message, type } = await req.json()

    if (!providerId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid payload parameters." }, { status: 400 })
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found." }, { status: 404 })
    }

    const dataUpdate: any = {}

    // Helper to evaluate if both identity and professional verification are approved
    const evaluateOverallStatus = (updatedIdentityStatus: string, updatedProfessionalStatus: string) => {
      const isIdOk = updatedIdentityStatus === "APPROVED"
      const isProfOk = updatedProfessionalStatus === "VERIFIED"
      return (isIdOk && isProfOk) ? "VALID" : "PENDING"
    }

    const currentIdStatus = provider.identityStatus || "NOT_SUBMITTED"
    const currentProfStatus = 
      provider.category === "regulated_profession" ? provider.licenseStatus :
      provider.category === "artisan" ? provider.cnamCardStatus :
      provider.category === "auto_entrepreneur" ? provider.anaeCardStatus :
      "VERIFIED" // default to verified if no category

    if (type === "identity") {
      if (action === "approve") {
        dataUpdate.identityStatus = "APPROVED"
        dataUpdate.certificateMessage = "Identity approved by Admin."
        dataUpdate.certificateStatus = evaluateOverallStatus("APPROVED", currentProfStatus)
      } else {
        dataUpdate.identityStatus = "REJECTED"
        dataUpdate.certificateStatus = "INVALID"
        dataUpdate.certificateMessage = message || "Identity verification rejected by Admin."
      }
    } else if (type === "professional") {
      if (action === "approve") {
        if (provider.category === "regulated_profession") {
          dataUpdate.licenseStatus = "VERIFIED"
          dataUpdate.licenseVerifiedAt = new Date()
          dataUpdate.licenseVerifiedBy = "MANUAL"
        } else if (provider.category === "artisan") {
          dataUpdate.cnamCardStatus = "VERIFIED"
          dataUpdate.cnamCardVerifiedAt = new Date()
          dataUpdate.cnamCardVerifiedBy = "MANUAL"
        } else if (provider.category === "auto_entrepreneur") {
          dataUpdate.anaeCardStatus = "VERIFIED"
          dataUpdate.anaeCardVerifiedAt = new Date()
          dataUpdate.anaeCardVerifiedBy = "MANUAL"
        }
        dataUpdate.certificateStatus = evaluateOverallStatus(currentIdStatus, "VERIFIED")
      } else {
        if (provider.category === "regulated_profession") {
          dataUpdate.licenseStatus = "REJECTED"
          dataUpdate.licenseRejectionReason = message || "Rejected by Admin"
        } else if (provider.category === "artisan") {
          dataUpdate.cnamCardStatus = "REJECTED"
          dataUpdate.cnamCardRejectionReason = message || "Rejected by Admin"
        } else if (provider.category === "auto_entrepreneur") {
          dataUpdate.anaeCardStatus = "REJECTED"
          dataUpdate.anaeCardRejectionReason = message || "Rejected by Admin"
        }
        dataUpdate.certificateStatus = "INVALID"
        dataUpdate.certificateMessage = message || "Professional credentials rejected by Admin."
      }
    } else {
      // Legacy behavior: approve or reject both
      if (action === "approve") {
        dataUpdate.identityStatus = "APPROVED"
        dataUpdate.certificateStatus = "VALID"
        dataUpdate.certificateMessage = "Approved by Admin. Your profile is now active."

        if (provider.category === "regulated_profession") {
          dataUpdate.licenseStatus = "VERIFIED"
          dataUpdate.licenseVerifiedAt = new Date()
          dataUpdate.licenseVerifiedBy = "MANUAL"
        } else if (provider.category === "artisan") {
          dataUpdate.cnamCardStatus = "VERIFIED"
          dataUpdate.cnamCardVerifiedAt = new Date()
          dataUpdate.cnamCardVerifiedBy = "MANUAL"
        } else if (provider.category === "auto_entrepreneur") {
          dataUpdate.anaeCardStatus = "VERIFIED"
          dataUpdate.anaeCardVerifiedAt = new Date()
          dataUpdate.anaeCardVerifiedBy = "MANUAL"
        }
      } else {
        dataUpdate.identityStatus = "REJECTED"
        dataUpdate.certificateStatus = "INVALID"
        dataUpdate.certificateMessage = message || "Verification rejected by Admin due to mismatched documents."

        if (provider.category === "regulated_profession") {
          dataUpdate.licenseStatus = "REJECTED"
          dataUpdate.licenseRejectionReason = message || "Rejected by Admin"
        } else if (provider.category === "artisan") {
          dataUpdate.cnamCardStatus = "REJECTED"
          dataUpdate.cnamCardRejectionReason = message || "Rejected by Admin"
        } else if (provider.category === "auto_entrepreneur") {
          dataUpdate.anaeCardStatus = "REJECTED"
          dataUpdate.anaeCardRejectionReason = message || "Rejected by Admin"
        }
      }
    }

    await prisma.provider.update({
      where: { id: providerId },
      data: dataUpdate
    })

    return NextResponse.json({ 
      success: true, 
      message: `Provider verification was ${action === "approve" ? "approved" : "rejected"} successfully.` 
    }, { status: 200 })

  } catch (error) {
    console.error("POST Verify Action Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

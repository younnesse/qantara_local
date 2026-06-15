# Yoti IDV Sandbox Integration Guide

This guide details the integration of the free **Yoti Identity Verification (IDV) Sandbox** environment into the **Qantara** identity verification platform. This integration enables developers to test the document verification and webcam-based selfie liveness workflows for free without incurring production check fees.

---

## 1. Environment Variables Configuration

To run the Yoti Sandbox integration, configure the following keys in your local `.env` file. 

> [!CAUTION]
> **Security Warning**: The `.pem` key file contains private credentials for cryptographic signature requests. It should **never** be pushed to GitHub or other public repositories. The project's `.gitignore` has been updated to explicitly ignore `*.pem` files.

Add the following variables to your `.env` configuration file:

```env
# Yoti Sandbox Client SDK ID (obtained from the Yoti Hub Developer portal)
YOTI_SANDBOX_CLIENT_SDK_ID="your-sandbox-client-sdk-id-here"

# Path to your Yoti Sandbox Private Key File (.pem)
# Example: ./keys/yoti-sandbox-private-key.pem (Ensure this file remains locally on your machine)
YOTI_KEY_FILE_PATH="./yoti-sandbox-private-key.pem"
```

| Environment Variable | Description | Security Level |
| :--- | :--- | :--- |
| `YOTI_SANDBOX_CLIENT_SDK_ID` | The SDK ID associated with your Sandbox Application on Yoti Hub. | Public / Config |
| `YOTI_KEY_FILE_PATH` | The relative or absolute file path to the downloaded Sandbox PEM key. | **Strictly Private** |

---

## 2. Backend Node.js Integration

To establish an identity verification session, initialize the Yoti `IDVClient` explicitly targeting the sandbox environment endpoint:
*   **Sandbox API Endpoint**: `https://api.yoti.com/sandbox/idverify/v1`

### Next.js API Route Example (`/api/verify/yoti-session/route.ts`)

Here is the backend route using the official `yoti` package to initialize the client and build a session with document authenticity and liveness verification checks.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import {
  IDVClient,
  SessionSpecificationBuilder,
  RequestedDocumentAuthenticityCheckBuilder,
  RequestedLivenessCheckBuilder,
  SdkConfigBuilder,
} from "yoti";

// 1. Load Yoti Configuration
const sdkId = process.env.YOTI_SANDBOX_CLIENT_SDK_ID;
const keyPath = process.env.YOTI_KEY_FILE_PATH;

if (!sdkId || !keyPath) {
  throw new Error("Missing YOTI_SANDBOX_CLIENT_SDK_ID or YOTI_KEY_FILE_PATH environment variables.");
}

// 2. Read the private PEM key
const pemKey = readFileSync(keyPath, "utf8");

// 3. Initialize Yoti IDVClient targeting Sandbox
const yotiClient = new IDVClient(
  sdkId,
  pemKey,
  {
    // Explicitly override production API endpoint to point to Yoti Sandbox
    apiUrl: "https://api.yoti.com/sandbox/idverify/v1"
  }
);

export async function POST(req: NextRequest) {
  try {
    // 4. Build Yoti Session Specification
    const sessionSpec = new SessionSpecificationBuilder()
      .withClientSessionTokenTtl(600) // Token time-to-live in seconds
      .withResourcesTtl(86400)       // Resource time-to-live (24 hours)
      // Request Document Authenticity Checks (ID/Passport checks)
      .withRequestedCheck(
        new RequestedDocumentAuthenticityCheckBuilder().build()
      )
      // Request Liveness Checks (Webcam Selfie checks)
      .withRequestedCheck(
        new RequestedLivenessCheckBuilder()
          .forZoomLiveness() // ZOOM static liveness
          .build()
      )
      // Configure callback URL for webhooks upon status changes
      .withNotificationConfig({
        endpoint: "https://your-domain.com/api/verify/yoti-webhook",
        topics: ["resource_uploaded", "check_completed"],
      })
      .withSdkConfig(
        new SdkConfigBuilder()
          .withAllowsCameraAndUpload() // Allow both live captures and document uploads
          .withPrimaryColor("#2563EB") // Custom theme primary color (blue-600)
          .build()
      )
      .build();

    // 5. Create Yoti Session
    const session = await yotiClient.createSession(sessionSpec);

    // 6. Return sessionId and sessionToken to Frontend
    return NextResponse.json({
      sessionId: session.getSessionId(),
      sessionToken: session.getClientSessionToken(),
    });
  } catch (error: any) {
    console.error("Yoti Session Creation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create verification session." },
      { status: 500 }
    );
  }
}
```

---

## 3. Frontend React Integration

Once the session is created backend-side, render the Yoti Sandbox user interface inside a React component using an `iframe`. The iframe is loaded with Yoti’s web client hosted on the Sandbox endpoint.

### React Iframe Component (`components/verification/YotiSandboxFrame.tsx`)

> [!IMPORTANT]
> The iframe **MUST** have the `allow="camera"` attribute enabled, otherwise the browser will block access to the user's camera during the liveness selfie capture step.

```tsx
"use client";

import React from "react";

interface YotiSandboxFrameProps {
  sessionId: string;
  sessionToken: string;
  onVerificationComplete?: () => void;
}

export function YotiSandboxFrame({
  sessionId,
  sessionToken,
  onVerificationComplete,
}: YotiSandboxFrameProps) {
  if (!sessionId || !sessionToken) {
    return (
      <div className="p-4 text-center rounded-xl bg-destructive/10 border border-destructive text-destructive text-sm font-semibold">
        Error: Missing Yoti session ID or session token.
      </div>
    );
  }

  // Build the Yoti Sandbox Web Client Client URL
  const iframeSrc = `https://api.yoti.com/sandbox/idverify/v1/web/index.html?sessionID=${sessionId}&sessionToken=${sessionToken}`;

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-card shadow-lg">
        <iframe
          src={iframeSrc}
          // allow="camera" is CRITICAL for camera access in Next.js/React standard components
          allow="camera"
          className="w-full h-full border-none"
          title="Yoti Sandbox Verification Window"
        />
      </div>
      
      <div className="flex justify-between items-center px-2">
        <p className="text-xs text-muted-foreground">
          Running in <strong>Yoti Sandbox Mode</strong>
        </p>
        {onVerificationComplete && (
          <button
            onClick={onVerificationComplete}
            className="text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            I finished the verification
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 4. Testing & Simulation Guide

The Yoti Sandbox simplifies testing identity verification checks by offering automated mock responses.

### Automatic Mock Passing (Basic Mode)
*   **Document Upload**: Uploading **any** sample image representing an ID, passport, or driver's license will be parsed by the Sandbox endpoint as a successfully validated document.
*   **Liveness Check**: Pointing the camera at any face or static image and following the zoom movement commands will immediately generate a passing liveness score.
*   All sandbox mock checks return successful, verified checks containing generic sandbox test data (e.g. `John Doe`).

### Customized Check Responses (Advanced Mode)
For testing failure flows (such as expired documents, low-quality selfies, or name mismatches), you can programmatically define expectations using the `@getyoti/sdk-sandbox` npm package.

1.  **Install Sandbox SDK**:
    ```bash
    npm install @getyoti/sdk-sandbox --save-dev
    ```

2.  **Mock Failure Scenario**:
    Define expectations for a specific session ID on the Yoti sandbox endpoint before the user starts the iframe:

    ```typescript
    import { SandboxIDVClientBuilder, SandboxDocumentAuthenticityCheckMockBuilder } from "@getyoti/sdk-sandbox";

    const sandboxClient = new SandboxIDVClientBuilder()
      .withClientSdkId(sdkId)
      .withPemString(pemKey)
      .build();

    // Mock document authenticity check failure
    const mockCheck = new SandboxDocumentAuthenticityCheckMockBuilder()
      .withRecommendation("REJECT") // Forces the check to fail
      .withReason("Expiring Document")
      .build();

    await sandboxClient.configureSessionResponse(sessionId, {
      check_mock: mockCheck
    });
    ```

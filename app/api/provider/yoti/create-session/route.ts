import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import {
  IDVClient,
  SessionSpecificationBuilder,
  RequestedDocumentAuthenticityCheckBuilder,
  RequestedLivenessCheckBuilder,
  SdkConfigBuilder,
} from "yoti";

export async function POST(req: Request) {
  try {
    const sdkId = process.env.YOTI_SANDBOX_CLIENT_SDK_ID;
    const keyPath = process.env.YOTI_KEY_FILE_PATH;
    const envPemKey = process.env.YOTI_PEM_KEY;

    if (!sdkId || (!keyPath && !envPemKey)) {
      return NextResponse.json(
        { message: "Yoti Sandbox environment variables are not configured." },
        { status: 500 }
      );
    }

    let pemKey: string;
    if (envPemKey) {
      pemKey = envPemKey.replace(/\\n/g, '\n');
    } else {
      const resolvedKeyPath = path.isAbsolute(keyPath!)
        ? keyPath!
        : path.join(process.cwd(), keyPath!);
      pemKey = readFileSync(resolvedKeyPath, "utf8");
    }

    // Initialize Yoti IDV Client targeting the Sandbox API
    const yotiClient = new IDVClient(sdkId, pemKey, {
      apiUrl: "https://api.yoti.com/sandbox/idverify/v1",
    });

    // Build the session specification requesting doc authenticity check and webcam liveness check
    const sessionSpec = new SessionSpecificationBuilder()
      .withClientSessionTokenTtl(600) // 10 minutes session TTL
      .withResourcesTtl(90000)       // Resources live for 25 hours (must be at least 24h longer than token TTL)
      .withRequestedCheck(
        new RequestedDocumentAuthenticityCheckBuilder().build()
      )
      .withRequestedCheck(
        new RequestedLivenessCheckBuilder()
          .forZoomLiveness()
          .build()
      )
      .withSdkConfig(
        new SdkConfigBuilder()
          .withAllowsCameraAndUpload()
          .withPrimaryColour("#2563EB")
          .build()
      )
      .build();

    // Create verification session
    const session = await yotiClient.createSession(sessionSpec);

    return NextResponse.json({
      sessionId: session.getSessionId(),
      sessionToken: session.getClientSessionToken(),
    });
  } catch (error: any) {
    console.error("Yoti Session Creation Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create verification session." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId = process.env.DIDIT_WORKFLOW_ID;

    if (!apiKey || !workflowId) {
      return NextResponse.json(
        { message: "Didit API Key or Workflow ID is not configured on the server." },
        { status: 500 }
      );
    }

    const res = await fetch("https://verification.didit.me/v3/session/", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        workflow_id: workflowId
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Didit session creation failed:", errText);
      return NextResponse.json(
        { message: `Didit API Error: ${res.statusText || errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      sessionId: data.session_id,
      sessionUrl: data.session_url
    });

  } catch (error: any) {
    console.error("Didit Session Creation Error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create verification session." },
      { status: 500 }
    );
  }
}

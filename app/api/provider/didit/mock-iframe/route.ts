import { NextResponse } from "next/server";

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Didit Mock Identity Verification Sandbox</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #0f172a;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
        }
        .card {
          background-color: #1e293b;
          border: 1px solid #334155;
          padding: 30px;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        h2 { margin-top: 0; color: #3b82f6; }
        p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 25px; }
        button {
          width: 100%;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          background-color: #2563eb;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover { background-color: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Didit Identity Sandbox</h2>
        <p>This is a simulated verification window. Click the button below to approve identity verification and return mock document details for <b>Amina Saidi</b>.</p>
        <button onclick="simulateVerification()">Approve Mock Verification</button>
      </div>
      <script>
        function simulateVerification() {
          // Notify the parent window that mock verification is ready
          alert("Verification simulated successfully! You can now close this or click Complete Verification on the page.");
        }
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html"
    }
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getVerificationPrompt } from "@/lib/gemini-prompts";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ message: "File is required." }, { status: 400 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ message: "Gemini API key is not configured." }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const category = (formData.get("category") as string | null) || "auto_entrepreneur";
    const prompt = getVerificationPrompt(category);

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64Image
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text();
      console.error("Gemini API Error:", err);
      return NextResponse.json({ message: "Failed to process the image with Gemini API." }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    let data;
    try {
      const responseText = geminiData.candidates[0].content.parts[0].text;
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", e);
      return NextResponse.json({ message: "Invalid response from AI model." }, { status: 500 });
    }

    // Hash sensitive data if user wants it (e.g., ID extracted from certificate)
    let extractedIdHash = null;
    if (data.extracted_data?.ID) {
      const salt = await bcrypt.genSalt(10);
      extractedIdHash = await bcrypt.hash(data.extracted_data.ID, salt);
    }

    // Update DB
    if (userId) {
      await prisma.provider.update({
        where: { id: userId },
        data: {
          certificateStatus: data.is_valid ? "VALID" : "INVALID",
          certificateMessage: data.message,
          certificateIdHash: extractedIdHash,
          extractedFullName: data.extracted_data?.FULL_NAME || null,
          extractedDate: data.extracted_data?.DATE || null,
        },
      });
    }

    return NextResponse.json({
      is_valid: data.is_valid,
      message: data.message,
      extracted_data: {
        FULL_NAME: data.extracted_data?.FULL_NAME || null,
        DATE: data.extracted_data?.DATE || null,
        ID_FOUND: !!data.extracted_data?.ID,
      }
    });

  } catch (error) {
    console.error("Certificate API Error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: `Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 });
  }
}

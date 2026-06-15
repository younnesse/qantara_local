import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { message, history, locale } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI is not configured" }, { status: 500 })
    }

    // Fetch all active providers for context
    const providers = await prisma.provider.findMany({
      where: { certificateStatus: "VALID", isProfileComplete: true, isBanned: false, deletedAt: null },
      select: {
        id: true,
        name: true,
        title: true,
        bio: true,
        category: true,
        rating: true,
        reviewCount: true,
      },
    })

    const providerContext = providers
      .map(
        (p) =>
          `- ${p.name} (ID: ${p.id}): ${p.title || ""}, Category: ${p.category || ""}, Rating: ${p.rating}/5 (${p.reviewCount} reviews)`
      )
      .join("\n")

    // Build conversation history for Gemini
    const conversationParts = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))

    const languageNames: Record<string, string> = {
      en: "English",
      fr: "French",
      ar: "Arabic"
    }
    const targetLanguage = languageNames[locale] || "the user's language"

    const systemPrompt = `You are Qantara Assistant, a helpful AI for the Qantara service directory platform in Algeria. 
Your job is to help users find the right professional for their needs.

Available providers on the platform:
${providerContext}

Rules:
- Be concise and friendly (2-3 sentences max unless listing providers)
- You MUST write your response ONLY in ${targetLanguage}. Do not write or mix in any other language. All sentences, listings, and text must be entirely in ${targetLanguage}.
- When recommending providers, include their name, specialty, and rating
- Format provider recommendations as a short list
- If asked about something unrelated to finding services, politely redirect
- When suggesting or listing a provider, you MUST append a profile link in the format [Provider Name:id] or [PROVIDER:id] immediately after their name. For example: "Dr. Karim Benali [Dr. Karim Benali:cmoy7mejs0000voel23s88dod]" or "[Dr. Karim Benali:cmoy7mejs0000voel23s88dod]" so the app can create clickable links to their profile.`

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I'm Qantara Assistant, ready to help users find professionals. I'll be concise, friendly, and recommend from the available providers." }],
        },
        ...conversationParts,
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload),
      }
    )

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text()
      console.error("Gemini API Error:", err)
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const geminiData = await geminiResponse.json()
    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

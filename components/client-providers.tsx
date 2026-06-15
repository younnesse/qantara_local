"use client"

import { CommandPalette } from "@/components/marketplace/command-palette"
import { AIChatWidget } from "@/components/marketplace/ai-chat-widget"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
      <AIChatWidget />
    </>
  )
}

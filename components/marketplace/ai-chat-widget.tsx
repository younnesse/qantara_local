"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { trackChatMessage } from "@/lib/analytics"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const quickActions = [
  "Find me a doctor in Algiers",
  "Chercher un développeur web",
  "ابحث عن مترجم",
  "Top rated professionals",
]

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, locale } = useLanguage()

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
      }
      setMessages((prev) => [...prev, userMsg])
      setInput("")
      setLoading(true)
      trackChatMessage(text.trim().length)

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), history: history.slice(-10), locale }),
        })

        const data = await res.json()
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply || data.error || "Something went wrong.",
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: "Connection error. Please try again." },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading, messages]
  )

  // Parse provider links [PROVIDER:id] or [Name:id] from message content
  const renderContent = (content: string) => {
    const parts = content.split(/\[([^\]:]+):([a-zA-Z0-9_-]+)\]/g)
    return parts.map((part, i) => {
      const mode = i % 3
      if (mode === 1) {
        return null
      }
      if (mode === 2) {
        // This is a provider ID
        const label = parts[i - 1]
        const linkText = label === "PROVIDER" ? "View Profile" : label
        return (
          <Link
            key={i}
            href={`/consumer/provider-details/${part}`}
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            {linkText} <ArrowRight className="w-3 h-3 rtl-flip" />
          </Link>
        )
      }
      
      // Deduplicate label if it was already printed in the text before the brackets
      let text = part
      const nextLabel = parts[i + 1]
      if (nextLabel && text.trim().endsWith(nextLabel)) {
        const trimmed = text.trim()
        const index = trimmed.lastIndexOf(nextLabel)
        if (index !== -1) {
          text = text.substring(0, text.indexOf(nextLabel))
        }
      }
      return <span key={i}>{text}</span>
    })
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-20 sm:bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center ${
          open ? "hidden" : ""
        }`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 sm:bottom-6 right-0 sm:right-4 z-50 w-full sm:w-[400px] h-[85vh] sm:h-[560px] bg-card border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Qantara AI</h3>
                  <p className="text-[11px] text-muted-foreground">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {t("app.name")} Assistant
                  </h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    I can help you find the right professional
                  </p>
                  {/* Quick Actions */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => sendMessage(action)}
                        className="px-3 py-2 text-xs bg-muted rounded-xl text-foreground hover:bg-muted/80 transition-colors text-left"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-border px-4 py-3 bg-card">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="flex-1 h-11 px-4 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity hover:opacity-90"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft,
  Search,
  ChevronDown,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  CreditCard,
  Calendar,
  Shield
} from "lucide-react"

const faqCategories = [
  {
    title: "Getting Started",
    icon: FileText,
    questions: [
      { q: "How do I create an account?", a: "You can create an account by clicking the Sign Up button on the home page and choosing whether you're a service provider or consumer." },
      { q: "What's the difference between provider and consumer accounts?", a: "Providers offer services and manage bookings, while consumers browse and book services from providers." },
    ],
  },
  {
    title: "Bookings",
    icon: Calendar,
    questions: [
      { q: "How do I book a service?", a: "Browse providers, select one you like, choose an available time slot, and confirm your booking." },
      { q: "Can I cancel a booking?", a: "Yes, you can cancel bookings from your Bookings page. Cancellation policies vary by provider." },
      { q: "How do I reschedule?", a: "Go to your booking details and select 'Reschedule' to choose a new time slot." },
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    questions: [
      { q: "What payment methods are accepted?", a: "We accept all major credit cards, debit cards, and digital wallets like Apple Pay and Google Pay." },
      { q: "When am I charged for a booking?", a: "You're charged when you confirm your booking. Refunds follow the provider's cancellation policy." },
    ],
  },
  {
    title: "Account & Security",
    icon: Shield,
    questions: [
      { q: "How do I reset my password?", a: "Click 'Forgot Password' on the login page and follow the instructions sent to your email." },
      { q: "How do I delete my account?", a: "Go to Settings > Privacy & Security > Delete Account. Note that this action is permanent." },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openCategory, setOpenCategory] = useState<string | null>("Getting Started")
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 rtl-flip" />
            Back
          </Link>
          <h1 className="text-2xl font-bold mb-2">Help Center</h1>
          <p className="text-primary-foreground/80 mb-6">
            Find answers to your questions
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-background text-foreground border-0"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* FAQ Categories */}
        {faqCategories.map((category) => (
          <div key={category.title} className="bg-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setOpenCategory(openCategory === category.title ? null : category.title)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground">{category.title}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openCategory === category.title ? "rotate-180" : ""}`} />
            </button>

            {openCategory === category.title && (
              <div className="border-t border-border">
                {category.questions.map((item) => (
                  <div key={item.q} className="border-b border-border last:border-b-0">
                    <button
                      onClick={() => setOpenQuestion(openQuestion === item.q ? null : item.q)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-foreground pr-4">{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openQuestion === item.q ? "rotate-180" : ""}`} />
                    </button>
                    {openQuestion === item.q && (
                      <div className="px-4 pb-4 text-muted-foreground">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Contact Support */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Still need help?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <MessageCircle className="w-5 h-5" />
              <span>Live Chat</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Mail className="w-5 h-5" />
              <span>Email Us</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Phone className="w-5 h-5" />
              <span>Call Us</span>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

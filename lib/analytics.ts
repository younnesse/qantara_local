import { track } from "@vercel/analytics"

// Provider profile viewed
export function trackProviderView(providerId: string, providerName: string) {
  track("provider_view", { providerId, providerName })
}

// Search query submitted
export function trackSearch(query: string, resultsCount: number) {
  track("search", { query, resultsCount })
}

// Category filter selected
export function trackCategorySelect(category: string) {
  track("category_select", { category })
}

// Review submitted
export function trackReviewSubmit(providerId: string, rating: number) {
  track("review_submit", { providerId, rating })
}

// AI chat message sent
export function trackChatMessage(messageLength: number) {
  track("chat_message", { messageLength })
}

// Favorite toggled
export function trackFavoriteToggle(providerId: string, isFavorited: boolean) {
  track("favorite_toggle", { providerId, action: isFavorited ? "add" : "remove" })
}

// Signup completed
export function trackSignup(role: string) {
  track("signup", { role })
}

// Login completed
export function trackLogin() {
  track("login")
}

// Command palette opened
export function trackCommandPalette() {
  track("command_palette_open")
}

// Language changed
export function trackLanguageChange(locale: string) {
  track("language_change", { locale })
}

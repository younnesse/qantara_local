# Qantara UI/UX Enhancement — Implementation Prompt

## Context
Qantara (قنطرة) is an Algerian professional services directory built with:
- **Next.js 16.2.0** (App Router)
- **TypeScript 5.7.3**
- **shadcn/ui + Radix UI**
- **Tailwind CSS**
- **Prisma 7.7.0** + PostgreSQL (Neon)
- **Framer Motion** (to be added)
- **Vercel** hosting

The app connects clients with verified providers across three categories: **Doctors**, **Tech & Programming**, and **Translators**. It features AI certificate verification (Gemini 1.5 Flash), JWT auth with 6-digit email codes, trilingual support (FR/EN/AR with RTL), and a public directory with search.

---

## Phase 1: Foundation & Polish (Do This First)

### 1.1 Loading States & Skeletons
- Create `loading.tsx` in **every route segment**: `app/`, `app/consumer/search/`, `app/provider/dashboard/`, `app/provider/profile/`, etc.
- Use the existing `SkeletonCard` component for lists. Create `SkeletonProfile`, `SkeletonService`, `SkeletonReview` for detail pages.
- Add **React Suspense boundaries** around all async data fetches with fallback skeletons.
- Ensure skeletons match the final layout exactly (no layout shift).

### 1.2 Error Handling
- Add `error.tsx` in every route segment with:
  - Friendly illustration (use Lucide icons or simple SVG)
  - "Something went wrong" message in all 3 languages
  - "Retry" button that re-fetches
  - "Go home" link
- Add `not-found.tsx` for 404s with search suggestion.
- Add `global-error.tsx` at app root.

### 1.3 Empty States
For every list view, implement empty states:
- **Search no results**: Illustration + "No providers match your search" + "Try: Généraliste, Alger, Dermatologue" (suggestion chips)
- **No reviews yet**: "Be the first to review" CTA
- **No services**: "This provider hasn't added services yet"
- **No favorites**: "Save providers to find them quickly" + browse CTA
- **No notifications**: "You're all caught up" illustration

---

## Phase 2: Search & Discovery Overhaul

### 2.1 Instant Search
- Replace current search with **300ms debounced input** using `use-debounce` hook.
- Show **loading spinner** inside the search input while fetching.
- Add **search suggestions dropdown**:
  - Recent searches (from localStorage)
  - Popular searches: "Médecin Alger", "Traducteur Oran", "Développeur web"
  - Trending providers (top 3 by views this week)

### 2.2 Advanced Filters
- Add horizontal scrollable **filter chips** below search bar:
  - Categories: "All", "Doctors", "Tech", "Translators"
  - Location: "Alger", "Oran", "Constantine", "Hassi Messaoud" (from provider data)
  - Rating: "4+ stars", "5 stars only"
  - Availability: "Available today"
- Active filters show as removable pills.
- **Sort dropdown**: "Most Relevant", "Highest Rated", "Most Reviewed", "Newest", "Price: Low to High"

### 2.3 Search Results Page
- **Grid/list toggle** (default grid on mobile, list option on desktop)
- **Results count**: "42 providers found"
- **Pagination or infinite scroll** (prefer infinite scroll with "Load more" button)
- **Sticky search bar** on mobile when scrolling

---

## Phase 3: Provider Card Redesign

Redesign `ProviderCard` (`components/marketplace/provider-card.tsx`) to match modern marketplace standards (Airbnb/Uber style):

```tsx
// Structure:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  className="group relative rounded-2xl overflow-hidden bg-card border border-border/50"
>
  {/* Image Section */}
  <div className="relative aspect-[4/3] overflow-hidden">
    <Image 
      src={provider.profileImage || "/placeholder-provider.jpg"} 
      alt={provider.name}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

    {/* Badges */}
    <div className="absolute top-3 left-3 flex gap-2">
      {provider.certificateStatus === "VALID" && (
        <Badge className="bg-emerald-500/90 text-white border-0">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {t("verified")}
        </Badge>
      )}
      {provider.rating >= 4.5 && (
        <Badge className="bg-amber-500/90 text-white border-0">
          <Star className="w-3 h-3 mr-1" />
          {t("topRated")}
        </Badge>
      )}
    </div>

    {/* Favorite Button */}
    <button className="absolute top-3 right-3 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
      <Heart className="w-4 h-4" />
    </button>

    {/* Bottom Info */}
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <h3 className="text-white font-semibold text-lg">{provider.name}</h3>
      <p className="text-white/80 text-sm">{provider.title}</p>
    </div>
  </div>

  {/* Content Section */}
  <div className="p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <StarRating value={provider.rating} size="sm" />
        <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({provider.reviewCount})</span>
      </div>
      <span className="text-sm text-muted-foreground">{provider.city || "Alger"}</span>
    </div>

    {/* Services preview */}
    {provider.services?.[0] && (
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{provider.services[0].name}</span>
        <span className="font-semibold">{provider.services[0].price} DZD</span>
      </div>
    )}

    {/* CTA */}
    <Button className="w-full" variant="default">
      {t("viewProfile")}
    </Button>
  </div>
</motion.div>
```

**Requirements:**
- Install `framer-motion`
- Create placeholder image for providers without photos
- Ensure RTL compatibility (flip layout when `dir="rtl"`)
- Add hover effects only on devices that support hover (`@media (hover: hover)`)

---

## Phase 4: Provider Profile Page Redesign

Redesign `app/consumer/provider-details/[id]/page.tsx` (or equivalent):

### 4.1 Layout Structure
```
[Hero Image - Full width, 300px height]
[Sticky Header - appears on scroll: Name + CTA]
[Main Content - 2 columns on desktop]
  Left (70%):
    - Provider info (name, title, badges, rating)
    - Action buttons (Call, Message, Save)
    - About section with expand/collapse
    - Services tabbed list
    - Portfolio gallery
    - Reviews section with breakdown
  Right (30%):
    - Contact card (sticky)
    - Availability calendar placeholder
    - Similar providers
```

### 4.2 Tab Navigation
Replace long scroll with tabs: **Services** | **About** | **Portfolio** | **Reviews**
- Use shadcn `Tabs` component
- URL hash updates on tab change (`#services`, `#about`, etc.)

### 4.3 Review Breakdown
Instead of just average rating, show:
- **5-bar distribution** (like Amazon):
  - 5 stars: ████████░░ 45%
  - 4 stars: ████░░░░░░ 20%
  - etc.
- **Rating snapshot**: "4.7 out of 5 — based on 128 reviews"
- **Filter reviews**: "Most recent", "Highest rated", "Lowest rated", "With photos"

### 4.4 Portfolio Gallery
- Grid of images (2x2 or 3x3)
- Click opens **lightbox modal** with:
  - Swipe navigation (mobile)
  - Keyboard arrows (desktop)
  - Image counter "3 / 12"
  - Close button

### 4.5 Floating CTA (Mobile Only)
- Bottom-fixed bar on mobile:
  - Primary: "Contacter" / "Prendre RDV"
  - Secondary: "Appeler" (if authenticated)
- Appears only after scrolling past hero

---

## Phase 5: Authentication UX Improvements

### 5.1 Social Login
Add OAuth buttons above email form:
- **Google Sign-In** (most critical for Algeria)
- Optional: **Facebook**, **LinkedIn** (for providers)
- Use `next-auth` or custom OAuth implementation

### 5.2 Improved 6-Digit Flow
- **Auto-focus** next input on key press
- **Auto-submit** when 6th digit entered
- **Resend timer**: "Resend code in 00:45" countdown
- **Error shake animation** on wrong code (Framer Motion)
- **Paste support**: Allow pasting full code from email

### 5.3 Progressive Onboarding
- After signup, show **completion checklist** instead of forcing wizard:
  - "Complete your profile" (progress bar)
  - "Verify your certificate" (for providers)
  - "Add your first service"
  - "Set your availability"
- Gamification: "Your profile is 60% complete"

---

## Phase 6: AI Chat Widget (The "Wow" Feature)

### 6.1 Floating Chat Button
- Bottom-right corner, pulsing animation when first visit
- Opens **slide-over panel** (not full page)

### 6.2 Chat Interface
```
User: "J'ai mal au dos depuis 3 jours"
AI: "Je comprends. Pour un mal de dos persistant, je vous recommande :
      1. Dr. Karim Benali - Généraliste (Alger) - ⭐ 4.8
      2. Dr. Yacine Boumediene - Orthopédiste (Alger) - ⭐ 4.9

      Voulez-vous prendre rendez-vous avec l'un d'eux ?"
```

### 6.3 Implementation
- Use existing **Gemini 1.5 Flash** API
- Create new endpoint: `POST /api/ai/chat`
- System prompt: "You are Qantara assistant. Help users find the right provider. Ask clarifying questions. Suggest 2-3 providers from the database. Be concise. Respond in the user's language."
- Maintain conversation history in localStorage (max 10 turns)
- Show provider cards inline in chat

---

## Phase 7: Command Palette (Cmd+K)

Install `cmdk` (already used by shadcn):
- **Trigger**: `Cmd+K` / `Ctrl+K` / tap search icon
- **Features**:
  - Search providers by name, title, service
  - Navigate pages: "Go to Dashboard", "Go to Settings"
  - Actions: "Toggle theme", "Change language to Arabic"
  - Recent items
- **Design**: Centered modal, blurred backdrop, spotlight-style

---

## Phase 8: RTL & Arabic Polish

### 8.1 True RTL Mirroring
- Install **Cairo** or **Tajawal** font for Arabic
- Flip directional icons: chevrons, arrows, sliders
- Reverse flex directions when `dir="rtl"`
- Adjust padding/margin for Arabic text (often shorter)

### 8.2 Arabic Number Formatting
- Use Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) when locale is AR
- Format: `new Intl.NumberFormat('ar-DZ').format(1234)`

---

## Phase 9: Animations & Micro-interactions

### 9.1 Page Transitions
Wrap app in `AnimatePresence`:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### 9.2 List Stagger
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  }}
>
  {providers.map(p => (
    <motion.div variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}>
      <ProviderCard provider={p} />
    </motion.div>
  ))}
</motion.div>
```

### 9.3 Interactive Elements
- **Buttons**: Scale to 0.97 on press
- **Cards**: Lift + shadow increase on hover
- **Favorites**: Heart fills with spring animation + particle burst
- **Ratings**: Stars fill with staggered delay on load
- **Toasts**: Slide in from right (LTR) or left (RTL)

---

## Phase 10: Analytics & Monitoring

- **Vercel Speed Insights**: Already installed, verify it's working
- **Vercel Analytics**: Verify events are firing
- Add **custom events**:
  - `search_query` (track what users search)
  - `provider_view` (which profiles are viewed)
  - `contact_click` (conversion event)
  - `signup_complete` (funnel tracking)
  - `certificate_upload` (provider onboarding)

---

## Technical Requirements

1. **Install dependencies**:
   ```bash
   npm install framer-motion cmdk use-debounce react-intersection-observer
   npm install -D @types/...
   ```

2. **Create/modify files**:
   - `app/loading.tsx` (root)
   - `app/error.tsx` (root)
   - `app/not-found.tsx`
   - `app/**/loading.tsx` (all routes)
   - `app/**/error.tsx` (all routes)
   - `components/marketplace/provider-card.tsx` (redesign)
   - `components/marketplace/ai-chat-widget.tsx` (new)
   - `components/marketplace/command-palette.tsx` (new)
   - `components/marketplace/review-breakdown.tsx` (new)
   - `components/marketplace/image-lightbox.tsx` (new)
   - `components/marketplace/empty-state.tsx` (new)
   - `hooks/use-debounce.ts` (new)
   - `hooks/use-media-query.ts` (new)

3. **Styling rules**:
   - Use Tailwind only, no inline styles
   - Use CSS variables for theme colors
   - Support dark mode via `dark:` prefix
   - Respect `prefers-reduced-motion`

4. **Accessibility**:
   - All interactive elements keyboard accessible
   - ARIA labels for icon-only buttons
   - Focus visible states
   - Color contrast WCAG AA minimum

5. **Performance**:
   - Lazy load below-fold components
   - Use `next/image` everywhere
   - Optimize animations with `will-change` and `transform`
   - Keep bundle size under control (tree-shake Framer Motion)

---

## Deliverables Checklist

- [ ] All routes have loading.tsx and error.tsx
- [ ] ProviderCard redesigned with Framer Motion
- [ ] Search has debounce + suggestions + filters
- [ ] Profile page has tabs + review breakdown + lightbox
- [ ] Auth has social login + improved code flow
- [ ] AI chat widget functional
- [ ] Command palette (Cmd+K) working
- [ ] RTL fully polished with Arabic font
- [ ] Animations added to lists, cards, page transitions
- [ ] Empty states implemented for all lists
- [ ] Analytics events tracking key actions

---

## Context Files to Reference

- `components/marketplace/*` — existing components to modify
- `app/page.tsx` — homepage with provider list
- `app/consumer/provider-details/[id]/page.tsx` — profile page
- `contexts/language-context.tsx` — i18n system
- `lib/constants.ts` — category definitions
- `prisma/schema.prisma` — data models

---

## Implementation Order

Execute in this exact sequence. Do not skip phases.

| Order | Phase | Why This Order |
|-------|-------|----------------|
| **1** | Phase 1: Skeletons, errors, empty states | Foundation. No dependencies. |
| **2** | Phase 8: RTL & Arabic polish | Do early so later phases are RTL-ready |
| **3** | Phase 2: Search overhaul | Core user flow |
| **4** | Phase 3: Provider card redesign | Depends on search results layout |
| **5** | Phase 4: Profile page redesign | Depends on card design language |
| **6** | Phase 5: Auth improvements | Standalone, high conversion impact |
| **7** | Phase 7: Command palette | Nice-to-have, depends on search logic |
| **8** | Phase 9: Animations | Add after structure is stable |
| **9** | Phase 6: AI chat widget | Most complex, do last |
| **10** | Phase 10: Analytics | Final instrumentation |

---

## Instructions for Agent

**Implement ONE phase at a time.** After each phase:
1. Test it — Click through, check mobile, test RTL
2. Review the code — Make sure it fits existing patterns
3. Commit — `git commit -m "Phase X: description"`
4. Deploy to Vercel — Verify preview deployment
5. Then move to next phase

Use Git branches: `git checkout -b phase/1-loading-states`

**Do not modify anything outside the current phase scope.**

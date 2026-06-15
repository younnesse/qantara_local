"use client"

import { useLanguage } from "@/contexts/language-context"
import { AppLogo } from "@/components/marketplace/app-logo"
import { Facebook, Linkedin, Twitter, Instagram } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const { t } = useLanguage()

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  ]

  return (
    <footer className="w-full bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-8 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Column 1: Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("footer.categories")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/consumer/search?category=regulated_profession" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("regulated_profession")}
                </Link>
              </li>
              <li>
                <Link href="/consumer/search?category=artisan" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("artisan")}
                </Link>
              </li>
              <li>
                <Link href="/consumer/search?category=auto_entrepreneur" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("auto_entrepreneur")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: About */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("footer.about")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Vérification
                </Link>
              </li>

            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("footer.support")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("settings.helpCenter") || "Centre d'aide"}
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Signaler un problème
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("settings.termsOfService") || "Conditions d'utilisation"}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Social / App info */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("footer.social")}
            </h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all duration-200"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" showText={true} />
          </div>
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} {t("app.name")}. {t("footer.rightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  )
}

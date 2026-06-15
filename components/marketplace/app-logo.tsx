"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"

interface AppLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: { icon: "w-8 h-8", text: "text-lg" },
  md: { icon: "w-10 h-10", text: "text-xl" },
  lg: { icon: "w-14 h-14", text: "text-2xl" },
}

export function AppLogo({ size = "md", className, showText = true }: AppLogoProps) {
  const sizes = sizeMap[size]
  const { t } = useLanguage()

  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("flex items-center justify-center shrink-0", sizes.icon)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
          <g transform="translate(100, 95)">
            <rect x="-9" y="50" width="18" height="30" transform="rotate(-45)" fill="#135A8D"/>
            
            <path d="M -65 0 A 65 65 0 0 1 -53.89 -36.34 L -42.28 -28.51 A 51 51 0 0 0 -51 0 Z" fill="#6C94B6" />
            <path d="M -52.26 -38.68 A 65 65 0 0 1 -21.71 -61.30 L -17.03 -48.09 A 51 51 0 0 0 -41.00 -30.35 Z" fill="#A5C3D9" />
            <path d="M -18.98 -62.14 A 65 65 0 0 1 18.98 -62.14 L 14.89 -48.76 A 51 51 0 0 0 -14.89 -48.76 Z" fill="#A5C3D9" />
            <path d="M 21.71 -61.30 A 65 65 0 0 1 52.26 -38.68 L 41.00 -30.35 A 51 51 0 0 0 17.03 -48.09 Z" fill="#326C9A" />
            <path d="M 53.89 -36.34 A 65 65 0 0 1 65 0 L 51 0 A 51 51 0 0 0 42.28 -28.51 Z" fill="#135A8D" />

            <path d="M -48 0 A 48 48 0 0 1 -35.66 -32.11 L -26.01 -23.42 A 35 35 0 0 0 -35 0 Z" fill="#6C94B6" />
            <path d="M -33.36 -34.51 A 48 48 0 0 1 -1.68 -47.95 L -1.23 -34.97 A 35 35 0 0 0 -24.33 -25.17 Z" fill="#A5C3D9" />
            <path d="M 1.68 -47.95 A 48 48 0 0 1 33.36 -34.51 L 24.33 -25.17 A 35 35 0 0 0 1.23 -34.97 Z" fill="#326C9A" />
            <path d="M 35.66 -32.11 A 48 48 0 0 1 48 0 L 35 0 A 35 35 0 0 0 26.01 -23.42 Z" fill="#6C94B6" />
          </g>
          
          <path d="M 35 98 A 65 65 0 0 0 165 98 L 135 98 A 35 35 0 0 1 65 98 Z" fill="#135A8D"/>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", sizes.text)}>
          {t("app.name")}
        </span>
      )}
    </Link>
  )
}


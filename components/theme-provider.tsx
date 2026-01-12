"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// FIX: We removed the broken import from "next-themes/dist/types"
// and used React.ComponentProps<typeof NextThemesProvider> instead.

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
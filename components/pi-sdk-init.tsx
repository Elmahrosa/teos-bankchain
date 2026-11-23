"use client"

import { useEffect } from "react"

export function PiSdkInit() {
  useEffect(() => {
    let attempts = 0
    let handled = false

    const tryInit = () => {
      const pi = (window as any).Pi

      if (pi) {
        handled = true
        const inPiBrowser = /PiBrowser/i.test(navigator.userAgent) || !!pi.environment

        if (inPiBrowser && typeof pi.init === "function" && !pi.initialized) {
          try {
            const result = pi.init({ version: "2.0", sandbox: false })
            if (result && typeof result.catch === "function") {
              result.catch(() => {
                // Ignore init failures outside a valid Pi Browser session.
              })
            }
          } catch {
            // Ignore init failures outside a valid Pi Browser session.
          }
        }
        return
      }

      if (!handled && attempts < 20) {
        attempts++
        setTimeout(tryInit, 250)
      }
    }

    const timer = setTimeout(tryInit, 100)
    return () => clearTimeout(timer)
  }, [])

  return null
}

"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Wallet, AlertCircle, TestTube, Crown } from "lucide-react"
import { isPiBrowser, isPiBrowserEnvironment, piLogin } from "@/src/pi"
import { ContactBadge } from "@/components/contact-badge"
import Link from "next/link"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [piNotice, setPiNotice] = useState("")
  const [piUsername, setPiUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_user")
      if (saved) {
        const user = JSON.parse(saved)
        if (user?.username) setPiUsername(user.username)
      }
    } catch {
      localStorage.removeItem("pi_user")
    }
  }, [])

  const handlePiWalletLogin = async () => {
    setError("")
    setPiNotice("")
    setIsLoading(true)

    try {
      if (!isPiBrowser() || !isPiBrowserEnvironment()) {
        setPiNotice("Pi SDK not ready. افتح من Pi Browser أو Use Demo Mode")
        return
      }

      const auth = await piLogin()
      const piUser = {
        uid: auth.user.uid,
        username: auth.user.username,
        accessToken: auth.accessToken,
        walletAddress: (auth.user as any).walletAddress,
      }

      localStorage.setItem("pi_user", JSON.stringify(piUser))
      setPiUsername(piUser.username)

      const founderWalletAddress = "GDIW2DXDR3DU4CYTRHDS3WYDGHMUQZG7E5FJWWW6XSADOC5VHMYRYD6F"
      const isFounder =
        piUser.username.toLowerCase() === "aasm1969" || piUser.walletAddress === founderWalletAddress

      if (isFounder) {
        localStorage.setItem("teos_founder_token", piUser.accessToken)
        localStorage.setItem(
          "teos_user",
          JSON.stringify({
            id: piUser.uid,
            email: `${piUser.username}@pi.network`,
            name: piUser.username,
            role: "founder",
            permissions: ["*"],
            walletIds: [piUser.uid],
            primaryWalletId: piUser.uid,
          }),
        )
        localStorage.setItem(
          "teos_auth_token",
          JSON.stringify({
            accessToken: piUser.accessToken,
            refreshToken: piUser.accessToken,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          }),
        )
        window.location.href = "/founder-dashboard"
        return
      }

      await login(piUser.username, "", {
        usePiBrowser: true,
        piAccessToken: piUser.accessToken,
        piUid: piUser.uid,
      })

      router.push(isFounder ? "/founder-dashboard" : "/dashboard")
    } catch (err: any) {
      setError(err.message || "Pi Wallet authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoMode = async () => {
    setError("")
    setIsLoading(true)

    try {
      await login("demo_user", "", {
        usePiBrowser: false,
        piAccessToken: "demo_token",
        piUid: "demo_uid",
      })

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Demo login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-4 pb-24 sm:pb-4">
      <div className="w-full max-w-md mb-4">
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertDescription className="text-center text-sm text-amber-900 dark:text-amber-100">
            <strong>Development App</strong> - Pending Pi Core Team Verification
          </AlertDescription>
        </Alert>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">TEOS BankChain</CardTitle>
            <CardDescription className="text-base mt-2">Secure Banking Powered by Pi Network</CardDescription>
            <div className="mt-3">
              <ContactBadge variant="compact" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {piNotice && (
            <p className="text-sm text-center text-amber-700 dark:text-amber-300" role="status">
              {piNotice}
            </p>
          )}

          <Button onClick={handlePiWalletLogin} className="w-full h-12 text-base" disabled={isLoading}>
            <Wallet className="w-5 h-5 mr-2" />
            {isLoading ? "Connecting..." : "Connect Pi Wallet"}
          </Button>

          {piUsername && (
            <p className="text-sm text-center text-muted-foreground" role="status">
              Pi user: <span className="font-semibold text-foreground">@{piUsername}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleDemoMode} variant="outline" className="h-11 w-full bg-transparent" disabled={isLoading}>
              <TestTube className="w-4 h-4 mr-2" />
              Use Demo Mode
            </Button>

            <Button asChild variant="outline" className="h-11 w-full bg-transparent">
              <Link href="/founder-login">
                <Crown className="w-4 h-4 mr-2" />
                Founder Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center space-y-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">By connecting your Pi Wallet, you agree to our</p>
            <div className="flex gap-4 justify-center">
              <Link href="/terms" className="text-sm text-primary hover:underline font-medium">
                Terms of Service
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/privacy" className="text-sm text-primary hover:underline font-medium">
                Privacy Policy
              </Link>
            </div>
            <p className="text-xs text-muted-foreground pt-2">KYC/AML Compliant • ISO-20022 Certified • MENA Region</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Pi Network API Integration
// Complete implementation for Pi Browser and backend API
import { isPiBrowser as isPiBrowserReady, piLogin } from "@/src/pi"

export interface PiUser {
  uid: string
  username: string
  accessToken: string
}

export interface PiPayment {
  identifier: string
  amount: number
  memo: string
  metadata: Record<string, any>
  status: "incomplete" | "pending" | "completed" | "cancelled"
  transaction?: {
    txid: string
    verified: boolean
    _link: string
  }
}

export class PiNetworkService {
  private static apiKey: string = process.env.NEXT_PUBLIC_PI_API_KEY || ""
  private static walletSecret: string = process.env.PI_WALLET_SECRET || ""
  private static apiUrl = "https://api.minepi.com"

  // Check if running in Pi Browser with an initialized SDK
  static isPiBrowser(): boolean {
    return !!isPiBrowserReady()
  }

  // Authenticate with Pi Network
  static async authenticate(): Promise<PiUser> {
    try {
      const authResult = await piLogin()
      return {
        uid: authResult.user.uid,
        username: authResult.user.username,
        accessToken: authResult.accessToken,
      }
    } catch (error) {
      console.error("[v0] Pi authentication failed:", error)
      throw error
    }
  }

  // Create a payment request
  static createPayment(amount: number, memo: string, metadata: Record<string, any>): Promise<{ paymentId: string }> {
    return new Promise((resolve, reject) => {
      if (!isPiBrowserReady()) {
        reject(new Error("Not running in Pi Browser"))
        return
      }

      const callbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log("[v0] Payment ready for approval:", paymentId)
          // Call your backend to approve
          this.approvePayment(paymentId)
            .then(() => console.log("[v0] Payment approved"))
            .catch((err) => console.error("[v0] Approval failed:", err))
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log("[v0] Payment ready for completion:", paymentId, txid)
          // Call your backend to complete
          this.completePayment(paymentId, txid)
            .then(() => {
              console.log("[v0] Payment completed")
              resolve({ paymentId })
            })
            .catch((err) => {
              console.error("[v0] Completion failed:", err)
              reject(err)
            })
        },
        onCancel: (paymentId: string) => {
          console.log("[v0] Payment cancelled:", paymentId)
          reject(new Error("Payment cancelled by user"))
        },
        onError: (error: Error, payment?: any) => {
          console.error("[v0] Payment error:", error, payment)
          reject(error)
        },
      }

      window.Pi!.createPayment(
        {
          amount,
          memo,
          metadata,
        },
        callbacks,
      )
    })
  }

  // Backend: Approve payment
  static async approvePayment(paymentId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to approve payment: ${response.statusText}`)
    }
  }

  // Backend: Complete payment
  static async completePayment(paymentId: string, txid: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid }),
    })

    if (!response.ok) {
      throw new Error(`Failed to complete payment: ${response.statusText}`)
    }
  }

  // Get payment details
  static async getPayment(paymentId: string): Promise<PiPayment> {
    const response = await fetch(`${this.apiUrl}/v2/payments/${paymentId}`, {
      headers: {
        Authorization: `Key ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch payment: ${response.statusText}`)
    }

    return await response.json()
  }

  // Get incomplete payments for a user
  static async getIncompletePayments(uid: string): Promise<PiPayment[]> {
    const response = await fetch(`${this.apiUrl}/v2/payments/incomplete_server_payments`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch incomplete payments: ${response.statusText}`)
    }

    const data = await response.json()
    return data.incomplete_server_payments || []
  }
}

// Extend Window interface
declare global {
  interface Window {
    PI_READY?: boolean
    Pi?: {
      authenticate: (scopes: string[], onIncompletePaymentFound: Function) => Promise<any>
      createPayment: (paymentData: any, callbacks: any) => void
      openShareDialog: (title: string, message: string) => void
    }
  }
}

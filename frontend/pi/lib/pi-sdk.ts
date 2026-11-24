// Pi Browser SDK integration
import { isPiBrowser as isPiBrowserReady, piLogin } from "../../../src/pi"

declare global {
  interface Window {
    Pi?: {
      authenticate: (scopes: string[], onIncompletePaymentFound: Function) => Promise<any>
      createPayment: (paymentData: any, callbacks: any) => void
      openShareDialog: (title: string, message: string) => void
    }
  }
}

export const isPiBrowser = (): boolean => !!isPiBrowserReady()

export const authenticateWithPi = async (): Promise<any> => piLogin()

export const createPiPayment = (
  amount: number,
  memo: string,
  metadata: any,
  callbacks: {
    onReadyForServerApproval?: (paymentId: string) => void
    onReadyForServerCompletion?: (paymentId: string, txid: string) => void
    onCancel?: (paymentId: string) => void
    onError?: (error: Error, payment?: any) => void
  },
) => {
  if (!window.Pi) {
    throw new Error("Pi SDK not available")
  }

  window.Pi.createPayment(
    {
      amount,
      memo,
      metadata,
    },
    callbacks,
  )
}

export function isPiBrowser() {
  return typeof window !== "undefined" && !!window.Pi && window.PI_READY;
}

// The Pi CDN script also loads in normal desktop browsers, so require a real
// Pi Browser signal before calling any SDK method that opens a wallet UI.
export function isPiBrowserEnvironment() {
  if (!isPiBrowser()) return false;
  if (typeof navigator === "undefined") return false;
  return /PiBrowser|Pi Network/i.test(navigator.userAgent) || !!window.Pi.environment;
}
export async function piLogin() {
  if (!isPiBrowser()) throw new Error("Not in Pi Browser");
  const auth = await window.Pi.authenticate(['username','payments'], (p)=>console.log(p));
  return auth;
}
export async function piPay(amount, memo) {
  if (!isPiBrowser()) throw new Error("Not in Pi Browser");
  return window.Pi.createPayment(
    { amount, memo, metadata: { app: "teos-bankchain" } },
    {
      onReadyForServerApproval: (id)=>console.log("approve", id),
      onReadyForServerCompletion: (id,tx)=>console.log("complete", id, tx),
      onCancel: (id)=>console.log("cancel", id),
      onError: (e)=>console.log("error", e)
    }
  );
}

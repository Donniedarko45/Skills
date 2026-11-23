// Client-side cart stored in localStorage.
export type CartLine = { productId: string; quantity: number }

export function addToCart(productId: string, quantity: number) {
  const raw = window.localStorage.getItem('cart')
  const lines: CartLine[] = raw ? JSON.parse(raw) : []
  const existing = lines.find((line) => line.productId === productId)
  if (existing) existing.quantity += quantity
  else lines.push({ productId, quantity })
  window.localStorage.setItem('cart', JSON.stringify(lines))
  window.dispatchEvent(new Event('cart-updated'))
}

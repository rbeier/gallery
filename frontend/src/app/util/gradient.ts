/**
 * Decorative gradient placeholder shown behind a photo while its image loads
 * (and as the album-cover fallback). Derived from the photo id so it is stable
 * per photo — it is not editorial data, so it lives here rather than in the CMS.
 */
const GRADIENTS = [
  'linear-gradient(155deg,#c9bda6,#a89574)',
  'linear-gradient(155deg,#bcc0bd,#969e98)',
  'linear-gradient(155deg,#d3caba,#b3a68f)',
  'linear-gradient(155deg,#c1b9a9,#9c8f78)',
  'linear-gradient(155deg,#c7cac6,#9ba49d)',
  'linear-gradient(155deg,#cbc3b4,#a99d88)',
  'linear-gradient(155deg,#b7bcc0,#8f9498)',
  'linear-gradient(155deg,#d6ccbb,#b8ab92)',
  'linear-gradient(155deg,#a9b0ac,#7e8681)',
  'linear-gradient(155deg,#ccc0ad,#a8987d)',
  'linear-gradient(155deg,#c2c6c9,#989ea1)',
  'linear-gradient(155deg,#d0c7b6,#aea083)',
  'linear-gradient(155deg,#b5b0a4,#8a8478)',
  'linear-gradient(155deg,#c8ccc9,#9ca4a0)',
  'linear-gradient(155deg,#cebfa6,#a89170)',
  'linear-gradient(155deg,#bfb8ab,#948b7b)',
]

export function gradientFor(id: number): string {
  return GRADIENTS[id % GRADIENTS.length]
}

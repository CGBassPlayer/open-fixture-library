/**
 * Convert a 8 bit hex value (0-255) into a natural value (0-100)
 * @param {number} hex dmx hex value
 * @returns Natural Value
 */
export function toNatural(hex) {
  if (0 <= hex <= 255) {
    return Math.floor((hex / 255) * 100)
  }
  throw new Error(`${hex} is not between 0 and 255`)
}

/**
 * Convert a natrual value (0-100) into a hex value based on resolution
 * @param {number} natural dmx natural value
 * @param {number} bits dmx channel resolution (8, 16, 24, etc)
 * @returns Natural Value
 */
export function toHex(natural, bits) {
  const factor = (bits/8) - 1;
  if (0 <= natural <= 100) {
    // TODO Update this to the correct calculation
    return Math.floor(natural/100)*255+255^factor
  }
  throw new Error(`${natural} is not between 0 and 100`)
}

/**
 * Convert a 8 bit hex value (0-255) into a natural value (0-100)
 * @param {number} hex dmx hex value
 * @param {number} bits dmx channel resolution (8, 16, 24, etc)
 * @returns Natural Value
 */
export function toNatural(hex, bits = 0) {
  if (bits % 8 !== 0) {
    throw new Error("bits must be divible by 8")
  }
  if (bits == 0) {
    if (hex < 256) {
      bits = 8;
    } else if (hex < 65536) {
      bits = 16;
    } else if (hex < 16777216) {
      bits = 24;
    }
  }
  const factor = bits / 8;
  return Math.ceil((hex / Math.pow(256, factor)) * 100);
}

/**
 * Convert a natrual value (0-100) into a hex value based on resolution
 * @param {number} natural dmx natural value
 * @param {number} bits dmx channel resolution (8, 16, 24, etc)
 * @returns Natural Value
 */
export function toHex(natural, bits = 8) {
  if (bits % 8 !== 0) {
    ;
    throw new Error("bits must be divible by 8")
  }
  const factor = (bits / 8);
  if (0 <= natural <= 100) {
    const res = Math.ceil(natural / 100 * Math.pow(256, factor));
    if (res >= Math.pow(256, factor)) {
      return res - 1;
    }
    return res;
  }
  throw new Error(`${natural} is not between 0 and 100`);
}

/**
 * @param {Entity[] | null} angle
 * @returns {object} angles with 0 being in the middle if possible
 */
export function getAngle(angle) {
  if (angle === null) { // Angles do not exist so they are not applied
    return {
      start: null,
      end: null
    };
  }
  else if (angle[0].number === 0) { // Update it so 0 is in center in the fixtures rangle
    return {
      start: Math.floor(angle[1].number / 2) * -1,
      end: Math.floor(angle[1].number / 2)
    }
  }
  return {
    start: angle[0].number,
    end: angle[1].number
  }
}

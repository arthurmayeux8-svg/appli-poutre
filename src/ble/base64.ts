// Petit encodeur/décodeur base64 (le Bluetooth transmet les données en base64).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64VersTexte(b64: string): string {
  let bits = 0;
  let valeur = 0;
  let texte = '';
  for (const c of b64) {
    if (c === '=') break;
    const i = ALPHABET.indexOf(c);
    if (i < 0) continue;
    valeur = (valeur << 6) | i;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      texte += String.fromCharCode((valeur >> bits) & 0xff);
    }
  }
  return texte;
}

export function texteVersBase64(texte: string): string {
  let sortie = '';
  for (let i = 0; i < texte.length; i += 3) {
    const a = texte.charCodeAt(i) & 0xff;
    const b = i + 1 < texte.length ? texte.charCodeAt(i + 1) & 0xff : NaN;
    const c = i + 2 < texte.length ? texte.charCodeAt(i + 2) & 0xff : NaN;
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    sortie += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    sortie += Number.isNaN(b) ? '=' : ALPHABET[(n >> 6) & 63];
    sortie += Number.isNaN(c) ? '=' : ALPHABET[n & 63];
  }
  return sortie;
}

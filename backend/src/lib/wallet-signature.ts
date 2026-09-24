import { ed25519 } from "@noble/curves/ed25519.js";
import bs58 from "bs58";

/**
 * Did `address` sign `message`?
 *
 * Shared by wallet linking and wallet sign-in, which must agree exactly — a
 * signature one of them accepts and the other refuses would let someone link a
 * wallet they then cannot use to get back in.
 *
 * Mobile Wallet Adapter returns base64; other wallets return base58. Some return
 * the signed payload (signature + message) rather than the bare 64-byte
 * signature, in which case the signature is at one end or the other.
 */
export function walletSigned(
  address: string,
  message: string,
  signature: string,
): boolean {
  let bytes: Uint8Array;
  let publicKey: Uint8Array;
  try {
    bytes = new TextEncoder().encode(message);
    publicKey = bs58.decode(address);
  } catch {
    return false;
  }
  // Base64 only carries "=" when the byte length is not a multiple of three, so
  // choosing the encoding by looking for padding sent unpadded base64 down the
  // base58 path. Decode both ways and let the signature check decide.
  const decoded = [
    () =>
      Uint8Array.from(atob(signature), (character) => character.charCodeAt(0)),
    () => bs58.decode(signature),
  ].flatMap((decode) => {
    try {
      return [decode()];
    } catch {
      return [];
    }
  });
  return decoded
    .flatMap((payload) =>
      payload.length === 64
        ? [payload]
        : [payload.slice(0, 64), payload.slice(-64)],
    )
    .some((candidate) => {
      try {
        return ed25519.verify(candidate, bytes, publicKey);
      } catch {
        return false;
      }
    });
}

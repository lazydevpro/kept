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
  try {
    const signedPayload = signature.includes("=")
      ? Uint8Array.from(atob(signature), (character) => character.charCodeAt(0))
      : bs58.decode(signature);
    const bytes = new TextEncoder().encode(message);
    const publicKey = bs58.decode(address);
    const candidates =
      signedPayload.length === 64
        ? [signedPayload]
        : [signedPayload.slice(0, 64), signedPayload.slice(-64)];
    return candidates.some((candidate) =>
      ed25519.verify(candidate, bytes, publicKey),
    );
  } catch {
    return false;
  }
}

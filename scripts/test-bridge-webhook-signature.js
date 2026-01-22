#!/usr/bin/env node
/**
 * Test Bridge webhook signature verification in Node.js.
 * Usage: `node scripts/test-bridge-webhook-signature.js`
 */
import crypto from 'crypto';

// --- Sample inputs (from Bridge docs) -------------------------------------------------
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtqsEE4eI7EmzhcquGJXt\nLX9PMK0UH6Kl1WIR21sv8HtueG8BuvvpP3MiN7ltzmIhS8KaynCjN4l+620PnXeu\nxWG+CSnEdkinL9hCqbEid5vv9zl0j9LWiJx3FkKHqADU7cgm46aa8dKUdIQYF2X+\nO7WmyLkC4wUM/mWhBPMsIQBznashRMZxx7XJjsVp27ACUE4eNIjEXbVYN6U8jSbU\nhG++CfL8xXu+GHDqKmFE6Po6HnuURvLFVnCtE3mXXBcVFlPy+octfx8nOMLT3X8O\n9UehIigJ34o2yMm/Fq3HUJzg2BsiAiGgtr0vmeoV9Q7upSNj9TuOumAzZFi4pYA+\nqwIDAQAB\n-----END PUBLIC KEY-----`;

const SIGNATURE_HEADER =
  't=1705854411204,v0=jz/0dmHJ63FAzacGutrDTEoq+iSz/PHm/ugdooXDQu5NwuVIT2LmZGjsnCsBHgR9Py6OBP9zurzW4dHgygU4EDqmMPTUOvhvndYb4lWt+TY66LihaFI2whL6DAf/jb1QjYjNU0A6x9SLzC45dgE6X7zTDUM+2Z+scG/WEQf6SxQMt4E2sEipl5PqMK5lYUe3otdJV+X2c9D64bGwCEE7QSia+Vhozg8QNOQEk/rdz2IEONIg6oC43CeiN4E2kF9XLAGuy9uAHx9O9OJH5ZPLJZjyo4VcXYeWQgxaQ1gZ1Qu6hEEzgiPSff/1nou58dm4bIIazgCWli/mO0NyGcpfFw==';

const RAW_BODY = '{"message":"Hello World!"}';

// --------------------------------------------------------------------------------------

function parseSignatureHeader(header) {
  const m = header.match(/^t=(\d+),v0=(.+)$/);
  if (!m) throw new Error('Invalid signature header');
  return { timestamp: m[1], signature: m[2] };
}

function verifyBridgeSignature(body, header, publicKey) {
  const { timestamp, signature } = parseSignatureHeader(header);

  // Prevent replay >10 min unless SAMPLE_REPLAY_OK env set
  const MAX_AGE_MS = 10 * 60 * 1000;
  if (!process.env.SAMPLE_REPLAY_OK && Date.now() - Number(timestamp) > MAX_AGE_MS) {
    console.warn('⚠️  Event too old – possible replay');
    return false;
  }

  // First pass hash
  const payload = `${timestamp}.${body}`;
  const firstHash = crypto.createHash('sha256').update(payload).digest();

  // Second pass hash happens internally in verify()
  const verifier = crypto.createVerify('sha256');
  verifier.update(firstHash);
  verifier.end();
  const isValid = verifier.verify(publicKey, signature, 'base64');
  return isValid;
}

const ok = verifyBridgeSignature(RAW_BODY, SIGNATURE_HEADER, PUBLIC_KEY);
console.log(ok ? '✅  signature valid' : '❌  invalid signature');

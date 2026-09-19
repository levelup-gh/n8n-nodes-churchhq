import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies a Church HQ webhook signature. Church HQ sends
 *   ChurchHQ-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>" keyed by the secret>
 * The timestamp is inside the signature, so a captured request cannot be replayed later: requests
 * older (or newer) than the tolerance are rejected. Comparison is constant-time.
 *
 * A copy of Church HQ's own verifier (verified community nodes may not have runtime
 * dependencies), tested against the same vectors.
 */
export const SIGNATURE_HEADER = 'churchhq-signature';
export const DEFAULT_TOLERANCE_SECONDS = 300;

export type SignatureCheck =
	| { valid: true }
	| { valid: false; reason: 'missing' | 'malformed' | 'timestamp_out_of_range' | 'mismatch' };

export function parseSignatureHeader(header: string): { timestamp: number; signatures: string[] } | null {
	let timestamp: number | null = null;
	const signatures: string[] = [];
	for (const part of header.split(',')) {
		const separatorIndex = part.indexOf('=');
		if (separatorIndex <= 0) continue;
		const name = part.slice(0, separatorIndex).trim();
		const value = part.slice(separatorIndex + 1).trim();
		if (name === 't') timestamp = /^\d+$/.test(value) ? Number(value) : null;
		else if (name === 'v1' && value) signatures.push(value);
	}
	if (timestamp === null || signatures.length === 0) return null;
	return { timestamp, signatures };
}

export function computeSignature(secret: string, timestampSeconds: number, body: string): string {
	return createHmac('sha256', secret).update(`${timestampSeconds}.${body}`).digest('hex');
}

export function verifyChurchHqSignature(
	secret: string,
	header: string | undefined,
	rawBody: string,
	nowSeconds: number,
	toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
): SignatureCheck {
	if (!header) return { valid: false, reason: 'missing' };
	const parsed = parseSignatureHeader(header);
	if (!parsed) return { valid: false, reason: 'malformed' };
	if (Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
		return { valid: false, reason: 'timestamp_out_of_range' };
	}
	const expected = Buffer.from(computeSignature(secret, parsed.timestamp, rawBody), 'utf8');
	let matched = false;
	for (const candidate of parsed.signatures) {
		const candidateBuffer = Buffer.from(candidate, 'utf8');
		// timingSafeEqual needs equal lengths; a different length can never match.
		const equal = candidateBuffer.length === expected.length && timingSafeEqual(candidateBuffer, expected);
		matched = equal || matched;
	}
	return matched ? { valid: true } : { valid: false, reason: 'mismatch' };
}

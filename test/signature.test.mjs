import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { computeSignature, parseSignatureHeader, verifyChurchHqSignature } from '../nodes/ChurchHqTrigger/signature.ts';

// The same vectors Church HQ's own verifier is tested with (supabase/functions/_shared/webhook-signing.ts).
const SECRET = 'whsec_test_secret_value';
const BODY = '{"id":"d1","type":"person_created","data":{"person_id":"p1"}}';
const TIMESTAMP = 1790000000;
const header = (secret = SECRET, timestamp = TIMESTAMP, body = BODY) => `t=${timestamp},v1=${computeSignature(secret, timestamp, body)}`;

test('signature is HMAC-SHA256 of "<t>.<body>" in hex', () => {
	const expected = createHmac('sha256', SECRET).update(`${TIMESTAMP}.${BODY}`).digest('hex');
	assert.equal(computeSignature(SECRET, TIMESTAMP, BODY), expected);
});

test('a correctly signed, fresh request verifies', () => {
	assert.deepEqual(verifyChurchHqSignature(SECRET, header(), BODY, TIMESTAMP + 10), { valid: true });
});

test('a tampered body, a wrong secret, or a rotated-away secret is refused', () => {
	assert.deepEqual(verifyChurchHqSignature(SECRET, header(), BODY.replace('p1', 'p2'), TIMESTAMP), { valid: false, reason: 'mismatch' });
	assert.deepEqual(verifyChurchHqSignature('whsec_other', header(), BODY, TIMESTAMP), { valid: false, reason: 'mismatch' });
});

test('a replayed request outside five minutes is refused, in either direction', () => {
	assert.deepEqual(verifyChurchHqSignature(SECRET, header(), BODY, TIMESTAMP + 301), { valid: false, reason: 'timestamp_out_of_range' });
	assert.deepEqual(verifyChurchHqSignature(SECRET, header(), BODY, TIMESTAMP - 301), { valid: false, reason: 'timestamp_out_of_range' });
	assert.deepEqual(verifyChurchHqSignature(SECRET, header(), BODY, TIMESTAMP + 300), { valid: true });
});

test('a missing or malformed header is refused', () => {
	assert.deepEqual(verifyChurchHqSignature(SECRET, undefined, BODY, TIMESTAMP), { valid: false, reason: 'missing' });
	assert.deepEqual(verifyChurchHqSignature(SECRET, 'v1=abc', BODY, TIMESTAMP), { valid: false, reason: 'malformed' });
	assert.equal(parseSignatureHeader('t=5'), null);
});

test('a short or long candidate signature never throws', () => {
	assert.deepEqual(verifyChurchHqSignature(SECRET, `t=${TIMESTAMP},v1=abc`, BODY, TIMESTAMP), { valid: false, reason: 'mismatch' });
});

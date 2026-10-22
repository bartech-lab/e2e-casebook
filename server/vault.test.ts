import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base32Decode, totp } from './vault.ts';

test('totp matches the RFC 6238 SHA-1 test vectors (last 6 digits)', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(base32Decode(secret).toString(), '12345678901234567890');
  for (const [seconds, eight] of [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037']] as const) {
    assert.equal(totp(secret, Math.floor(seconds / 30)), eight.slice(2));
  }
});

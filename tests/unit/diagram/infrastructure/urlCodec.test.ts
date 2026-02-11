import { describe, it, expect } from 'vitest';
import { encodeForUrl, decodeFromUrl } from '../../../../src/diagram/infrastructure/urlCodec';

describe('urlCodec', () => {
  it('encode then decode a simple JSON string → identical output', async () => {
    const input = '{"title":"test"}';
    const encoded = await encodeForUrl(input);
    const decoded = await decodeFromUrl(encoded);
    expect(decoded).toBe(input);
  });

  it('encode then decode a complex JSON with special characters → identical output', async () => {
    const input = JSON.stringify({
      title: 'Test "System"',
      entities: [{ id: 'user', name: 'User <T>', type: 'class' }],
      special: 'line1\nline2\ttab',
    });
    const encoded = await encodeForUrl(input);
    const decoded = await decodeFromUrl(encoded);
    expect(decoded).toBe(input);
  });

  it('encoded output contains only URL-safe characters', async () => {
    const input = '{"test":"hello world with spaces and special chars: /+=?"}';
    const encoded = await encodeForUrl(input);

    // Base64url should not contain +, /, or =
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('decoding invalid base64 → throws', async () => {
    await expect(decodeFromUrl('!!!invalid!!!')).rejects.toThrow();
  });

  it('encode empty string → decodable back to empty string', async () => {
    const encoded = await encodeForUrl('');
    const decoded = await decodeFromUrl(encoded);
    expect(decoded).toBe('');
  });
});

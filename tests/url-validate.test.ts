import { describe, expect, test } from 'vitest'
import { normalizeAndValidateHttpUrl } from '@/lib/url-validate'

describe('external URL validation', () => {
  test('accepts public HTTP URLs and normalizes them', () => {
    expect(normalizeAndValidateHttpUrl(' https://example.com/path ')).toBe('https://example.com/path')
  })

  test.each([
    'http://localhost/admin',
    'http://127.0.0.1/admin',
    'http://192.168.1.1/admin',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]/admin',
    'http://[fc00::1]/admin',
  ])('blocks local or literal private targets: %s', (url) => {
    expect(() => normalizeAndValidateHttpUrl(url)).toThrow()
  })

  test('blocks embedded credentials and non-HTTP protocols', () => {
    expect(() => normalizeAndValidateHttpUrl('https://user:pass@example.com')).toThrow('Credentials')
    expect(() => normalizeAndValidateHttpUrl('file:///etc/passwd')).toThrow('Only http/https')
  })
})

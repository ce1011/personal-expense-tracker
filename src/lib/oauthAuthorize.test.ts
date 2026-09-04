import { describe, expect, test } from 'vitest'

import {
  oauthAuthorizeRequestIsComplete,
  parseOauthAuthorizeQuery,
} from './oauthAuthorize'

describe('parseOauthAuthorizeQuery', () => {
  test('reads oauth fields and ignores non-strings', () => {
    const parsed = parseOauthAuthorizeQuery({
      response_type: 'code',
      client_id: 'grok',
      redirect_uri: 'https://grok.com/callback',
      code_challenge: 'abc',
      code_challenge_method: 'S256',
      state: ['first', 'second'],
      extra: 1,
    })

    expect(parsed.client_id).toBe('grok')
    expect(parsed.state).toBe('first')
    expect(parsed.scope).toBe('')
    expect(oauthAuthorizeRequestIsComplete(parsed)).toBe(true)
  })

  test('rejects incomplete authorize requests', () => {
    expect(oauthAuthorizeRequestIsComplete(parseOauthAuthorizeQuery({ client_id: 'grok' }))).toBe(
      false,
    )
  })
})

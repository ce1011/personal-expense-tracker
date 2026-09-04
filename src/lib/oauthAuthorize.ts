export type OauthAuthorizeQuery = {
  response_type: string
  client_id: string
  redirect_uri: string
  state: string
  code_challenge: string
  code_challenge_method: string
  scope: string
  resource: string
  client_name: string
  error: string
  error_description: string
}

function queryString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }
  return ''
}

export function parseOauthAuthorizeQuery(query: Record<string, unknown>): OauthAuthorizeQuery {
  return {
    response_type: queryString(query.response_type),
    client_id: queryString(query.client_id),
    redirect_uri: queryString(query.redirect_uri),
    state: queryString(query.state),
    code_challenge: queryString(query.code_challenge),
    code_challenge_method: queryString(query.code_challenge_method),
    scope: queryString(query.scope),
    resource: queryString(query.resource),
    client_name: queryString(query.client_name),
    error: queryString(query.error),
    error_description: queryString(query.error_description),
  }
}

export function oauthAuthorizeRequestIsComplete(params: OauthAuthorizeQuery): boolean {
  return (
    params.response_type === 'code' &&
    params.client_id !== '' &&
    params.redirect_uri !== '' &&
    params.code_challenge !== '' &&
    params.code_challenge_method.toUpperCase() === 'S256'
  )
}

export function navigateToOauthRedirect(url: string): void {
  window.location.assign(url)
}

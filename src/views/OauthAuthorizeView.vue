<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute } from 'vue-router'

import { ApiError, api } from '@/api/client'
import BaseCard from '@/components/base/BaseCard.vue'
import OauthConsentCard from '@/components/oauth/OauthConsentCard.vue'
import {
  navigateToOauthRedirect,
  oauthAuthorizeRequestIsComplete,
  parseOauthAuthorizeQuery,
} from '@/lib/oauthAuthorize'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const params = computed(() => parseOauthAuthorizeQuery(route.query))
const submitting = shallowRef(false)
const actionError = shallowRef('')

const requestError = computed(() => {
  if (params.value.error) {
    return params.value.error_description || '這次授權請求無效。'
  }
  if (!oauthAuthorizeRequestIsComplete(params.value)) {
    return '授權參數不完整。請從 Grok 重新連接。'
  }
  return ''
})

const clientName = computed(() => params.value.client_name || 'Grok')
const accountEmail = computed(() => auth.user?.email ?? '')

async function decide(decision: 'allow' | 'deny'): Promise<void> {
  actionError.value = ''
  submitting.value = true

  try {
    const result = await api.oauth.authorize({
      decision,
      response_type: params.value.response_type,
      client_id: params.value.client_id,
      redirect_uri: params.value.redirect_uri,
      state: params.value.state || undefined,
      code_challenge: params.value.code_challenge,
      code_challenge_method: params.value.code_challenge_method,
      scope: params.value.scope || undefined,
      resource: params.value.resource || undefined,
    })
    navigateToOauthRedirect(result.redirect_to)
  } catch (caught) {
    if (caught instanceof ApiError) {
      actionError.value = caught.message || '授權失敗，請稍後再試。'
    } else {
      actionError.value = '授權失敗，請稍後再試。'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="mx-auto grid min-h-svh w-full max-w-md content-center px-4 py-10">
    <template v-if="requestError">
      <p class="rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger" role="alert">
        {{ requestError }}
      </p>
      <BaseCard class="mt-4 p-5">
        <p class="text-body-sm text-text-2">
          請回到 Grok 重新連接，或確認後端
          <code class="font-mono text-xs">PUBLIC_FRONTEND_URL</code>
          指向這個網站。
        </p>
      </BaseCard>
    </template>

    <template v-else>
      <p
        v-if="actionError"
        class="mb-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger"
        role="alert"
      >
        {{ actionError }}
      </p>
      <OauthConsentCard
        :client-name="clientName"
        :account-email="accountEmail"
        :submitting="submitting"
        @allow="decide('allow')"
        @deny="decide('deny')"
      />
    </template>
  </main>
</template>

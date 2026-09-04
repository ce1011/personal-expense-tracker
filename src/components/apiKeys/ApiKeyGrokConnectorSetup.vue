<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

const fields = [
  { label: '伺服器 URL', value: 'https://你的公開網域/sse' },
  { label: 'Client ID', value: 'grok' },
  { label: 'Client Secret', value: '留空' },
  { label: 'Authorization Endpoint', value: 'https://你的公開網域/oauth/authorize' },
  { label: 'Token Endpoint', value: 'https://你的公開網域/oauth/token' },
  { label: 'Scope', value: 'mcp' },
  { label: '權杖驗證方法', value: 'none（僅 PKCE）' },
] as const
</script>

<template>
  <BaseCard>
    <h2 class="text-h3 font-semibold text-text">grok.com / 手機 Grok</h2>
    <p class="mt-1 text-body-sm text-text-2">
      Custom Connector 走 OAuth，不需要 API 金鑰。後端必須用
      <code class="font-mono text-xs">bun run dev</code>
      長駐（Vercel Functions 不支援這條 SSE），並透過 HTTPS tunnel 公開。在後端
      <code class="font-mono text-xs">.env</code>
      設定
      <code class="font-mono text-xs">PUBLIC_BASE_URL</code>
      （API 公開網址）與
      <code class="font-mono text-xs">PUBLIC_FRONTEND_URL</code>
      （本站，例如
      <code class="font-mono text-xs">http://localhost:5173/personal-expense-tracker</code>
      ）。Grok 會先打後端
      <code class="font-mono text-xs">/oauth/authorize</code>
      ，再被導到這個網站登入並授權。
    </p>
    <dl class="mt-3 grid gap-2">
      <div v-for="field in fields" :key="field.label" class="rounded-xl border border-border bg-accent px-3 py-2">
        <dt class="text-xs text-text-2">{{ field.label }}</dt>
        <dd class="mt-0.5 break-all font-mono text-xs text-text">{{ field.value }}</dd>
      </div>
    </dl>
  </BaseCard>
</template>

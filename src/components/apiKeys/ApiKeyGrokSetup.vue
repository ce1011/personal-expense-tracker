<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

const grokCommand = `grok mcp add --transport sse expense-tracker http://localhost:3000/sse \\
  --header "Authorization: Bearer \${PET_API_KEY}"`
</script>

<template>
  <BaseCard>
    <h2 class="text-h3 font-semibold text-text">Grok MCP</h2>
    <p class="mt-1 text-body-sm text-text-2">
      金鑰只會顯示一次。Grok 透過本機後端的
      <code class="font-mono text-xs">/sse</code>
      連線；請先以
      <code class="font-mono text-xs">bun run dev</code>
      長駐執行後端（Vercel 不支援這條 SSE）。
    </p>
    <pre
      class="mt-3 overflow-x-auto rounded-xl border border-border bg-accent px-3 py-2 font-mono text-xs text-text"
      >{{ grokCommand }}</pre>
  </BaseCard>
</template>

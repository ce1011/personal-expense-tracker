<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

const grokCommand = `grok mcp add --transport sse expense-tracker http://localhost:3000/sse \\
  --header "Authorization: Bearer \${PET_API_KEY}"`
</script>

<template>
  <BaseCard>
    <h2 class="text-h3 font-semibold text-text">Grok CLI</h2>
    <p class="mt-1 text-body-sm text-text-2">
      僅給本機
      <code class="font-mono text-xs">grok mcp add</code>
      使用。先建立金鑰，再把
      <code class="font-mono text-xs">PET_API_KEY</code>
      設成金鑰內容。grok.com 與手機 Grok 請用上方 OAuth，不要貼金鑰。
    </p>
    <pre
      class="mt-3 overflow-x-auto rounded-xl border border-border bg-accent px-3 py-2 font-mono text-xs text-text"
      >{{ grokCommand }}</pre>
  </BaseCard>
</template>

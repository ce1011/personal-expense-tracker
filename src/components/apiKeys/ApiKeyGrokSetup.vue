<script setup lang="ts">
import ApiKeyGrokCliSetup from '@/components/apiKeys/ApiKeyGrokCliSetup.vue'
import ApiKeyGrokConnectorSetup from '@/components/apiKeys/ApiKeyGrokConnectorSetup.vue'
</script>

<template>
  <div class="grid gap-4">
    <ApiKeyGrokConnectorSetup />
    <ApiKeyGrokCliSetup />
  </div>
</template>

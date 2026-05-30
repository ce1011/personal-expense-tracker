<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

import AppShell from '@/components/AppShell.vue'
import { useAppData } from '@/composables/useAppData'

const appData = useAppData()

onMounted(() => {
  void appData.refresh()
})
</script>

<template>
  <AppShell
    :cycles="appData.data.value.cycles"
    :current-cycle="appData.currentCycle.value"
    :loading="appData.loading.value"
  >
    <RouterView />
  </AppShell>
</template>

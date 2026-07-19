<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/client'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const errorMessage = ref('')

function toggleMode(): void {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  errorMessage.value = ''
}

async function submit(): Promise<void> {
  errorMessage.value = ''

  if (mode.value === 'register') {
    if (password.value.length < 8) {
      errorMessage.value = '密碼至少需要 8 個字元。'
      return
    }

    if (password.value !== confirmPassword.value) {
      errorMessage.value = '兩次輸入的密碼不一致。'
      return
    }
  }

  submitting.value = true

  try {
    if (mode.value === 'register') {
      await auth.register(email.value, password.value, name.value || undefined)
    } else {
      await auth.login(email.value, password.value)
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (caught) {
    if (caught instanceof ApiError) {
      if (caught.status === 401) {
        errorMessage.value = '電郵或密碼不正確。'
      } else if (caught.status === 409) {
        errorMessage.value = '此電郵已被註冊，請直接登入。'
      } else if (caught.status === 422) {
        errorMessage.value = '請檢查輸入格式（電郵格式、密碼至少 8 個字元）。'
      } else {
        errorMessage.value = caught.message || '連線失敗，請稍後再試。'
      }
    } else {
      errorMessage.value = '連線失敗，請稍後再試。'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-4 py-10">
    <header class="mb-6 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Personal Expense Tracker
      </p>
      <h1 class="mt-2 text-h1 font-bold text-text">
        {{ mode === 'login' ? '登入' : '建立帳戶' }}
      </h1>
      <p class="mt-1 text-body-sm text-text-2">
        {{
          mode === 'login'
            ? '登入以同步你的預算、交易與旅程資料。'
            : '註冊後即可在多裝置間同步資料。'
        }}
      </p>
    </header>

    <BaseCard>
      <form class="grid gap-4" @submit.prevent="submit">
        <BaseInput
          v-if="mode === 'register'"
          v-model="name"
          label="名稱（選填）"
          name="name"
          autocomplete="name"
          placeholder="你的名稱"
        />

        <BaseInput
          v-model="email"
          label="電郵"
          name="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        />

        <BaseInput
          v-model="password"
          label="密碼"
          name="password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          placeholder="••••••••"
          required
        />

        <BaseInput
          v-if="mode === 'register'"
          v-model="confirmPassword"
          label="確認密碼"
          name="confirm-password"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••"
          required
        />

        <p
          v-if="errorMessage"
          class="rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger"
        >
          {{ errorMessage }}
        </p>

        <BaseButton type="submit" :disabled="submitting">
          {{ submitting ? '處理中...' : mode === 'login' ? '登入' : '註冊並登入' }}
        </BaseButton>
      </form>

      <div class="mt-4 text-center">
        <button
          type="button"
          class="text-body-sm font-medium text-primary underline-offset-4 hover:underline"
          @click="toggleMode"
        >
          {{ mode === 'login' ? '沒有帳戶？立即註冊' : '已有帳戶？返回登入' }}
        </button>
      </div>
    </BaseCard>
  </div>
</template>

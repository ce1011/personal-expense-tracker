<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowRight,
  Check,
  Cloud,
  CloudOff,
  Eye,
  EyeOff,
  Fingerprint,
  LockKeyhole,
  Smartphone,
  Sparkles,
} from 'lucide-vue-next'
import { WebAuthnAbortService, WebAuthnError } from '@simplewebauthn/browser'

import { ApiError } from '@/api/client'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const mode = shallowRef<'login' | 'register'>('login')
const email = shallowRef('')
const password = shallowRef('')
const name = shallowRef('')
const confirmPassword = shallowRef('')
const submitting = shallowRef(false)
const errorMessage = shallowRef('')
const showPassword = shallowRef(false)
const isOnline = shallowRef(true)
const passkeySubmitting = shallowRef(false)
const passkeySupported = shallowRef(false)

const isRegister = computed(() => mode.value === 'register')
const showPasskeyLogin = computed(
  () => !isRegister.value && passkeySupported.value && isOnline.value,
)
const pageTitle = computed(() => (isRegister.value ? '建立你的同步帳戶' : '歡迎回來'))
const pageDescription = computed(() =>
  isRegister.value
    ? '建立一次，之後在每部裝置繼續同一本帳。'
    : '你的預算、交易與旅程，已準備好接續。',
)

const passwordStrength = computed(() => {
  const value = password.value
  let score = 0

  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  if (score <= 1) return { label: '可再加強', width: '25%', tone: 'weak' }
  if (score === 2) return { label: '足夠使用', width: '55%', tone: 'medium' }
  if (score === 3) return { label: '良好', width: '78%', tone: 'good' }
  return { label: '很穩妥', width: '100%', tone: 'strong' }
})

function updateOnlineStatus(): void {
  isOnline.value = navigator.onLine
}

function toggleMode(): void {
  mode.value = isRegister.value ? 'login' : 'register'
  confirmPassword.value = ''
  errorMessage.value = ''
  WebAuthnAbortService.cancelCeremony()
  if (!isRegister.value) {
    void startConditionalPasskey()
  }
}

function togglePasswordVisibility(): void {
  showPassword.value = !showPassword.value
}


function isBenignWebAuthnError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const name = error instanceof WebAuthnError ? error.name : error.name
  const message = error.message.toLowerCase()
  return (
    name === 'NotAllowedError' ||
    name === 'AbortError' ||
    message.includes('the operation either timed out or was not allowed') ||
    message.includes('abort')
  )
}

function mapPasskeyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return '找不到可用的 Passkey，或驗證已失效。請改用密碼登入，或先在設定新增 Passkey。'
    }
    if (error.status === 400) {
      return error.message || 'Passkey 驗證失敗，請再試一次。'
    }
    return error.message || '未能完成 Passkey 登入，請稍後再試。'
  }
  if (isBenignWebAuthnError(error)) {
    return ''
  }
  if (error instanceof Error && error.message) {
    return 'Passkey 登入已取消或失敗，請再試一次。'
  }
  return '未能完成 Passkey 登入，請稍後再試。'
}

async function finishLoginRedirect(): Promise<void> {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  await router.replace(redirect)
}

async function loginWithPasskey(useEmailFallback = false): Promise<void> {
  if (!showPasskeyLogin.value || passkeySubmitting.value || submitting.value) {
    return
  }

  errorMessage.value = ''
  passkeySubmitting.value = true
  WebAuthnAbortService.cancelCeremony()

  try {
    const emailValue = email.value.trim()
    await auth.loginWithPasskey({
      email: useEmailFallback && emailValue ? emailValue : undefined,
    })
    await finishLoginRedirect()
  } catch (caught) {
    // Discoverable ceremony failed and the user typed an email — retry scoped.
    if (
      !useEmailFallback &&
      email.value.trim() &&
      caught instanceof ApiError &&
      caught.status === 401
    ) {
      passkeySubmitting.value = false
      await loginWithPasskey(true)
      return
    }

    if (
      !useEmailFallback &&
      email.value.trim() &&
      caught instanceof Error &&
      !isBenignWebAuthnError(caught)
    ) {
      try {
        await auth.loginWithPasskey({ email: email.value.trim() })
        await finishLoginRedirect()
        return
      } catch (retryError) {
        const mapped = mapPasskeyError(retryError)
        if (mapped) errorMessage.value = mapped
        return
      }
    }

    const mapped = mapPasskeyError(caught)
    if (mapped) errorMessage.value = mapped
  } finally {
    passkeySubmitting.value = false
  }
}

async function startConditionalPasskey(): Promise<void> {
  if (!showPasskeyLogin.value) return
  if (!(await auth.supportsPasskeyAutofill())) return

  try {
    await auth.loginWithPasskey({ useBrowserAutofill: true })
    await finishLoginRedirect()
  } catch (caught) {
    // Conditional UI is best-effort; ignore cancellation / unsupported cases.
    if (!isBenignWebAuthnError(caught)) {
      // Keep silent unless it is an unexpected API failure after assertion.
      if (caught instanceof ApiError) {
        const mapped = mapPasskeyError(caught)
        if (mapped) errorMessage.value = mapped
      }
    }
  }
}

async function submit(): Promise<void> {
  errorMessage.value = ''

  if (!isOnline.value) {
    errorMessage.value = '目前處於離線狀態。重新連線後便可繼續。'
    return
  }

  if (isRegister.value) {
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
    if (isRegister.value) {
      await auth.register(email.value, password.value, name.value || undefined)
    } else {
      await auth.login(email.value, password.value)
    }

    await finishLoginRedirect()
  } catch (caught) {
    if (caught instanceof ApiError) {
      if (caught.status === 401) {
        errorMessage.value = '電郵或密碼不正確。'
      } else if (caught.status === 409) {
        errorMessage.value = '此電郵已被註冊，請直接登入。'
      } else if (caught.status === 422) {
        errorMessage.value = '請檢查電郵格式，並使用至少 8 個字元的密碼。'
      } else {
        errorMessage.value = caught.message || '未能連接伺服器，請稍後再試。'
      }
    } else {
      errorMessage.value = '未能連接伺服器，請稍後再試。'
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  updateOnlineStatus()
  passkeySupported.value = auth.supportsPasskeys
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  void startConditionalPasskey()
})

onUnmounted(() => {
  WebAuthnAbortService.cancelCeremony()
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<template>
  <main class="auth-view min-h-svh">
    <div class="auth-view__glow auth-view__glow--one" aria-hidden="true" />
    <div class="auth-view__glow auth-view__glow--two" aria-hidden="true" />

    <div
      class="auth-layout mx-auto grid min-h-svh w-full max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8"
    >
      <section class="auth-story hidden lg:block" aria-labelledby="auth-story-title">
        <div class="auth-story__badge">
          <Sparkles class="size-3.5" aria-hidden="true" />
          隨時接續你的財務節奏
        </div>
        <h1 id="auth-story-title" class="auth-story__title">
          記下每一筆，
          <span>每部裝置都跟得上。</span>
        </h1>
        <p class="auth-story__copy">
          從只存在這部裝置的記錄，變成登入後即可安全接續的個人財務空間。
        </p>

        <div class="sync-orbit mt-12" aria-hidden="true">
          <div class="sync-orbit__path sync-orbit__path--outer" />
          <div class="sync-orbit__path sync-orbit__path--inner" />
          <div class="sync-orbit__core">
            <Cloud class="size-8" />
            <span>已同步</span>
          </div>
          <div class="sync-orbit__node sync-orbit__node--phone">
            <Smartphone class="size-5" />
          </div>
          <div class="sync-orbit__node sync-orbit__node--lock">
            <LockKeyhole class="size-5" />
          </div>
          <div class="sync-orbit__packet sync-orbit__packet--one" />
          <div class="sync-orbit__packet sync-orbit__packet--two" />
        </div>

        <div class="auth-benefits">
          <span><Check class="size-4" /> 多裝置接續</span>
          <span><Check class="size-4" /> 自動保留最新變更</span>
          <span><Check class="size-4" /> 你的資料只屬於你</span>
        </div>
      </section>

      <section class="auth-panel mx-auto w-full max-w-md">
        <div class="mb-6 lg:hidden">
          <div class="auth-mark">
            <Cloud class="size-5" aria-hidden="true" />
          </div>
          <p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Personal Expense Tracker
          </p>
        </div>

        <Transition name="auth-copy" mode="out-in">
          <header :key="mode" class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {{ isRegister ? '開始同步' : '登入帳戶' }}
            </p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-text">{{ pageTitle }}</h2>
            <p class="mt-2 text-body-sm leading-6 text-text-2">{{ pageDescription }}</p>
          </header>
        </Transition>

        <BaseCard class="auth-card p-5 sm:p-6">
          <div
            class="mb-5 flex items-center justify-between rounded-xl bg-accent/60 px-3 py-2 text-xs"
            :class="isOnline ? 'text-primary-2' : 'text-danger'"
          >
            <span class="flex items-center gap-2 font-semibold">
              <Cloud v-if="isOnline" class="size-4" aria-hidden="true" />
              <CloudOff v-else class="size-4" aria-hidden="true" />
              {{ isOnline ? '伺服器同步已就緒' : '目前離線' }}
            </span>
            <span
              class="status-dot"
              :class="{ 'status-dot--online': isOnline }"
              aria-hidden="true"
            />
          </div>

          <form class="auth-form grid gap-4" @submit.prevent="submit">
            <Transition name="field-reveal">
              <BaseInput
                v-if="isRegister"
                v-model="name"
                label="名稱（選填）"
                name="name"
                autocomplete="name"
                placeholder="你想顯示的名稱"
              />
            </Transition>

            <BaseInput
              v-model.trim="email"
              label="電郵"
              name="email"
              type="email"
              inputmode="email"
              :autocomplete="isRegister ? 'email' : 'username webauthn'"
              placeholder="you@example.com"
              required
            />

            <BaseInput
              v-model="password"
              label="密碼"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isRegister ? 'new-password' : 'current-password'"
              placeholder="至少 8 個字元"
              required
            >
              <template #suffix>
                <button
                  type="button"
                  class="grid size-9 place-items-center rounded-lg transition hover:bg-accent hover:text-primary"
                  :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
                  @click="togglePasswordVisibility"
                >
                  <EyeOff v-if="showPassword" class="size-4" aria-hidden="true" />
                  <Eye v-else class="size-4" aria-hidden="true" />
                </button>
              </template>
            </BaseInput>

            <Transition name="field-reveal">
              <div v-if="isRegister" class="grid gap-4">
                <div class="-mt-1">
                  <div class="mb-1.5 flex items-center justify-between text-[11px]">
                    <span class="text-text-3">密碼強度</span>
                    <span class="font-semibold text-text-2">{{ passwordStrength.label }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-accent">
                    <span
                      class="password-meter"
                      :class="`password-meter--${passwordStrength.tone}`"
                      :style="{ width: passwordStrength.width }"
                    />
                  </div>
                </div>

                <BaseInput
                  v-model="confirmPassword"
                  label="確認密碼"
                  name="confirm-password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="再輸入一次"
                  required
                />
              </div>
            </Transition>

            <Transition name="error-pop">
              <p
                v-if="errorMessage"
                class="auth-error rounded-xl border border-danger/20 bg-danger/5 p-3 text-body-sm text-danger"
                role="alert"
              >
                {{ errorMessage }}
              </p>
            </Transition>

            <BaseButton
              type="submit"
              class="mt-1 w-full"
              :loading="submitting"
              :disabled="!isOnline || passkeySubmitting"
            >
              {{ isRegister ? '建立帳戶並開始同步' : '登入並接續記錄' }}
              <ArrowRight v-if="!submitting" class="size-4" aria-hidden="true" />
            </BaseButton>
          </form>

          <div v-if="showPasskeyLogin" class="mt-4 grid gap-3">
            <div class="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-3">
              <span class="h-px flex-1 bg-border/80" />
              或
              <span class="h-px flex-1 bg-border/80" />
            </div>
            <BaseButton
              type="button"
              class="w-full"
              variant="secondary"
              :loading="passkeySubmitting"
              :disabled="submitting || !isOnline"
              @click="loginWithPasskey(false)"
            >
              <Fingerprint class="size-4" aria-hidden="true" />
              使用 Passkey 登入
            </BaseButton>
          </div>

          <div class="mt-5 border-t border-border/70 pt-4 text-center">
            <button
              type="button"
              class="min-h-11 rounded-lg px-3 text-body-sm font-semibold text-primary transition hover:bg-accent"
              @click="toggleMode"
            >
              {{ isRegister ? '已有帳戶？返回登入' : '第一次使用？建立帳戶' }}
            </button>
          </div>
        </BaseCard>

        <p class="mt-4 text-center text-xs leading-5 text-text-3">
          登入後，所有新增與修改都會顯示同步狀態。
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-view {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 12%, rgb(124 58 237 / 12%), transparent 28rem),
    radial-gradient(circle at 88% 82%, rgb(45 212 191 / 10%), transparent 24rem),
    linear-gradient(145deg, #fbfaff 0%, #f6f1ff 55%, #f8f6ff 100%);
}

.auth-view__glow {
  position: absolute;
  z-index: -1;
  border-radius: 999px;
  filter: blur(2px);
  pointer-events: none;
}

.auth-view__glow--one {
  top: -10rem;
  right: -8rem;
  width: 30rem;
  height: 30rem;
  background: radial-gradient(circle, rgb(167 139 250 / 22%), transparent 66%);
  animation: auth-float 15s ease-in-out infinite alternate;
}

.auth-view__glow--two {
  bottom: -12rem;
  left: -10rem;
  width: 34rem;
  height: 34rem;
  background: radial-gradient(circle, rgb(45 212 191 / 13%), transparent 67%);
  animation: auth-float 19s ease-in-out infinite alternate-reverse;
}

.auth-story__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid rgb(124 58 237 / 15%);
  border-radius: 999px;
  background: rgb(255 255 255 / 64%);
  padding: 0.45rem 0.7rem;
  color: var(--color-primary-2);
  font-size: 0.72rem;
  font-weight: 700;
  backdrop-filter: blur(14px);
}

.auth-story__title {
  max-width: 9em;
  margin-top: 1.5rem;
  color: var(--color-text);
  font-family: ui-rounded, 'SF Pro Rounded', 'Avenir Next', system-ui, sans-serif;
  font-size: clamp(3.2rem, 4.8vw, 4.5rem);
  font-weight: 760;
  letter-spacing: -0.07em;
  line-height: 0.98;
}

.auth-story__title span {
  color: var(--color-primary);
}

.auth-story__copy {
  max-width: 30rem;
  margin-top: 1.5rem;
  color: var(--color-text-2);
  font-size: 1.05rem;
  line-height: 1.75;
}

.sync-orbit {
  position: relative;
  display: grid;
  width: 19rem;
  height: 13rem;
  place-items: center;
}

.sync-orbit__path {
  position: absolute;
  border: 1px solid rgb(124 58 237 / 14%);
  border-radius: 999px;
  transform: rotate(-8deg);
}

.sync-orbit__path--outer {
  width: 18rem;
  height: 10rem;
}

.sync-orbit__path--inner {
  width: 12rem;
  height: 6.5rem;
  border-color: rgb(45 212 191 / 20%);
  transform: rotate(12deg);
}

.sync-orbit__core {
  display: grid;
  width: 6.5rem;
  height: 6.5rem;
  place-items: center;
  border: 1px solid rgb(124 58 237 / 16%);
  border-radius: 2rem;
  background: rgb(255 255 255 / 76%);
  color: var(--color-primary);
  box-shadow:
    0 22px 50px rgb(67 40 119 / 13%),
    inset 0 1px 0 white;
  backdrop-filter: blur(18px);
  transform: rotate(-3deg);
}

.sync-orbit__core span {
  margin-top: -1.1rem;
  font-size: 0.7rem;
  font-weight: 750;
}

.sync-orbit__node {
  position: absolute;
  display: grid;
  width: 3.2rem;
  height: 3.2rem;
  place-items: center;
  border: 1px solid rgb(124 58 237 / 12%);
  border-radius: 1rem;
  background: white;
  color: var(--color-primary-2);
  box-shadow: 0 14px 30px rgb(67 40 119 / 11%);
}

.sync-orbit__node--phone {
  top: 1.2rem;
  left: 0.1rem;
  animation: node-float 4.2s ease-in-out infinite;
}

.sync-orbit__node--lock {
  right: 0;
  bottom: 1rem;
  color: var(--color-success);
  animation: node-float 4.8s 600ms ease-in-out infinite;
}

.sync-orbit__packet {
  position: absolute;
  width: 0.55rem;
  height: 0.55rem;
  border: 2px solid white;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 0 0 4px rgb(124 58 237 / 12%);
}

.sync-orbit__packet--one {
  animation: packet-one 4s linear infinite;
}

.sync-orbit__packet--two {
  background: var(--color-success);
  box-shadow: 0 0 0 4px rgb(20 184 166 / 12%);
  animation: packet-two 4.8s 800ms linear infinite;
}

.auth-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1.1rem;
  margin-top: 1rem;
  color: var(--color-text-2);
  font-size: 0.78rem;
  font-weight: 650;
}

.auth-benefits span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.auth-benefits svg {
  color: var(--color-success);
}

.auth-mark {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 1rem;
  background: var(--color-primary);
  color: white;
  box-shadow: 0 12px 28px rgb(91 33 182 / 28%);
  transform: rotate(-5deg);
}

.auth-card {
  border-color: rgb(124 58 237 / 13%);
  background: rgb(255 255 255 / 82%);
  box-shadow:
    0 28px 70px rgb(67 40 119 / 12%),
    inset 0 1px 0 white;
  backdrop-filter: blur(22px) saturate(130%);
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-danger);
}

.status-dot--online {
  background: var(--color-success);
  box-shadow: 0 0 0 0 rgb(20 184 166 / 25%);
  animation: status-pulse 2.2s ease-out infinite;
}

.password-meter {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition:
    width 380ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 240ms ease;
}

.password-meter--weak {
  background: var(--color-danger);
}

.password-meter--medium {
  background: var(--color-warning);
}

.password-meter--good {
  background: var(--color-info);
}

.password-meter--strong {
  background: var(--color-success);
}

.auth-error {
  animation: error-shake 360ms ease;
}

.auth-copy-enter-active,
.auth-copy-leave-active,
.field-reveal-enter-active,
.field-reveal-leave-active,
.error-pop-enter-active,
.error-pop-leave-active {
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.auth-copy-enter-from,
.field-reveal-enter-from,
.error-pop-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.auth-copy-leave-to,
.field-reveal-leave-to,
.error-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes auth-float {
  to {
    transform: translate3d(-4rem, 3rem, 0) scale(1.08);
  }
}

@keyframes node-float {
  50% {
    transform: translateY(-8px) rotate(4deg);
  }
}

@keyframes packet-one {
  0% {
    transform: translate(-7.5rem, -2.3rem);
  }
  50% {
    transform: translate(0, 0.3rem);
  }
  100% {
    transform: translate(7.4rem, 3rem);
  }
}

@keyframes packet-two {
  0% {
    transform: translate(6.8rem, -2rem);
  }
  50% {
    transform: translate(0, -0.2rem);
  }
  100% {
    transform: translate(-6.9rem, 2.7rem);
  }
}

@keyframes status-pulse {
  65% {
    box-shadow: 0 0 0 7px transparent;
  }
}

@keyframes error-shake {
  25% {
    transform: translateX(-3px);
  }
  50% {
    transform: translateX(3px);
  }
  75% {
    transform: translateX(-2px);
  }
}
</style>

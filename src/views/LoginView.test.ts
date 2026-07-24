import { beforeEach, describe, expect, test, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

const mockSupportsPasskeys = vi.hoisted(() => true)
const mockLoginWithPasskey = vi.hoisted(() => vi.fn())
const mockSupportsPasskeyAutofill = vi.hoisted(() => vi.fn(async () => false))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    supportsPasskeys: mockSupportsPasskeys,
    loginWithPasskey: mockLoginWithPasskey,
    supportsPasskeyAutofill: mockSupportsPasskeyAutofill,
    login: vi.fn(),
    register: vi.fn(),
  }),
}))

vi.mock('@simplewebauthn/browser', () => ({
  WebAuthnAbortService: { cancelCeremony: vi.fn() },
  WebAuthnError: class WebAuthnError extends Error {},
}))

import LoginView from '@/views/LoginView.vue'

const Stub = (name: string) =>
  defineComponent({
    name,
    props: ['modelValue', 'loading', 'disabled', 'variant', 'type', 'label', 'autocomplete'],
    emits: ['update:modelValue', 'click'],
    setup(props, { slots, emit, attrs }) {
      return () =>
        h(
          name === 'BaseButton' ? 'button' : 'div',
          {
            ...attrs,
            type: props.type,
            disabled: props.disabled,
            'data-loading': props.loading ? 'true' : 'false',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  })

describe('LoginView passkey CTA', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockLoginWithPasskey.mockReset()
    mockSupportsPasskeyAutofill.mockResolvedValue(false)
    Object.defineProperty(globalThis.navigator, 'onLine', {
      configurable: true,
      get: () => true,
    })
  })

  async function mountView() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/login', component: LoginView },
      ],
    })
    await router.push('/login')
    await router.isReady()

    return mount(LoginView, {
      global: {
        plugins: [router],
        stubs: {
          BaseButton: Stub('BaseButton'),
          BaseCard: Stub('BaseCard'),
          BaseInput: Stub('BaseInput'),
        },
      },
    })
  }

  test('shows passkey login button in login mode when supported and online', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('使用 Passkey 登入')
  })
})

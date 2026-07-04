import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  test('renders slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click me' },
    })
    expect(wrapper.text()).toBe('Click me')
  })

  test('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click me' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  test('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Click me' },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  test('shows loading spinner and disables button', () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true },
      slots: { default: 'Save' },
    })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[class*="animate-spin"]').exists()).toBe(true)
  })

  test('forwards type attribute', () => {
    const wrapper = mount(BaseButton, {
      props: { type: 'submit' },
      slots: { default: 'Submit' },
    })
    expect(wrapper.find('button').attributes('type')).toBe('submit')
  })

  test('forwards aria-label attribute', () => {
    const wrapper = mount(BaseButton, {
      props: { ariaLabel: 'Close dialog' },
      slots: { default: '×' },
    })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Close dialog')
  })
})

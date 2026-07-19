import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import BaseInput from './BaseInput.vue'

describe('BaseInput', () => {
  test('renders label when provided', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', label: 'Amount' },
    })
    expect(wrapper.find('label').text()).toBe('Amount')
  })

  test('associates label with input using provided id', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', label: 'Amount', id: 'amount-input' },
    })
    expect(wrapper.find('label').attributes('for')).toBe('amount-input')
    expect(wrapper.find('input').attributes('id')).toBe('amount-input')
  })

  test('emits updated string value on input', async () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '' },
    })
    await wrapper.find('input').setValue('hello')
    expect(wrapper.emitted('update:modelValue')).toEqual([['hello']])
  })

  test('emits parsed number when number modifier is active', async () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: 0, modelModifiers: { number: true } },
    })
    await wrapper.find('input').setValue('42')
    expect(wrapper.emitted('update:modelValue')).toEqual([[42]])
  })

  test('emits zero for empty number input', async () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: 10, modelModifiers: { number: true } },
    })
    await wrapper.find('input').setValue('')
    expect(wrapper.emitted('update:modelValue')).toEqual([[0]])
  })

  test('emits trimmed string when trim modifier is active', async () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', modelModifiers: { trim: true } },
    })
    await wrapper.find('input').setValue('  hello world  ')
    expect(wrapper.emitted('update:modelValue')).toEqual([['hello world']])
  })

  test('renders error message when error prop is provided', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', error: 'Required field' },
    })
    expect(wrapper.find('p').text()).toBe('Required field')
  })

  test('forwards native input attributes to the inner input', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: 0, type: 'number' },
      attrs: { min: '0', step: '0.01' },
    })

    const input = wrapper.find('input')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('step')).toBe('0.01')
  })

  test('disables input when disabled prop is true', () => {
    const wrapper = mount(BaseInput, {
      props: { modelValue: '', disabled: true },
    })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})

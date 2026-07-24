import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import UiNumberField from './UiNumberField.vue'

describe('UiNumberField', () => {
  test('renders the current numeric value', () => {
    const wrapper = mount(UiNumberField, {
      props: {
        modelValue: 42,
        label: '金額',
        min: 0,
        step: 1,
      },
    })

    expect(wrapper.text()).toContain('金額')
    const input = wrapper.get('input')
    expect(input.element.value).toContain('42')
  })
})

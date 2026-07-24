import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import UiDatePicker from './UiDatePicker.vue'

describe('UiDatePicker', () => {
  test('accepts YYYY-MM-DD string model values', () => {
    const wrapper = mount(UiDatePicker, {
      props: {
        modelValue: '2026-07-24',
        label: '日期',
      },
    })

    expect(wrapper.text()).toContain('日期')
    // Segmented field should render year/month/day pieces for the value.
    expect(wrapper.text()).toMatch(/2026|24|7|07/)
  })
})

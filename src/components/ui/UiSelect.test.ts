import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import UiSelect from './UiSelect.vue'

describe('UiSelect', () => {
  test('renders the selected option label', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'hkd',
        label: '幣別',
        options: [
          { value: 'hkd', label: '港幣' },
          { value: 'jpy', label: '日圓' },
        ],
      },
    })

    expect(wrapper.text()).toContain('幣別')
    expect(wrapper.text()).toContain('港幣')
  })
})

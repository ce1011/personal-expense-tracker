import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import BaseBottomSheet from './BaseBottomSheet.vue'

describe('BaseBottomSheet', () => {
  test('applies vertical touch panning to the sheet panel', () => {
    const wrapper = mount(BaseBottomSheet, {
      props: { show: true },
    })

    const panel = wrapper.find('.touch-pan-y')
    expect(panel.exists()).toBe(true)
  })
})

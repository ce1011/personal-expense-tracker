import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, test } from 'vitest'

import BaseBottomSheet from './BaseBottomSheet.vue'

describe('BaseBottomSheet', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  test('applies vertical touch panning to the sheet panel', () => {
    const wrapper = mount(BaseBottomSheet, {
      props: { show: true },
      attachTo: document.body,
    })

    expect(document.querySelector('.touch-pan-y')).not.toBeNull()
    wrapper.unmount()
  })

  test('locks background scroll and exposes an accessible dialog while open', async () => {
    const wrapper = mount(BaseBottomSheet, {
      props: { show: true, title: '修改支出' },
      attachTo: document.body,
    })

    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ show: false })
    expect(document.body.style.overflow).toBe('')
    wrapper.unmount()
  })
})

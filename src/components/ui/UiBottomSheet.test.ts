import { mount } from '@vue/test-utils'
import { DrawerProvider } from 'reka-ui'
import { afterEach, describe, expect, test } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'

import UiBottomSheet from './UiBottomSheet.vue'
import { useOverlayState } from '@/composables/useOverlayState'

function mountSheet(props: Record<string, unknown>) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(DrawerProvider, null, {
          default: () => h(UiBottomSheet, props),
        })
    },
  })

  return mount(Host, { attachTo: document.body })
}

describe('UiBottomSheet', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    const { isOverlayOpen, closeOverlay } = useOverlayState()
    while (isOverlayOpen.value) {
      closeOverlay()
    }
  })

  test('registers chrome overlay state while open', async () => {
    const { isOverlayOpen } = useOverlayState()
    const wrapper = mountSheet({ show: true, title: '修改支出' })
    await nextTick()

    expect(isOverlayOpen.value).toBe(true)

    // Close by unmounting the host (simulates leaving the route/sheet tree).
    wrapper.unmount()
    expect(isOverlayOpen.value).toBe(false)
  })
})

import { mount } from '@vue/test-utils'
import { computed, defineComponent } from 'vue'
import { describe, expect, test, vi } from 'vitest'

import { useIsMobile } from './useIsMobile'

const TestComponent = defineComponent({
  setup() {
    const isMobile = useIsMobile()
    const width = computed(() => (isMobile.value ? 'mobile' : 'desktop'))
    return { width }
  },
  template: '<span>{{ width }}</span>',
})

describe('useIsMobile', () => {
  test('returns true when viewport width is below 768px', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(767)
    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toBe('mobile')
    wrapper.unmount()
  })

  test('returns false when viewport width is 768px or above', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(768)
    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toBe('desktop')
    wrapper.unmount()
  })

  test('updates when window is resized', async () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toBe('desktop')

    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375)
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toBe('mobile')
    wrapper.unmount()
  })

  test('removes resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(TestComponent)
    wrapper.unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})

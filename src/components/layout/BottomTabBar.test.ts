import { mount } from '@vue/test-utils'
import { DrawerProvider } from 'reka-ui'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, test } from 'vitest'

import UiBottomSheet from '@/components/ui/UiBottomSheet.vue'
import BottomTabBar from '@/components/layout/BottomTabBar.vue'

describe('BottomTabBar', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  test('slides away and becomes inert while a bottom sheet is open', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'dashboard', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()

    const navigation = mount(BottomTabBar, {
      global: { plugins: [router] },
    })
    const SheetHost = defineComponent({
      props: {
        show: { type: Boolean, default: false },
      },
      setup(props) {
        return () =>
          h(DrawerProvider, null, {
            default: () =>
              h(UiBottomSheet, {
                show: props.show,
                title: '修改支出',
              }),
          })
      },
    })

    const sheet = mount(SheetHost, {
      props: { show: false },
      attachTo: document.body,
    })

    await sheet.setProps({ show: true })
    await nextTick()

    const nav = navigation.get('nav')
    expect(nav.classes()).toContain('bottom-tab--hidden')
    expect(nav.attributes('aria-hidden')).toBe('true')
    expect(nav.attributes('inert')).toBeDefined()

    await sheet.setProps({ show: false })
    await nextTick()

    expect(nav.classes()).not.toContain('bottom-tab--hidden')
    expect(nav.attributes('aria-hidden')).toBe('false')

    sheet.unmount()
    navigation.unmount()
  })

  test('slides the active indicator to the section that owns the current route', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'dashboard', component: { template: '<div />' } },
        { path: '/budgets', name: 'budgets', component: { template: '<div />' } },
      ],
    })
    await router.push('/')
    await router.isReady()

    const navigation = mount(BottomTabBar, {
      global: { plugins: [router] },
    })
    const items = navigation.get('.bottom-tab__items')

    expect(items.attributes('style')).toContain('--active-tab-index: 0')

    await router.push('/budgets')
    await nextTick()

    expect(items.attributes('style')).toContain('--active-tab-index: 3')

    navigation.unmount()
  })
})

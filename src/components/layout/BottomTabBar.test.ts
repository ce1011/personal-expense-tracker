import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, test } from 'vitest'

import BaseBottomSheet from '@/components/base/BaseBottomSheet.vue'
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
    const sheet = mount(BaseBottomSheet, {
      props: { show: false, title: '修改支出' },
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

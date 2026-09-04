import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'

import OauthConsentCard from './OauthConsentCard.vue'

describe('OauthConsentCard', () => {
  test('emits allow and deny', async () => {
    const wrapper = mount(OauthConsentCard, {
      props: {
        clientName: 'Grok',
        accountEmail: 'you@example.com',
        submitting: false,
      },
    })

    await wrapper.get('button.base-button--primary').trigger('click')
    await wrapper.get('button.base-button--secondary').trigger('click')

    expect(wrapper.emitted('allow')).toHaveLength(1)
    expect(wrapper.emitted('deny')).toHaveLength(1)
  })
})

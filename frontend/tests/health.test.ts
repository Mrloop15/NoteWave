import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { checkHealth } from '../src/features/operations/services/health'
import { useServiceHealth } from '../src/features/operations/composables/useServiceHealth'

vi.mock('../src/features/operations/services/health', () => ({
  checkHealth: vi.fn(),
}))

const probe = defineComponent({
  setup: useServiceHealth,
  template:
    '<div><span>{{ status }}</span><button @click="refresh">Retry</button></div>',
})

afterEach(() => vi.resetAllMocks())

describe('service connection', () => {
  it('shows failure and recovers when the user retries', async () => {
    vi.mocked(checkHealth)
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce()
    const wrapper = mount(probe)
    expect(wrapper.text()).toContain('checking')
    await flushPromises()
    expect(wrapper.text()).toContain('unavailable')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('available')
    wrapper.unmount()
  })

  it('cancels the pending request when the view unmounts', () => {
    vi.mocked(checkHealth).mockReturnValue(new Promise(() => {}))
    const wrapper = mount(probe)
    const signal = vi.mocked(checkHealth).mock.calls[0]?.[0]
    expect(signal?.aborted).toBe(false)
    wrapper.unmount()
    expect(signal?.aborted).toBe(true)
  })

  it('ignores an old response after a new check starts', async () => {
    let rejectFirst!: (reason: Error) => void
    vi.mocked(checkHealth)
      .mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectFirst = reject
        }),
      )
      .mockResolvedValueOnce()
    const wrapper = mount(probe)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    rejectFirst(new Error('Old request failed'))
    await flushPromises()
    expect(wrapper.text()).toContain('available')
    wrapper.unmount()
  })
})

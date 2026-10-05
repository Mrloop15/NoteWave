import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppDropdown from '../src/components/ui/AppDropdown.vue'

const props = {
  id: 'language',
  label: 'Idioma',
  modelValue: 'es',
  options: [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
  ],
}

it('supports keyboard selection, Escape and typeahead without changing the value on focus', async () => {
  const wrapper = mount(AppDropdown, { props, attachTo: document.body })
  const trigger = wrapper.get('[role="combobox"]')
  await trigger.trigger('keydown', { key: 'ArrowDown' })
  expect(trigger.attributes('aria-expanded')).toBe('true')
  await trigger.trigger('keydown', { key: 'End' })
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  await trigger.trigger('keydown', { key: 'Enter' })
  expect(wrapper.emitted('update:modelValue')).toEqual([['en']])
  expect(document.activeElement).toBe(trigger.element)
  await trigger.trigger('keydown', { key: 'i' })
  expect(trigger.attributes('aria-activedescendant')).toBe('language-option-1')
  await trigger.trigger('keydown', { key: 'Escape' })
  expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  wrapper.unmount()
})

it('selects by pointer, closes on outside interaction and respects disabled', async () => {
  const wrapper = mount(AppDropdown, { props, attachTo: document.body })
  const trigger = wrapper.get('[role="combobox"]')
  await trigger.trigger('click')
  await wrapper.get('[id="language-option-1"]').trigger('click')
  expect(wrapper.emitted('update:modelValue')).toEqual([['en']])
  await trigger.trigger('click')
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  await wrapper.vm.$nextTick()
  expect(trigger.attributes('aria-expanded')).toBe('false')
  await wrapper.setProps({ disabled: true })
  expect(trigger.attributes()).toHaveProperty('disabled')
  await trigger.trigger('keydown', { key: 'ArrowDown' })
  expect(trigger.attributes('aria-expanded')).toBe('false')
  wrapper.unmount()
})

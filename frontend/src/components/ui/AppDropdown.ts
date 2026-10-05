import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type PropType,
} from 'vue'
import { Check, ChevronDown } from '@lucide/vue'

export interface DropdownOption {
  value: string
  label: string
}

export default defineComponent({
  components: { Check, ChevronDown },
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    modelValue: { type: String, required: true },
    options: {
      type: Array as PropType<readonly DropdownOption[]>,
      required: true,
    },
    disabled: Boolean,
  },
  emits: { 'update:modelValue': (value: string) => typeof value === 'string' },
  setup(props, { emit }) {
    const root = ref<HTMLElement>(),
      trigger = ref<HTMLButtonElement>()
    const opened = ref(false),
      highlighted = ref(0)
    const selected = computed(() =>
      props.options.find((option) => option.value === props.modelValue),
    )
    let search = '',
      lastKey = 0
    function close() {
      opened.value = false
      search = ''
    }
    function open() {
      if (props.disabled || !props.options.length) return
      highlighted.value = Math.max(
        0,
        props.options.findIndex((option) => option.value === props.modelValue),
      )
      opened.value = true
    }
    function toggle() {
      if (opened.value) close()
      else open()
    }
    function choose(index: number) {
      if (props.disabled) return
      const option = props.options[index]
      if (option) emit('update:modelValue', option.value)
      close()
      trigger.value?.focus()
    }
    function keydown(event: KeyboardEvent) {
      if (props.disabled) return
      if (event.key === 'Tab') {
        close()
        return
      }
      if (event.key === 'Escape') {
        if (opened.value) {
          event.preventDefault()
          close()
        }
        return
      }
      if (
        ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(
          event.key,
        )
      ) {
        event.preventDefault()
        const wasOpen = opened.value
        if (!wasOpen) open()
        if (event.key === 'Enter' || event.key === ' ') {
          if (wasOpen) choose(highlighted.value)
          return
        }
        if (event.key === 'Home') highlighted.value = 0
        else if (event.key === 'End')
          highlighted.value = props.options.length - 1
        else if (wasOpen)
          highlighted.value =
            (highlighted.value +
              (event.key === 'ArrowDown' ? 1 : -1) +
              props.options.length) %
            props.options.length
      } else if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (!opened.value) open()
        search = Date.now() - lastKey > 600 ? event.key : search + event.key
        lastKey = Date.now()
        const index = props.options.findIndex((option) =>
          option.label
            .toLocaleLowerCase()
            .startsWith(search.toLocaleLowerCase()),
        )
        if (index >= 0) highlighted.value = index
      }
      void nextTick(() =>
        root.value
          ?.querySelector<HTMLElement>('[data-highlighted="true"]')
          ?.scrollIntoView?.({ block: 'nearest' }),
      )
    }
    function outside(event: PointerEvent) {
      if (!root.value?.contains(event.target as Node)) close()
    }
    function blur(event: FocusEvent) {
      if (!root.value?.contains(event.relatedTarget as Node)) close()
    }
    watch(
      () => props.disabled,
      (value) => {
        if (value) close()
      },
    )
    onMounted(() => document.addEventListener('pointerdown', outside))
    onUnmounted(() => document.removeEventListener('pointerdown', outside))
    return {
      root,
      trigger,
      opened,
      highlighted,
      selected,
      toggle,
      choose,
      keydown,
      blur,
    }
  },
})

import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { isAxiosError } from 'axios'
import { useSessionStore } from '../../../stores/session'
import { authError } from '../../auth/errors'
import { accountService } from '../services/account'
import { accountMessages as text } from '../messages'
import type { SessionUser } from '../../auth/types'

export function useAccount() {
  const session = useSessionStore()
  const form = reactive({
    name: '',
    dictation_language: 'es',
    timezone: 'browser',
    profile_version: 1,
  })
  const baseline = ref(''),
    error = ref(''),
    notice = ref(''),
    conflict = ref(false),
    fields = ref<Record<string, string>>({})
  const password = reactive({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const passwordError = ref(''),
    passwordNotice = ref(''),
    passwordFields = ref<Record<string, string>>({})
  const busy = ref<'profile' | 'password' | 'reload' | null>(null),
    zones = ref<string[]>([]),
    loading = ref(false),
    loadError = ref('')
  let request: AbortController | undefined,
    optionsRequest: AbortController | undefined
  const snapshot = () =>
    JSON.stringify([form.name, form.dictation_language, form.timezone])
  const dirty = computed(() => baseline.value !== snapshot())
  const passwordDirty = computed(() =>
    Boolean(
      password.current_password ||
      password.password ||
      password.password_confirmation,
    ),
  )
  const timezoneOptions = computed(() => [
    { value: 'browser', label: text.browser },
    ...zones.value.map((value) => ({
      value,
      label: value.replaceAll('_', ' ').replaceAll('/', ' / '),
    })),
  ])
  const languageOptions = [
    { value: 'es', label: text.spanish },
    { value: 'en', label: text.english },
  ]
  function accept(user: SessionUser) {
    Object.assign(form, {
      name: user.name,
      dictation_language: user.dictation_language,
      timezone: user.timezone ?? 'browser',
      profile_version: user.profile_version,
    })
    baseline.value = snapshot()
    conflict.value = false
  }
  if (session.user) accept(session.user)
  function clearPasswords() {
    Object.assign(password, {
      current_password: '',
      password: '',
      password_confirmation: '',
    })
  }
  async function loadOptions() {
    optionsRequest?.abort()
    const current = new AbortController()
    optionsRequest = current
    loading.value = true
    loadError.value = ''
    try {
      const result = await accountService.options(current.signal)
      if (!current.signal.aborted) zones.value = result
    } catch {
      if (!current.signal.aborted) loadError.value = text.loadError
    } finally {
      if (!current.signal.aborted) loading.value = false
    }
  }
  async function save() {
    if (busy.value || !session.user) return
    const owner = session.user.id,
      current = new AbortController()
    request = current
    busy.value = 'profile'
    error.value = ''
    notice.value = ''
    fields.value = {}
    try {
      const result = await accountService.profile(
        {
          ...form,
          dictation_language: form.dictation_language as 'es' | 'en',
          timezone: form.timezone === 'browser' ? null : form.timezone,
        },
        current.signal,
      )
      if (current.signal.aborted || session.user?.id !== owner) return
      session.replace(result)
      accept(result)
      notice.value = text.saved
    } catch (cause) {
      if (current.signal.aborted) return
      conflict.value = isAxiosError(cause) && cause.response?.status === 409
      const result = authError(cause)
      error.value = conflict.value ? text.conflict : result.message
      fields.value = result.fields
    } finally {
      if (!current.signal.aborted) busy.value = null
    }
  }
  async function reload() {
    if (busy.value || (dirty.value && !window.confirm(text.discard))) return
    if (!session.user) return
    const owner = session.user.id,
      current = new AbortController()
    request = current
    busy.value = 'reload'
    error.value = ''
    notice.value = ''
    try {
      const result = await accountService.get(current.signal)
      if (!current.signal.aborted && session.user?.id === owner) {
        session.replace(result)
        accept(result)
        fields.value = {}
      }
    } catch (cause) {
      if (!current.signal.aborted) error.value = authError(cause).message
    } finally {
      if (!current.signal.aborted) busy.value = null
    }
  }
  async function changePassword() {
    if (busy.value || !session.user) return
    const current = new AbortController()
    request = current
    busy.value = 'password'
    passwordError.value = ''
    passwordNotice.value = ''
    passwordFields.value = {}
    try {
      await accountService.password({ ...password }, current.signal)
      if (!current.signal.aborted) passwordNotice.value = text.passwordSaved
    } catch (cause) {
      if (current.signal.aborted) return
      const result = authError(cause)
      passwordError.value = result.message
      passwordFields.value = result.fields
    } finally {
      clearPasswords()
      if (!current.signal.aborted) busy.value = null
    }
  }
  function canLeave() {
    if (!session.user) return true
    if (busy.value) {
      error.value = text.wait
      return false
    }
    return !(dirty.value || passwordDirty.value) || window.confirm(text.discard)
  }
  function unload(event: BeforeUnloadEvent) {
    if (dirty.value || passwordDirty.value || busy.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  function clear() {
    request?.abort()
    optionsRequest?.abort()
    clearPasswords()
    Object.assign(form, {
      name: '',
      dictation_language: 'es',
      timezone: 'browser',
      profile_version: 1,
    })
    baseline.value = snapshot()
    error.value = ''
    notice.value = ''
    passwordError.value = ''
    passwordNotice.value = ''
    fields.value = {}
    passwordFields.value = {}
    busy.value = null
  }
  watch(
    () => session.user?.id,
    (id, previous) => {
      if (id !== previous) clear()
    },
    { flush: 'sync' },
  )
  onBeforeRouteLeave(canLeave)
  onMounted(() => {
    void loadOptions()
    window.addEventListener('beforeunload', unload)
  })
  onUnmounted(() => {
    clear()
    window.removeEventListener('beforeunload', unload)
  })
  return {
    session,
    form,
    password,
    error,
    notice,
    conflict,
    fields,
    passwordError,
    passwordNotice,
    passwordFields,
    busy,
    loading,
    loadError,
    dirty,
    timezoneOptions,
    languageOptions,
    text,
    save,
    reload,
    changePassword,
    loadOptions,
  }
}

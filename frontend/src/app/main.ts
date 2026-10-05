import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import '../styles/global.css'
import '../styles/auth.css'
import { http } from './http'
import { sessionChannel, useSessionStore } from '../stores/session'

const pinia = createPinia()
const session = useSessionStore(pinia)
http.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    const hadUser = Boolean(session.user)
    session.clear()
    if (hadUser && router.currentRoute.value.meta.requiresAuth)
      void router.replace('/auth/login')
  }
  return Promise.reject(error)
})

if (sessionChannel)
  sessionChannel.onmessage = (event) => {
    if (event.data !== 'logout') return
    session.clear()
    if (router.currentRoute.value.meta.requiresAuth)
      void router.replace('/auth/login')
  }

createApp(App).use(pinia).use(router).mount('#app')

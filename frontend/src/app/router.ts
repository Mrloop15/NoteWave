import { createRouter, createWebHistory } from 'vue-router'
import { useSessionStore } from '../stores/session'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...(
      [
        ['login', '/auth/login'],
        ['register', '/auth/register'],
        ['forgot', '/auth/forgot-password'],
        ['reset', '/auth/reset-password'],
      ] as const
    ).map(([mode, path]) => ({
      path,
      name: mode,
      component: () => import('../pages/AuthPage.vue'),
      meta: { authMode: mode, guest: true },
    })),
    {
      path: '/auth/verify-email',
      name: 'verify',
      component: () => import('../pages/VerifyEmailPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/app',
      name: 'workspace',
      component: () => import('../pages/WorkspacePage.vue'),
      meta: { requiresAuth: true, verified: true },
    },
    {
      path: '/app/account',
      name: 'account',
      component: () => import('../pages/AccountPage.vue'),
      meta: { requiresAuth: true, verified: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/HomePage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFoundPage.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guest) return
  const session = useSessionStore()
  try {
    await session.refresh()
  } catch {
    return { path: '/', query: { connection: 'failed' } }
  }
  if (to.meta.requiresAuth && !session.user)
    return { path: '/auth/login', query: { next: to.fullPath } }
  if (to.meta.verified && !session.user?.email_verified_at)
    return '/auth/verify-email'
  if (to.meta.guest && session.user)
    return session.user.email_verified_at ? '/app' : '/auth/verify-email'
})

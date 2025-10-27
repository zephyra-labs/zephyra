import { useUserStore } from '~/stores/userStore'

export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore()

  if (!userStore.currentUser) {
    await userStore.fetchCurrentUser?.().catch(() => null)
  }

  const publicRoutes = ['/wallets', '/forbidden', '/']
  if (publicRoutes.includes(to.path)) return

  if (!userStore.currentUser) {
    if (to.path !== '/wallets') return navigateTo('/wallets')
    return
  }

  // Admin only
  if (to.path.startsWith('/admin') && userStore.currentUser.role !== 'admin') {
    if (to.path !== '/forbidden') return navigateTo('/forbidden')
    return
  }

  // User dashboard only
  if (to.path.startsWith('/dashboard') && userStore.currentUser.role !== 'user') {
    if (to.path !== '/forbidden') return navigateTo('/forbidden')
    return
  }
})

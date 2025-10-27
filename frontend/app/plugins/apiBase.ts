export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('apiBase', nuxtApp.$config.public.apiBase)
})

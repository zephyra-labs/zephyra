import { defineNuxtPlugin } from '#app'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('DynamicScroller', DynamicScroller)
  nuxtApp.vueApp.component('DynamicScrollerItem', DynamicScrollerItem)
})

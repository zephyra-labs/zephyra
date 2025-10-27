<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { NuxtLink } from '#components'
import Button from '~/components/ui/Button.vue'
import { useWallet } from '~/composables/useWallets'
import { useNotification } from '~/composables/useNotification'
import { Menu, X, Bell, Sun, Moon } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/userStore'

/* ✅ Stores */
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

/* 🦊 Wallet */
const { account, connectWallet } = useWallet()

/* 🔔 Notifications */
const { notifications, unreadCount, fetchNotificationsByUser, markAsRead } = useNotification(account.value ?? '')
watch(account, (acc) => { if (acc) fetchNotificationsByUser(acc) })

/* 💻 Mobile + Notif State */
const mobileOpen = ref(false)
const notifOpen = ref(false)
const notifRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (!notifRef.value) return
  if (!notifRef.value.contains(e.target as Node)) notifOpen.value = false
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

/* 🌙 Dark Mode */
const darkMode = ref(false)
const toggleDarkMode = () => {
  darkMode.value = !darkMode.value
  document.documentElement.classList.toggle('dark', darkMode.value)
  localStorage.setItem('darkMode', darkMode.value ? 'true' : 'false')
}
onMounted(() => {
  darkMode.value = localStorage.getItem('darkMode') === 'true'
  document.documentElement.classList.toggle('dark', darkMode.value)
})

/* Handlers */
const toggleMobile = () => (mobileOpen.value = !mobileOpen.value)
const toggleNotif = () => (notifOpen.value = !notifOpen.value)
const handleConnect = async () => { try { await connectWallet() } catch (e) { console.error(e) } }
const markNotifAsRead = async (id: string) => await markAsRead(id)

/* 🔗 Role-based Nav Links */
const navLinks = [
  { to: '/wallets', label: 'Wallets', roles: ['admin', 'user', 'guest'] },
  { to: '/admin/contracts', label: 'Contracts', roles: ['admin'] },
  { to: '/dashboard/contracts', label: 'Contracts', roles: ['user'] },
  { to: '/admin/documents', label: 'Documents', roles: ['admin'] },
  { to: '/dashboard/documents', label: 'Documents', roles: ['user'] },
  { to: '/kyc', label: 'KYC', roles: ['admin', 'user'] },
  { to: '/faucet', label: 'Faucet', roles: ['admin', 'user'] },
  { to: '/admin/logs', label: 'Logs', roles: ['admin'] },
  { to: '/admin/company', label: 'Company', roles: ['admin'] },
  { to: '/admin/users', label: 'Users', roles: ['admin'] },
  { to: '/admin/usercompany', label: 'UsComp', roles: ['admin'] },
  { to: '/dashboard/profile', label: 'My Profile', roles: ['user'] },
  { to: '/dashboard/company', label: 'My Company', roles: ['user'] },
]

/* 🧠 Computed Role */
const role = computed(() => currentUser.value?.role ?? 'guest')

/* Home link sesuai role */
const homeLink = computed(() => {
  if (role.value === 'admin') return { to: '/admin/', label: 'TradeChain' }
  if (role.value === 'user') return { to: '/dashboard/', label: 'TradeChain' }
  return { to: '/', label: 'TradeChain' }
})

/* Filtered links selain Home */
const filteredLinks = computed(() => navLinks.filter(link => link.roles.includes(role.value)))

/* Latest notifications */
const latestNotifs = computed(() => [...notifications.value].sort((a,b) => b.createdAt - a.createdAt).slice(0,5))
const formatDate = (ts: number) => new Date(ts).toLocaleString()
</script>

<template>
<header class="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md transition-colors duration-300">
  <div class="max-w-7xl mx-auto flex items-center justify-between p-4 md:px-6">

    <!-- Logo / Home -->
    <div class="flex items-center gap-4">
      <NuxtLink :to="homeLink.to" class="flex items-center gap-2">
        <h1 class="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ homeLink.label }}</h1>
      </NuxtLink>
    </div>

    <!-- Desktop Nav -->
    <nav class="hidden md:flex items-center gap-4 font-medium text-gray-700 dark:text-gray-200">
      <NuxtLink
        v-for="link in filteredLinks"
        :key="link.to"
        :to="link.to"
        class="px-4 py-2 rounded-lg transition-colors duration-200
               hover:bg-indigo-50 hover:text-indigo-600
               dark:hover:bg-gray-700 dark:hover:text-indigo-300"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>

    <!-- Right Actions -->
    <div class="flex items-center gap-3 md:gap-4">

      <!-- Dark Mode -->
      <button
class="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700" :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              @click="toggleDarkMode">
        <Sun v-if="!darkMode" class="w-5 h-5 text-yellow-400"/>
        <Moon v-else class="w-5 h-5 text-gray-200"/>
      </button>

      <!-- Notifications -->
      <div ref="notifRef" class="relative">
        <button class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" @click="toggleNotif">
          <Bell class="w-6 h-6 text-gray-700 dark:text-gray-200"/>
          <span v-if="unreadCount" class="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">{{ unreadCount }}</span>
        </button>

        <transition name="fade">
          <div v-if="notifOpen" class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-50">
            <div class="p-3 font-semibold border-b border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200">Notifications</div>
            <ul class="max-h-64 overflow-y-auto">
              <li
v-for="n in latestNotifs" :key="n.id" 
                  class="flex flex-col p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700"
                  :class="{'bg-indigo-50 dark:bg-gray-700': !n.read}">
                <div class="flex justify-between items-center">
                  <h3 class="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{{ n.title }}</h3>
                  <button v-if="!n.read" class="text-blue-500 text-xs ml-2 hover:underline" @click="markNotifAsRead(n.id)">
                    Mark
                  </button>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-xs mt-0.5 truncate">{{ n.message }}</p>
                <p class="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5 italic">by: {{ n.executorId }}</p>
                <p class="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">{{ formatDate(n.createdAt) }}</p>
              </li>
              <li v-if="!latestNotifs.length" class="p-3 text-center text-gray-400 dark:text-gray-500 text-sm">No notifications</li>
            </ul>
            <NuxtLink
to="/notifications" class="block text-center p-2 text-blue-600 dark:text-blue-400
                                                 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 rounded-b-lg text-sm">
              View All
            </NuxtLink>
          </div>
        </transition>
      </div>

      <!-- Wallet -->
      <div class="hidden md:block">
        <Button v-if="!account" class="px-3 py-2 text-sm" @click="handleConnect">Connect Wallet</Button>
        <span v-else class="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm truncate max-w-[160px] block">{{ account }}</span>
      </div>

      <!-- Mobile Menu -->
      <button class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" @click="toggleMobile">
        <Menu v-if="!mobileOpen" class="w-6 h-6 text-gray-700 dark:text-gray-200"/>
        <X v-else class="w-6 h-6 text-gray-700 dark:text-gray-200"/>
      </button>
    </div>
  </div>

  <!-- Mobile Nav -->
  <transition name="fade">
    <nav v-if="mobileOpen" class="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-inner max-h-[80vh] overflow-y-auto">
      <ul class="flex flex-col p-4 gap-2">
        <li class="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <NuxtLink :to="homeLink.to" class="block px-4 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-base font-medium" @click="mobileOpen = false">
            {{ homeLink.label }}
          </NuxtLink>
        </li>
        <li v-for="link in filteredLinks" :key="link.to" class="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <NuxtLink :to="link.to" class="block px-4 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 text-base font-medium" @click="mobileOpen = false">
            {{ link.label }}
          </NuxtLink>
        </li>

        <!-- Wallet -->
        <li class="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-center">
            <Button v-if="!account" class="px-4 py-2 w-full max-w-xs text-sm" @click="handleConnect">Connect Wallet</Button>
            <span v-else class="px-4 py-2 w-full max-w-xs bg-gray-100 dark:bg-gray-700 rounded-lg text-sm truncate block text-center">{{ account }}</span>
          </div>
        </li>
      </ul>
    </nav>
  </transition>
</header>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }
</style>

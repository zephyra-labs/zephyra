<script setup lang="ts">
import { ref } from 'vue'
import { NuxtLink } from '#components'
import { Wallet, FileText, Activity, User } from 'lucide-vue-next'

// --- Define the cards ---
interface LogCard {
  title: string
  description: string
  icon: any
  link: string
  color: string
}

const logCards = ref<LogCard[]>([
  { title: 'Wallet Logs', description: 'View all wallet activity', icon: Wallet, link: '/admin/logs/wallet', color: 'indigo-600' },
  { title: 'Contract Logs', description: 'View deployed contract activity', icon: FileText, link: '/admin/logs/contract', color: 'green-600' },
  { title: 'Activity Logs', description: 'Detailed activity logs', icon: Activity, link: '/admin/logs/activity', color: 'orange-600' },
  { title: 'Aggregated Activity Logs', description: 'Summary of all activities', icon: Activity, link: '/admin/logs/aggregatedactivity', color: 'purple-600' },
  { title: 'KYC Logs', description: 'User KYC verification logs', icon: User, link: '/admin/logs/kyc', color: 'teal-600' },
  { title: 'Document Logs', description: 'Uploaded document activity', icon: FileText, link: '/admin/logs/document', color: 'pink-600' },
])
</script>

<template>
  <section class="p-4 max-w-6xl mx-auto">
    <h2 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Logs Dashboard</h2>
    <p class="text-gray-500 dark:text-gray-400 mb-6">Quick access to all your logs.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="card in logCards"
        :key="card.title"
        :to="card.link"
        class="bg-white dark:bg-gray-900 rounded-xl shadow hover:shadow-xl transition p-5 flex items-center gap-4 group"
      >
        <!-- Icon container with proper Tailwind class binding -->
        <div
          class="w-12 h-12 flex items-center justify-center rounded-full text-white transition group-hover:brightness-110"
          :class="{
            'bg-indigo-600': card.color==='indigo-600',
            'bg-green-600': card.color==='green-600',
            'bg-orange-600': card.color==='orange-600',
            'bg-purple-600': card.color==='purple-600',
            'bg-teal-600': card.color==='teal-600',
            'bg-pink-600': card.color==='pink-600'
          }"
        >
          <component :is="card.icon" class="w-6 h-6" />
        </div>

        <!-- Card content -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ card.title }}</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ card.description }}</p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

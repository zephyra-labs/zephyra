// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  
  css: [
    '@/assets/css/tailwind.css',
  ],
  
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  
  runtimeConfig: {
    // private
    apiSecret: process.env.API_SECRET,
    INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
    INFURA_PROJECT_SECRET: process.env.INFURA_PROJECT_SECRET,

    // public
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:5000/api',
      wsBase: process.env.NUXT_PUBLIC_WS_BASE || 'ws://localhost:5000',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET,
    },
  },
})

import { useCookie } from '#app'
import { useRuntimeConfig } from '#app'

export function useApi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase

  async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    }

    // --- Ambil token dari cookie (SSR) atau localStorage (client) ---
    let token: string | null = null
    if (typeof window === 'undefined') {
      token = useCookie('token').value || null
    } else {
      token = localStorage.getItem('token')
    }

    if (token) headers['Authorization'] = `Bearer ${token}`

    // --- Jika body bukan FormData, set Content-Type JSON ---
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
      if (options.body && typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body)
      }
    }

    const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers })

    if (!res.ok) {
      // Ambil teks error
      let errorText = await res.text()
      try {
        const json = JSON.parse(errorText)
        if (json?.message) errorText = json.message
      } catch (err) {
        // do nothing, tetap pakai text mentah
      }
      throw new Error(errorText || `API request failed: ${res.statusText}`)
    }

    // Response JSON
    try {
      return await res.json() as T
    } catch (err) {
      // Jika tidak bisa parse JSON, return empty object
      return {} as T
    }
  }

  return { request }
}

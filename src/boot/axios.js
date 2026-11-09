import { boot } from 'quasar/wrappers'
import axios from 'axios'

const host = window.location.hostname
const protocol = window.location.protocol

// กำหนด SERVER_URL แบบครอบคลุมทั้ง Local, LAN IP, ngrok และ Cloudflare Tunnel
const SERVER_URL =
  host === 'localhost' || host === '127.0.0.1' ? 'http://127.0.0.1:8000' : `${protocol}//${host}`

const api = axios.create({
  // 🟢 ตั้งค่าเป็น Relative Path '/api' เพื่อให้ยิงผ่าน Vite Proxy เสมอ (แก้ Mixed Content 100%)
  baseURL: '/api',
  timeout: 100000,
  headers: {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

const getStoredAccessToken = () => {
  const directToken = localStorage.getItem('auth_token')
  return typeof directToken === 'string' ? directToken.trim().replace(/^Bearer\s+/i, '') : ''
}

// Request Interceptor (สำหรับแนบ Token ยืนยันตัวตน)
api.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken()
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers.delete('Authorization')
    }
    return config
  },
  (error) => Promise.reject(error),
)

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, SERVER_URL }

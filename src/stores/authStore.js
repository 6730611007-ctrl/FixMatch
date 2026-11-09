import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // ข้อมูลผู้ใช้ที่ล็อกอินอยู่
    user: JSON.parse(localStorage.getItem('user_info')) || null, // { id, name, phone, email, avatar }
    token: localStorage.getItem('auth_token') || '',
  }),

  getters: {
    isLoggedIn: (state) => !!state.token || !!state.user,
    userPhone: (state) => state.user?.phone || localStorage.getItem('user_phone') || '',
  },

  actions: {
    // 🟢 บันทึกข้อมูลเข้า Store + LocalStorage เมื่อผู้ใช้ล็อกอินสำเร็จ
    setAuth(userData, tokenVal = '') {
      const avatar = userData?.avatar
        || userData?.avatarUrl
        || userData?.avatar_url
        || userData?.avatar_img
        || userData?.picture
        || ''
      this.user = userData ? { ...userData, avatar, avatarUrl: avatar } : null
      this.token = tokenVal

      if (tokenVal) {
        localStorage.setItem('auth_token', tokenVal)
      }
      if (this.user) {
        localStorage.setItem('user_info', JSON.stringify(this.user))
        if (this.user.phone) {
          localStorage.setItem('user_phone', this.user.phone)
        }
      }
    },

    // 🟢 อัปเดตเฉพาะข้อมูล User (เช่น อัปเดตเบอร์โทรศัพท์)
    setUser(userData) {
      this.user = { ...this.user, ...userData }
      localStorage.setItem('user_info', JSON.stringify(this.user))
      if (userData?.phone) {
        localStorage.setItem('user_phone', userData.phone)
      }
    },

    // 🟢 ล้างข้อมูลทั้งหมดเมื่อกดออกจากระบบ (Logout)
    logout() {
      this.user = null
      this.token = ''
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_info')
      localStorage.removeItem('user_phone')
    },
  },

  // บันทึก State ลง LocalStorage อัตโนมัติด้วย Pinia Persistedstate
  persist: {
    key: 'fixmatch_auth',
    storage: localStorage,
  },
})

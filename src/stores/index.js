import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default store((/* { ssrContext } */) => {
  const pinia = createPinia()
  // 🟢 เพิ่ม Plugin สำหรับเซฟ State ลง localStorage อัตโนมัติ
  pinia.use(piniaPluginPersistedstate)
  return pinia
})

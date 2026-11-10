<template>
  <q-btn
    flat
    round
    dense
    :loading="isWorking"
    :icon="isPushEnabled ? 'notifications_active' : 'notifications_none'"
    :color="isPushEnabled ? 'positive' : 'primary'"
    :aria-label="isPushEnabled ? 'ปิดการแจ้งเตือน Push' : 'เปิดการแจ้งเตือน Push'"
    :title="isPushEnabled ? 'ปิดการแจ้งเตือน Push' : 'เปิดการแจ้งเตือน Push'"
    @click="togglePushNotifications"
  />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const authStore = useAuthStore()
const isWorking = ref(false)
const isPushEnabled = ref(false)
const isLoggedIn = computed(() => authStore.isLoggedIn)
const appBase = import.meta.env.BASE_URL

const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const isInstalledApp = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true

const decodeVapidKey = (base64Key) => {
  const padding = '='.repeat((4 - (base64Key.length % 4)) % 4)
  const base64 = (base64Key + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0))
}

const getRegistration = async () => {
  const workerUrl = new URL('service-worker.js', window.location.origin + appBase)
  return navigator.serviceWorker.register(workerUrl, { scope: appBase })
}

const updateSubscriptionState = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    const registration = await navigator.serviceWorker.getRegistration(appBase)
    const subscription = await registration?.pushManager.getSubscription()
    isPushEnabled.value = Boolean(subscription)
    if (subscription && isLoggedIn.value) {
      await api.post('/push/subscriptions', subscription.toJSON())
      localStorage.setItem('fixmatch_push_enabled', 'true')
    } else {
      localStorage.removeItem('fixmatch_push_enabled')
    }
  } catch (error) {
    console.error('ตรวจสอบการสมัครรับ Push notification ไม่สำเร็จ:', error)
    localStorage.removeItem('fixmatch_push_enabled')
  }
}

const showInstallInstructions = () => {
  $q.dialog({
    title: 'ติดตั้ง FixMatch บน iPhone',
    message:
      'เปิดหน้านี้ใน Safari แล้วแตะปุ่มแชร์ จากนั้นเลือก “เพิ่มไปยังหน้าจอโฮม” เปิด FixMatch จากไอคอนบนหน้าจอโฮม แล้วกดเปิดการแจ้งเตือนอีกครั้ง',
    ok: { label: 'เข้าใจแล้ว', color: 'primary', noCaps: true },
  })
}

const enablePushNotifications = async () => {
  if (!isLoggedIn.value) {
    $q.notify({ type: 'warning', message: 'กรุณาเข้าสู่ระบบก่อนเปิดการแจ้งเตือน' })
    return
  }
  if (
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    $q.notify({
      type: 'warning',
      message: 'เบราว์เซอร์นี้ไม่รองรับ Push notification กรุณาใช้ Safari เวอร์ชันล่าสุด',
      timeout: 5000,
    })
    return
  }
  if (isIOS() && !isInstalledApp()) {
    showInstallInstructions()
    return
  }

  isWorking.value = true
  try {
    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission
    if (permission !== 'granted') {
      $q.notify({
        type: 'warning',
        message: 'ยังไม่ได้อนุญาตการแจ้งเตือน กรุณาเปิดสิทธิ์ใน Settings ของ iPhone',
        timeout: 5000,
      })
      return
    }

    const registration = await getRegistration()
    const { data } = await api.get('/push/public-key')
    if (!data?.publicKey) throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง VAPID public key')

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(data.publicKey),
      })
    }
    await api.post('/push/subscriptions', subscription.toJSON())
    isPushEnabled.value = true
    localStorage.setItem('fixmatch_push_enabled', 'true')
    $q.notify({
      type: 'positive',
      message: 'เปิดการแจ้งเตือน Push แล้ว',
      caption: 'งานจองใหม่และข้อความแชทจะแจ้งเตือนเมื่อปิดหน้าเว็บ',
      timeout: 4500,
    })
  } catch (error) {
    console.error('เปิด Push notification ไม่สำเร็จ:', error)
    const message =
      error.response?.data?.detail ||
      'เปิดการแจ้งเตือนไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตและลองอีกครั้ง'
    $q.notify({ type: 'negative', message, timeout: 6000 })
  } finally {
    isWorking.value = false
  }
}

const disablePushNotifications = async () => {
  isWorking.value = true
  try {
    const registration = await navigator.serviceWorker.getRegistration(appBase)
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      await api.delete('/push/subscriptions', {
        data: { endpoint: subscription.endpoint },
      })
      await subscription.unsubscribe()
    }
    isPushEnabled.value = false
    localStorage.removeItem('fixmatch_push_enabled')
    $q.notify({ type: 'info', message: 'ปิดการแจ้งเตือน Push แล้ว', timeout: 2000 })
  } catch (error) {
    console.error('ปิด Push notification ไม่สำเร็จ:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || 'ปิดการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง',
      timeout: 5000,
    })
  } finally {
    isWorking.value = false
  }
}

const togglePushNotifications = () => {
  if (isWorking.value) return
  if (isPushEnabled.value) {
    disablePushNotifications()
  } else {
    enablePushNotifications()
  }
}

const unsubscribeForLogout = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration(appBase)
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await api.delete('/push/subscriptions', {
          data: { endpoint: subscription.endpoint },
        })
        await subscription.unsubscribe()
      }
    }
  } catch (error) {
    console.error('ปิดการแจ้งเตือนก่อนออกจากระบบไม่สำเร็จ:', error)
  } finally {
    isPushEnabled.value = false
    localStorage.removeItem('fixmatch_push_enabled')
  }
}

onMounted(updateSubscriptionState)
watch(isLoggedIn, updateSubscriptionState)
defineExpose({ unsubscribeForLogout })
</script>

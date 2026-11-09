<template>
  <q-page class="booking-waiting-page">
    <q-card flat class="waiting-card">
      <div class="waiting-icon">
        <q-spinner-dots v-if="isWaiting" size="42px" color="primary" />
        <q-icon v-else name="error_outline" size="42px" color="negative" />
      </div>

      <p class="eyebrow">หมายเลขงาน #{{ orderId }}</p>
      <h1>{{ isRejected ? 'ช่างปฏิเสธการรับงาน' : isWaiting ? 'กำลังรอช่างตอบรับงาน' : 'ตรวจสอบสถานะงานไม่สำเร็จ' }}</h1>
      <p class="waiting-description">
        {{ isRejected
          ? 'ช่างไม่สามารถรับงานนี้ได้ กรุณากลับไปเลือกช่างคนอื่นเพื่อจองบริการอีกครั้ง'
          : isWaiting
          ? 'เมื่อช่างกดรับงานแล้ว ระบบจะพาคุณไปยังหน้าติดตามช่างโดยอัตโนมัติ คุณสามารถรีโหลดหรือออกจากหน้านี้ได้ ระบบจะจำสถานะการจองไว้'
          : errorMessage }}
      </p>

      <div v-if="technician.name" class="technician-summary">
        <q-avatar size="52px">
          <img :src="technician.avatarUrl" :alt="technician.name" @error="onAvatarError" />
        </q-avatar>
        <div>
          <div class="technician-label">ช่างที่เลือก</div>
          <div class="technician-name">{{ technician.name }}</div>
        </div>
      </div>

      <div v-if="!isRejected" class="status-note">
        <q-icon :name="isWaiting ? 'schedule' : 'wifi_off'" size="18px" />
        <span>{{ isWaiting ? 'ตรวจสอบสถานะการรับงานอัตโนมัติ' : 'จะลองตรวจสอบสถานะอีกครั้งใน 5 วินาที' }}</span>
      </div>

      <q-btn v-if="isRejected" unelevated no-caps color="primary" icon="search"
        label="กลับไปเลือกช่าง" @click="returnToTechnicianSelection" />
      <q-btn v-else-if="!isWaiting" unelevated no-caps color="primary" icon="refresh"
        label="ลองตรวจสอบตอนนี้" :loading="isChecking" @click="checkBookingStatus" />
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import fixmatchService from '@/services/fixmatchService'
import { clearActiveTrackingOrder, markTechnicianAccepted, setActiveTrackingOrder } from '@/services/activeTracking'
import { normalizeTechnicianProfile } from '@/services/technicianProfile'
import { useBookingStore } from '@/stores/bookingStore'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const orderId = computed(() => String(route.params.orderId || ''))
const isWaiting = ref(true)
const isRejected = ref(false)
const isChecking = ref(false)
const errorMessage = ref('')
const technician = reactive({
  name: '',
  avatarUrl: 'https://cdn.quasar.dev/img/avatar.png',
})
let pollTimer = null

const onAvatarError = (event) => {
  event.target.src = 'https://cdn.quasar.dev/img/avatar.png'
}

const returnToTechnicianSelection = async () => {
  clearActiveTrackingOrder(orderId.value)
  await router.replace({ name: 'home' })
}

const checkBookingStatus = async () => {
  if (!orderId.value || isChecking.value) return

  isChecking.value = true
  errorMessage.value = ''
  try {
    const response = await fixmatchService.getTrackingStatus(orderId.value)
    const data = response.data?.data || response.data
    const status = String(data.status || data.job_status || '').toUpperCase()
    const profile = normalizeTechnicianProfile(data.technician || data.tech || data)
    isWaiting.value = true
    isRejected.value = false

    if (profile) {
      technician.name = profile.name
      technician.avatarUrl = profile.avatarUrl
    } else if (bookingStore.selectedTechnician) {
      technician.name = bookingStore.selectedTechnician.name || ''
      technician.avatarUrl = bookingStore.selectedTechnician.avatarUrl || technician.avatarUrl
    }

    if (['IN_PROGRESS', 'REPAIRING', 'ACCEPTED', 'COMPLETED', 'DONE', 'FINISHED'].includes(status)) {
      setActiveTrackingOrder(orderId.value)
      markTechnicianAccepted(orderId.value)
      isWaiting.value = false
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
      await router.replace({ name: 'tracking', params: { orderId: orderId.value } })
    } else if (status === 'REJECTED') {
      isWaiting.value = false
      isRejected.value = true
      clearActiveTrackingOrder(orderId.value)
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }
  } catch (error) {
    console.error('ตรวจสอบสถานะการตอบรับงานไม่สำเร็จ:', error)
    errorMessage.value = error.response?.data?.detail || 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
    isWaiting.value = false
  } finally {
    isChecking.value = false
  }
}

onMounted(() => {
  if (!orderId.value) {
    errorMessage.value = 'ไม่พบหมายเลขงานสำหรับตรวจสอบสถานะ'
    isWaiting.value = false
    return
  }

  setActiveTrackingOrder(orderId.value)
  const savedTechnician = bookingStore.selectedTechnician
  if (savedTechnician) {
    technician.name = savedTechnician.name || ''
    technician.avatarUrl = savedTechnician.avatarUrl || technician.avatarUrl
  }
  checkBookingStatus()
  pollTimer = setInterval(checkBookingStatus, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.booking-waiting-page {
  display: grid;
  min-height: calc(100vh - 50px);
  padding: 1.25rem;
  place-items: center;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(186, 230, 253, 0.55), transparent 45%),
    #f8fafc;
}

.waiting-card {
  display: flex;
  width: min(100%, 34rem);
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  text-align: center;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.waiting-icon {
  display: grid;
  width: 5rem;
  height: 5rem;
  margin-bottom: 1rem;
  place-items: center;
  border-radius: 50%;
  background: #e0f2fe;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #0284c7;
  font-size: 0.75rem;
  font-weight: 800;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-size: 1.375rem;
  font-weight: 900;
}

.waiting-description {
  margin: 0.75rem 0 1.25rem;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.7;
}

.technician-summary {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  text-align: left;
}

.technician-label {
  color: #64748b;
  font-size: 0.75rem;
}

.technician-name {
  color: #0f172a;
  font-weight: 800;
}

.status-note {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 1rem 0;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 700;
}
</style>

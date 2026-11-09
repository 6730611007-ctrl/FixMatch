<template>
  <q-page class="tracking-page font-sans">
    <div class="tracking-container">
      <!-- Top Navigation & Order Reference -->
      <div class="top-nav">
        <button v-if="isJobCompleted" @click="goToPayment" class="btn-back">
          <q-icon name="arrow_back_ios" size="14px" />
          <span>ไปหน้าชำระเงิน</span>
        </button>
        <span class="order-ref"> หมายเลขงาน: <span class="order-id">#{{ activeOrderId }}</span> </span>
      </div>

      <!-- Live Status Banner -->
      <div class="status-card">
        <div class="status-left">
          <div class="pulse-indicator">
            <span class="pulse-ring"></span>
            <span class="pulse-dot"></span>
          </div>
          <div>
            <span class="status-label">สถานะปัจจุบัน</span>
            <h2 class="status-title">{{ statusTitle }}</h2>
          </div>
        </div>
        <div v-if="hasEta" class="eta-box">
          <span class="eta-label">คาดว่าจะถึงใน</span>
          <span class="eta-value">~{{ tracking.etaMinutes }} นาที</span>
        </div>
        <div v-else class="eta-box">
          <span class="eta-label">ยังไม่มีข้อมูลตำแหน่ง GPS ของช่าง</span>
        </div>
      </div>

      <!-- 🗺️ แผนที่จริง (Leaflet Map) -->
      <div v-if="hasCustomerCoordinates" class="map-wrapper">
        <div ref="mapElement" class="real-map-view"></div>
      </div>
      <div v-else class="tracking-reminder">
        ยังไม่มีพิกัด GPS ของสถานที่ให้บริการ แผนที่จะแสดงเมื่อมีการระบุพิกัดตอนจอง
      </div>

      <!-- Technician Profile & Quick Actions -->
      <div class="card-box tech-card">
        <div class="tech-info-wrapper">
          <div class="tech-avatar-group">
            <q-avatar size="52px" class="tech-avatar">
              <img :src="getTechnicianAvatar(tracking)" @error="onImageError" :alt="tracking.techName" />
            </q-avatar>
            <div>
              <div class="tech-name-row">
                <h3 class="tech-name">{{ tracking.techName }}</h3>
                <q-icon name="verified" size="16px" class="verified-icon" />
              </div>
              <div class="tech-rating">
                <q-icon name="star" size="14px" />
                <span>{{ tracking.rating }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Contact Actions -->
          <div class="contact-actions">

            <q-btn unelevated no-caps class="btn-chat" @click="openChat"> แชทกับช่าง </q-btn>
          </div>
        </div>
      </div>

      <!-- Service Timeline Steps -->
      <div class="card-box timeline-card">
        <h4 class="timeline-title">ลำดับขั้นตอนการให้บริการ</h4>

        <div class="timeline-wrapper">
          <div v-for="(step, idx) in serviceSteps" :key="idx" class="timeline-item">
            <div class="timeline-dot" :class="{ completed: step.completed, current: step.current }">
              <div v-if="step.completed" class="dot-inner"></div>
            </div>
            <div class="step-info">
              <p class="step-title" :class="{ 'active-text': step.current || step.completed }">{{ step.title }}</p>
              <p class="step-subtitle">{{ step.subtitle }}</p>
            </div>
            <span class="step-time">{{ step.time }}</span>
          </div>
        </div>
      </div>

      <!-- Payment is available after the technician completes the job -->
      <div v-if="isJobCompleted && hasServiceInvoice" class="pt-2">
        <q-btn unelevated no-caps class="w-full py-3.5 text-white font-semibold rounded-xl"
          style="background-color: #0284c7" @click="goToPayment">
          ไปหน้าชำระเงิน
        </q-btn>
      </div>
      <div v-else-if="isJobCompleted" class="tracking-reminder">
        ช่างปิดงานแล้ว กำลังรอรายละเอียดบิลเพื่อเปิดหน้าชำระเงิน
      </div>
      <div v-else class="tracking-reminder">
        หน้านี้จะคงอยู่จนกว่าช่างจะทำงานเสร็จ ระบบจะบันทึกสถานะไว้แม้ปิดหรือรีโหลดเว็บไซต์
      </div>
    </div>

    <!-- Live Chat Modal Sheet Integration -->
    <LiveChatSheet v-model="isChatOpen" :orderId="activeOrderId" :technician="{
      name: tracking.techName,
      avatarUrl: tracking.avatarUrl,
      specialty: 'ช่างผู้เชี่ยวชาญประจำพื้นที่',
      phone: tracking.phone,
    }" @invoice-received="handleInvoiceReceived" />
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import fixmatchService from '@/services/fixmatchService'
import { clearActiveTrackingOrder } from '@/services/activeTracking'
import { normalizeTechnicianProfile } from '@/services/technicianProfile'
import { createInvoicePdf } from '@/services/invoicePdf'
import LiveChatSheet from '../components/chat/LiveChatSheet.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  orderId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['back', 'complete-job'])

const route = useRoute()
const router = useRouter()
const isChatOpen = ref(false)
const mapElement = ref(null)
let isTrackingPageActive = false

const activeOrderId = computed(() => {
  const idFromProp = props.orderId
  const idFromRoute = route?.params?.orderId
  const idFromStorage = localStorage.getItem('current_order_id')

  const finalId = idFromProp || idFromRoute || idFromStorage || ''

  if (finalId) {
    localStorage.setItem('current_order_id', finalId)
  }

  return finalId
})

const openChat = () => {
  isChatOpen.value = true
}

const DEFAULT_AVATAR = 'https://cdn.quasar.dev/img/avatar.png'

const getTechnicianAvatar = (data) => {
  return normalizeTechnicianProfile(data)?.avatarUrl || DEFAULT_AVATAR
}

const onImageError = (evt) => {
  evt.target.src = DEFAULT_AVATAR
}

const snapshotKey = computed(() => `fixmatch_tracking_snapshot_${encodeURIComponent(activeOrderId.value)}`)
const loadTrackingSnapshot = () => {
  if (!activeOrderId.value) return {}
  try {
    const snapshot = JSON.parse(localStorage.getItem(snapshotKey.value) || '{}')
    return snapshot && typeof snapshot === 'object' ? snapshot : {}
  } catch (error) {
    console.error('อ่านข้อมูลติดตามงานที่บันทึกไว้ไม่สำเร็จ:', error)
    return {}
  }
}

const initialSnapshot = loadTrackingSnapshot()
const tracking = reactive({
  techName: initialSnapshot.techName || 'กำลังโหลดข้อมูลช่าง...',
  avatarUrl: initialSnapshot.avatarUrl || DEFAULT_AVATAR,
  phone: initialSnapshot.phone || '',
  rating: initialSnapshot.rating ?? 0,
  etaMinutes: null,
  customerLat: null,
  customerLng: null,
  techLat: null,
  techLng: null,
  status: initialSnapshot.status || 'CONFIRMED',
  paymentConfirmed: initialSnapshot.paymentConfirmed || false,
  paymentConfirmedAt: initialSnapshot.paymentConfirmedAt || null,
  statusHistory: [],
})

const hasCustomerCoordinates = computed(() => Number.isFinite(tracking.customerLat)
  && Number.isFinite(tracking.customerLng))
const hasTechnicianCoordinates = computed(() => Number.isFinite(tracking.techLat)
  && Number.isFinite(tracking.techLng))
const hasEta = computed(() => tracking.status === 'IN_PROGRESS' && Number.isFinite(tracking.etaMinutes))
const isJobCompleted = computed(() => ['COMPLETED', 'DONE', 'FINISHED'].includes(tracking.status))
const isRepairing = computed(() => tracking.status === 'REPAIRING')
const hasServiceInvoice = ref(false)
const isOpeningPayment = ref(false)
const statusTitle = computed(() => {
  if (isJobCompleted.value) {
    return tracking.paymentConfirmed ? 'ให้บริการเสร็จสิ้น' : 'ช่างทำงานเสร็จเรียบร้อยแล้ว'
  }
  if (tracking.status === 'CONFIRMED' || tracking.status === 'PENDING') return 'กำลังรอช่างยืนยันและเดินทาง'
  if (isRepairing.value) return 'ช่างกำลังตรวจเช็คและซ่อมแซม'
  return 'ช่างกำลังเดินทางไปยังจุดหมาย'
})

let mapInstance = null
let techMarker = null
let customerMarker = null
let pollInterval = null

const fetchTrackingData = async () => {
  const targetOrderId = activeOrderId.value
  if (!targetOrderId || !isTrackingPageActive) return
  try {
    const response = await fixmatchService.getTrackingStatus(targetOrderId)
    if (!isTrackingPageActive) return

    const data = response.data?.data || response.data
    const technician = normalizeTechnicianProfile(data.technician || data.tech || data)
    const status = String(data.status || data.job_status || data.jobStatus || tracking.status).toUpperCase()

    tracking.techName = technician?.name || data.techName || data.tech_name || tracking.techName
    tracking.avatarUrl = technician?.avatarUrl || data.avatarUrl || data.avatar_url || data.avatar || tracking.avatarUrl
    tracking.phone = technician?.phone || data.phone || tracking.phone
    tracking.rating = data.rating ?? tracking.rating
    tracking.etaMinutes = data.etaMinutes ?? data.eta_minutes ?? null
    tracking.customerLat = data.customerLat ?? data.customer_lat ?? null
    tracking.customerLng = data.customerLng ?? data.customer_lng ?? null
    tracking.techLat = data.techLat ?? data.tech_lat ?? null
    tracking.techLng = data.techLng ?? data.tech_lng ?? null
    tracking.status = status
    tracking.statusHistory = Array.isArray(data.statusHistory) ? data.statusHistory : []
    tracking.paymentConfirmed = Boolean(data.paymentConfirmed)
    tracking.paymentConfirmedAt = data.paymentConfirmedAt || null

    if (['COMPLETED', 'DONE', 'FINISHED'].includes(status)) {
      const invoiceReady = await saveInvoiceFromTrackingData(data, targetOrderId)
      if (invoiceReady || hasServiceInvoice.value) {
        await openPaymentPage()
      } else {
        isChatOpen.value = true
      }
    }

    if (!isTrackingPageActive) return
    await nextTick()
    if (!isTrackingPageActive) return
    try {
      localStorage.setItem(snapshotKey.value, JSON.stringify(tracking))
    } catch (storageError) {
      console.error('บันทึกข้อมูลติดตามงานในอุปกรณ์ไม่สำเร็จ:', storageError)
    }

    updateMapMarkers()
  } catch (error) {
    if (!isTrackingPageActive) return
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสถานะ:', error)
    updateMapMarkers()
  }
}

const normalizeInvoiceItems = (items) => {
  if (!Array.isArray(items)) return []

  return items.map(item => ({
    description: String(item.description || item.label || item.name || item.work || '').trim(),
    amount: Number(item.amount ?? item.price ?? item.cost ?? 0),
  })).filter(item => item.description && Number.isFinite(item.amount) && item.amount >= 0)
}

const saveInvoiceMessage = (message) => {
  const key = `fixmatch_chat_invoices_${encodeURIComponent(String(activeOrderId.value))}`
  const savedMessages = JSON.parse(localStorage.getItem(key) || '[]')
  if (!Array.isArray(savedMessages)) throw new Error('ข้อมูลบิลที่บันทึกไว้ไม่ถูกต้อง')

  const updatedMessages = [
    ...savedMessages.filter(item => item.id !== message.id),
    message,
  ]
  localStorage.setItem(key, JSON.stringify(updatedMessages))
  hasServiceInvoice.value = true
}

const saveInvoiceFromTrackingData = async (data, orderId) => {
  const invoiceData = data.invoice || data.invoice_data || data
  const items = normalizeInvoiceItems(
    invoiceData.items || invoiceData.work_items || invoiceData.service_items
      || data.work_items || data.service_items || data.items,
  )
  if (!items.length) return false

  const technician = normalizeTechnicianProfile(data.technician || data.tech || invoiceData.technician)
  const total = Number(invoiceData.total ?? invoiceData.total_amount ?? data.total_amount
    ?? items.reduce((sum, item) => sum + item.amount, 0))
  if (!Number.isFinite(total) || total < 0) return false

  try {
    const pdf = invoiceData.pdfBase64 || invoiceData.pdf_base64
      ? {
          fileName: invoiceData.fileName || invoiceData.file_name || `FixMatch-${orderId}-invoice.pdf`,
          pdfBase64: invoiceData.pdfBase64 || invoiceData.pdf_base64,
        }
      : await createInvoicePdf({
          orderNo: orderId,
          job: { issueDescription: data.issueDescription || data.issue_description },
          technicianName: technician?.name || tracking.techName,
          items,
          total,
        })

    saveInvoiceMessage({
      id: `${orderId}-invoice`,
      orderId,
      sender: 'tech',
      type: 'invoice',
      text: 'ส่งใบสรุปรายการซ่อมและค่าบริการแล้ว',
      invoice: {
        ...pdf,
        items,
        total,
        technician: technician || {
          name: tracking.techName,
          avatarUrl: tracking.avatarUrl,
          phone: tracking.phone,
        },
      },
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    })
    return true
  } catch (error) {
    console.error('ไม่สามารถเตรียมใบแจ้งค่าบริการได้:', error)
    return false
  }
}

const handleInvoiceReceived = (message) => {
  if (String(message.orderId || activeOrderId.value) !== String(activeOrderId.value)) return

  try {
    saveInvoiceMessage(message)
    if (isJobCompleted.value) openPaymentPage()
  } catch (error) {
    console.error('ไม่สามารถบันทึกใบแจ้งค่าบริการที่ได้รับจากแชทได้:', error)
  }
}

const openPaymentPage = async () => {
  if (isOpeningPayment.value || !hasServiceInvoice.value) return
  isOpeningPayment.value = true
  clearActiveTrackingOrder(activeOrderId.value)
  emit('complete-job')
  if (!props.orderId) {
    await router.push({ name: 'summary' })
  }
}

const goToPayment = () => {
  if (!isJobCompleted.value || !hasServiceInvoice.value) return

  clearActiveTrackingOrder(activeOrderId.value)
  openPaymentPage()
}

const initMap = () => {
  const container = mapElement.value
  if (mapInstance || !hasCustomerCoordinates.value || !container?.isConnected) return

  mapInstance = L.map(container).setView([tracking.customerLat, tracking.customerLng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance)

  customerMarker = L.marker([tracking.customerLat, tracking.customerLng]).addTo(mapInstance)
    .bindPopup('<b>บ้านของคุณ (จุดหมาย)</b>').openPopup()

  if (hasTechnicianCoordinates.value) {
    techMarker = L.marker([tracking.techLat, tracking.techLng]).addTo(mapInstance)
      .bindPopup('<b>ตำแหน่งช่างเทคนิค</b>')
  }
}

const updateMapMarkers = () => {
  if (!isTrackingPageActive) return

  if (!hasCustomerCoordinates.value) {
    if (mapInstance) mapInstance.remove()
    mapInstance = null
    customerMarker = null
    techMarker = null
    return
  }

  initMap()
  if (!mapInstance) return

  if (customerMarker) {
    customerMarker.setLatLng([tracking.customerLat, tracking.customerLng])
  }
  if (hasTechnicianCoordinates.value && techMarker) {
    techMarker.setLatLng([tracking.techLat, tracking.techLng])
    mapInstance.panTo([tracking.techLat, tracking.techLng])
  } else if (hasTechnicianCoordinates.value) {
    techMarker = L.marker([tracking.techLat, tracking.techLng]).addTo(mapInstance)
      .bindPopup('<b>ตำแหน่งช่างเทคนิค</b>')
  } else if (techMarker) {
    techMarker.remove()
    techMarker = null
  }
}

const getStatusChangedAt = (status) => (
  [...tracking.statusHistory].reverse().find(entry => entry.status === status)?.changedAt || null
)

const formatStatusTime = (value) => {
  if (!value) return '--:--'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '--:--'
  return new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' }).format(date)
}

const serviceSteps = computed(() => {
  const stageIndex = isJobCompleted.value ? 3
    : isRepairing.value ? 2
      : tracking.status === 'IN_PROGRESS' ? 1
        : 0
  const acceptedAt = getStatusChangedAt('IN_PROGRESS')
  const workStartedAt = getStatusChangedAt('REPAIRING')
  const completedAt = getStatusChangedAt('COMPLETED')
  const steps = [
    {
      title: 'ยืนยันการรับงาน',
      subtitle: 'ช่างรับทราบและจัดเตรียมอุปกรณ์',
      time: formatStatusTime(acceptedAt),
    },
    {
      title: 'กำลังเดินทาง',
      subtitle: 'ช่างมุ่งหน้าไปยังสถานที่ของคุณ',
      time: formatStatusTime(workStartedAt),
    },
    {
      title: 'เริ่มตรวจเช็คและซ่อมแซม',
      subtitle: 'ประเมินหน้างานจริงร่วมกับลูกค้า',
      time: formatStatusTime(workStartedAt),
    },
    {
      title: 'เสร็จสิ้นบริการ',
      subtitle: 'ชำระเงินและให้คะแนนความพึงพอใจ',
      time: formatStatusTime(completedAt),
    },
  ]

  return steps.map((step, index) => ({
    ...step,
    completed: isJobCompleted.value || index < stageIndex,
    current: !isJobCompleted.value && index === stageIndex,
  }))
})

onMounted(() => {
  isTrackingPageActive = true
  if (!activeOrderId.value) {
    console.error('ไม่พบหมายเลขงานสำหรับแสดงหน้าติดตาม')
    return
  }
  try {
    const savedMessages = JSON.parse(
      localStorage.getItem(`fixmatch_chat_invoices_${encodeURIComponent(String(activeOrderId.value))}`) || '[]',
    )
    hasServiceInvoice.value = Array.isArray(savedMessages)
      && savedMessages.some(message => message.type === 'invoice' && message.invoice?.items?.length)
  } catch (error) {
    console.error('อ่านบิลที่บันทึกไว้ไม่สำเร็จ:', error)
  }
  fetchTrackingData()
  pollInterval = setInterval(fetchTrackingData, 10000)
})

onUnmounted(() => {
  isTrackingPageActive = false
  if (pollInterval) clearInterval(pollInterval)
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
  mapElement.value = null
})
</script>

<style scoped>
.tech-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
}

.tracking-page {
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 1.5rem 1rem;
}

.tracking-container {
  max-width: 672px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.tracking-reminder {
  padding: 0.875rem 1rem;
  border: 1px solid #bae6fd;
  border-radius: 0.875rem;
  background-color: #f0f9ff;
  color: #0369a1;
  font-size: 0.8125rem;
  text-align: center;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  background: none;
  border: none;
  cursor: pointer;
}

.order-ref {
  font-size: 0.75rem;
  color: #94a3b8;
}

.order-id {
  font-family: monospace;
  color: #334155;
  font-weight: 600;
}

.status-card {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #0369a1;
}

.status-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.eta-box {
  text-align: right;
}

.eta-label {
  font-size: 0.625rem;
  color: #94a3b8;
  text-transform: uppercase;
  font-weight: 700;
}

.eta-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.map-wrapper {
  width: 100%;
  height: 300px;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #cbd5e1;
}

.real-map-view {
  width: 100%;
  height: 100%;
}

.card-box {
  background-color: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 1rem;
  padding: 1.25rem;
}

.tech-info-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tech-avatar-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.contact-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-circle-call {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
  text-decoration: none;
}

.btn-chat {
  padding: 0.5rem 1rem !important;
  background-color: #0284c7 !important;
  color: #ffffff !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  border-radius: 0.75rem !important;
}

.timeline-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  margin: 0 0 1rem 0;
}

.timeline-wrapper {
  position: relative;
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timeline-wrapper::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background-color: #f1f5f9;
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.timeline-dot {
  position: absolute;
  left: -1.5rem;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-dot.current {
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
}

.timeline-dot.completed {
  border-color: #0284c7;
  background-color: #0284c7;
}

.dot-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ffffff;
}

.step-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  margin: 0;
}

.step-title.active-text {
  color: #0f172a;
}

.step-subtitle {
  font-size: 0.6875rem;
  color: #94a3b8;
  margin: 0.375rem 0 0 0;
}

.step-time {
  font-size: 0.625rem;
  font-family: monospace;
  color: #94a3b8;
}
</style>
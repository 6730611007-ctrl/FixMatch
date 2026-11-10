<template>
  <q-dialog
    v-model="isOpen"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="chat-card font-sans" @pointerdown="unlockNotificationSound">
      <!-- Drag Handle for Mobile -->
      <div class="drag-handle-container">
        <div class="drag-handle"></div>
      </div>

      <!-- Chat Header -->
      <div class="chat-header">
        <div class="header-profile">
          <div class="avatar-badge-wrapper">
            <q-avatar size="42px">
              <BackendImage
                :src="getValidAvatar(technician?.avatarUrl)"
                :alt="isTechSide ? 'รูปโปรไฟล์ลูกค้า' : 'รูปโปรไฟล์ช่าง'"
              />
            </q-avatar>
            <span
              class="online-indicator"
              :class="isOnline ? 'indicator-online' : 'indicator-offline'"
            ></span>
          </div>

          <div class="profile-copy">
            <div class="tech-name-wrapper">
              <h3 class="tech-name">{{ technician?.name || (isTechSide ? 'ลูกค้า' : 'ช่าง') }}</h3>
              <q-icon name="verified" size="16px" class="icon-verified" />
            </div>
            <p class="tech-subtext">
              <span v-if="technician?.specialty" class="profile-specialty">
                {{ technician.specialty }} ·
              </span>
              <span class="connection-status" :class="isOnline ? 'online-text' : 'offline-text'">
                <span class="connection-dot"></span>
                {{ isOnline ? 'กำลังออนไลน์' : 'แชทไม่พร้อมใช้งาน' }}
              </span>
            </p>
          </div>
        </div>

        <div class="header-actions">
          <q-btn
            flat
            round
            dense
            :icon="isSoundEnabled ? 'volume_up' : 'volume_off'"
            :color="isSoundEnabled ? 'primary' : 'grey-6'"
            :aria-label="isSoundEnabled ? 'ปิดเสียงแจ้งเตือนแชท' : 'เปิดเสียงแจ้งเตือนแชท'"
            :title="isSoundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'"
            @click="toggleSoundNotifications"
          />
          <q-btn
            flat
            round
            dense
            :icon="isBrowserNotificationEnabled ? 'notifications_active' : 'notifications_none'"
            :color="isBrowserNotificationEnabled ? 'primary' : 'grey-6'"
            :aria-label="
              isBrowserNotificationEnabled
                ? 'ปิดการแจ้งเตือนบนอุปกรณ์'
                : 'เปิดการแจ้งเตือนบนอุปกรณ์'
            "
            :title="
              isBrowserNotificationEnabled
                ? 'ปิดการแจ้งเตือนบนอุปกรณ์'
                : 'เปิดการแจ้งเตือนบนอุปกรณ์'
            "
            @click="toggleBrowserNotifications"
          />
          <a :href="`tel:${technician?.phone}`" class="call-btn">
            <q-icon name="call" size="18px" />
          </a>
          <q-btn icon="close" flat round dense color="grey-7" v-close-popup />
        </div>
      </div>

      <!-- Quick Issue Context Banner -->
      <div class="issue-banner">
        <div class="issue-info">
          <q-icon name="build" size="14px" class="icon-build" />
          <span class="issue-label">เคสซ่อม:</span>
          <span class="issue-title">{{ issueTitle }}</span>
        </div>
        <span class="issue-ref-code">งาน #{{ orderId }}</span>
      </div>

      <!-- Messages Body -->
      <div ref="chatContainerRef" class="messages-body">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-row"
          :class="{
            'align-me': isMyMessage(msg),
            'align-other': !isMyMessage(msg) && msg.sender !== 'system',
            'align-system': msg.sender === 'system',
          }"
        >
          <!-- System Message -->
          <div v-if="msg.sender === 'system'" class="system-msg-wrapper">
            <span class="system-msg-badge">{{ msg.text }}</span>
          </div>

          <!-- User or Tech Message -->
          <template v-else>
            <div class="message-content" :class="{ 'row-reverse': isMyMessage(msg) }">
              <!-- รูปโปรไฟล์ฝั่งคู่สนทนาจะแสดงเฉพาะฝั่งซ้าย -->
              <q-avatar v-if="!isMyMessage(msg)" size="28px" class="tech-msg-avatar">
                <BackendImage
                  :src="getValidAvatar(technician?.avatarUrl)"
                  :alt="isTechSide ? 'รูปโปรไฟล์ลูกค้า' : 'รูปโปรไฟล์ช่าง'"
                />
              </q-avatar>

              <div class="bubble-group" :class="{ 'items-end': isMyMessage(msg) }">
                <div
                  v-if="msg.text"
                  class="message-bubble"
                  :class="isMyMessage(msg) ? 'bubble-user' : 'bubble-tech'"
                >
                  {{ msg.text }}
                </div>
                <div v-if="msg.imageUrl" class="image-bubble">
                  <img :src="msg.imageUrl" class="chat-attached-img" alt="Attachment" />
                </div>
                <div v-if="msg.type === 'invoice' && msg.invoice" class="invoice-bubble">
                  <div class="invoice-card-title">
                    <q-icon name="picture_as_pdf" color="negative" size="24px" />
                    <div>
                      <div class="text-weight-bold">ใบสรุปรายการซ่อม</div>
                      <div class="text-caption">
                        ยอดรวม ฿{{ formatCurrency(msg.invoice.total) }}
                      </div>
                    </div>
                  </div>
                  <div v-for="(item, index) in msg.invoice.items" :key="index" class="invoice-line">
                    <span>{{ item.description }}</span>
                    <span>฿{{ formatCurrency(item.amount) }}</span>
                  </div>
                  <q-btn
                    unelevated
                    no-caps
                    color="primary"
                    icon="download"
                    label="ดาวน์โหลด PDF"
                    class="full-width q-mt-sm"
                    @click="downloadInvoice(msg.invoice)"
                  />
                </div>
                <div v-if="msg.type === 'receipt' && msg.receipt" class="invoice-bubble">
                  <div class="invoice-card-title">
                    <q-icon name="task_alt" color="positive" size="24px" />
                    <div>
                      <div class="text-weight-bold">ใบยืนยันการชำระเงินสด</div>
                      <div class="text-caption">
                        ยอดรับชำระ ฿{{ formatCurrency(msg.receipt.total) }}
                      </div>
                    </div>
                  </div>
                  <div class="text-caption text-grey-7">วันที่ชำระ: {{ msg.receipt.paidAt }}</div>
                  <q-btn
                    unelevated
                    no-caps
                    color="positive"
                    icon="download"
                    label="ดาวน์โหลดใบยืนยัน PDF"
                    class="full-width q-mt-sm"
                    @click="downloadInvoice(msg.receipt)"
                  />
                </div>
                <div class="message-time">
                  {{ msg.time }}
                  <span v-if="msg.deliveryStatus === 'sending'"> • กำลังส่ง</span>
                  <span v-else-if="msg.deliveryStatus === 'failed'" class="text-negative">
                    • ส่งไม่สำเร็จ</span
                  >
                  <q-btn
                    v-if="msg.deliveryStatus === 'failed'"
                    flat
                    dense
                    no-caps
                    color="negative"
                    label="ส่งอีกครั้ง"
                    @click="retryMessage(msg)"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Quick Replies Carousel -->
      <div class="quick-replies-bar no-scrollbar">
        <button
          v-for="(quickText, idx) in quickReplies"
          :key="idx"
          @click="sendQuickReply(quickText)"
          class="quick-reply-btn"
        >
          {{ quickText }}
        </button>
      </div>

      <!-- Input Footer -->
      <div class="chat-footer">
        <span class="composer-hint">พิมพ์ข้อความถึง{{ isTechSide ? 'ลูกค้า' : 'ช่าง' }}</span>
        <q-form @submit.prevent="sendMessage" class="chat-form">
          <q-btn
            flat
            round
            dense
            icon="photo_camera"
            color="grey-7"
            class="action-btn"
            @click="triggerImageUpload"
          />
          <input
            type="file"
            ref="fileInputRef"
            accept="image/*"
            class="file-input-hidden"
            @change="handleImageSelected"
          />

          <q-input
            v-model="inputText"
            dense
            outlined
            :placeholder="isTechSide ? 'พิมพ์ข้อความคุยกับลูกค้า...' : 'พิมพ์ข้อความคุยกับช่าง...'"
            class="chat-input"
            @keydown.enter.prevent="sendMessage"
          />
          <q-btn
            type="button"
            unelevated
            no-caps
            icon="send"
            label="ส่ง"
            color="primary"
            :disable="!inputText.trim()"
            aria-label="ส่งข้อความ"
            class="send-btn"
            @click="sendMessage"
          />
        </q-form>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { api, SERVER_URL } from '@/boot/axios'
import { createPaymentReceiptPdf } from '@/services/invoicePdf'
import { getBackendUploadUrl } from '@/services/technicianProfile'
import BackendImage from '@/components/BackendImage.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderId: { type: String, default: '' },
  isTechSide: { type: Boolean, default: false },
  pendingInvoice: { type: Object, default: null },
  pendingReceipt: { type: Object, default: null },
  technician: Object,
  issueTitle: String,
})

const emit = defineEmits(['update:modelValue', 'invoice-received'])

const $q = useQuasar()
const isOpen = ref(props.modelValue)
const inputText = ref('')
const chatContainerRef = ref(null)
const fileInputRef = ref(null)
const isOnline = ref(false)
const isSoundEnabled = ref(localStorage.getItem('fixmatch_chat_sound_enabled') !== 'false')
const isBrowserNotificationEnabled = ref(
  'Notification' in window &&
    window.Notification.permission === 'granted' &&
    localStorage.getItem('fixmatch_chat_browser_notifications') !== 'false',
)

let websocket = null
let notificationAudioContext = null
const AudioContextClass = window.AudioContext || window.webkitAudioContext

let activeMessageOrderId = props.orderId

watch(
  () => [props.modelValue, props.orderId],
  ([isVisible, orderId], [, previousOrderId] = []) => {
    isOpen.value = isVisible
    const orderChanged = orderId !== previousOrderId

    if (orderChanged) {
      closeWebSocket()
      messages.value = [messages.value[0]]
      activeMessageOrderId = orderId
    }

    if (isVisible) {
      const savedInvoices = getSavedInvoices(orderId)
      const currentMessages = activeMessageOrderId === orderId ? messages.value.slice(1) : []
      messages.value = [messages.value[0], ...currentMessages]
      for (const message of savedInvoices) mergeMessage(message)
      activeMessageOrderId = orderId
      loadChatMessages(orderId)
      scrollToBottom()
    }

    if (orderId && !websocket) initWebSocket()
  },
)

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

const sentDocumentIds = new Set()
const sendingDocumentIds = new Set()
const trySendPendingDocuments = () => {
  const pendingDocuments = [
    { document: props.pendingInvoice, type: 'invoice' },
    { document: props.pendingReceipt, type: 'receipt' },
  ]

  for (const { document, type } of pendingDocuments) {
    if (!document || sentDocumentIds.has(document.id) || sendingDocumentIds.has(document.id))
      continue

    const messageData = {
      id: document.id,
      orderId: document.orderId || props.orderId,
      sender: props.isTechSide ? 'tech' : 'user',
      type,
      text:
        type === 'receipt'
          ? 'ยืนยันการชำระเงินสดแล้ว ส่งใบยืนยันการชำระเงิน'
          : 'ส่งใบสรุปรายการซ่อมและค่าบริการแล้ว',
      [type]: {
        fileName: document.fileName,
        pdfBase64: document.pdfBase64,
        items: document.items,
        total: document.total,
        paidAt: document.paidAt,
        technician: document.technician,
      },
      time: getCurrentTime(),
    }

    if (messages.value.some((message) => message.id === messageData.id)) {
      sentDocumentIds.add(document.id)
      continue
    }

    sendingDocumentIds.add(document.id)
    sendChatMessage(messageData)
      .then((success) => {
        if (success) sentDocumentIds.add(document.id)
      })
      .finally(() => sendingDocumentIds.delete(document.id))
  }
}

watch(() => [props.pendingInvoice, props.pendingReceipt], trySendPendingDocuments)

// 🟢 ตรวจสอบข้อความว่าเป็นของฝั่งเราหรือไม่ โดยเทียบกับบทบาทปัจจุบัน (isTechSide)
const isMyMessage = (msg) => {
  if (msg.sender === 'system') return false
  // ถ้าเปิดจากฝั่งช่าง (isTechSide = true) ข้อความที่เป็นของช่างถือเป็นของเรา (อยู่ขวา)
  // ถ้าเปิดจากฝั่งลูกค้า (isTechSide = false) ข้อความที่เป็นของ user ถือเป็นของเรา (อยู่ขวา)
  return props.isTechSide ? msg.sender === 'tech' : msg.sender === 'user'
}

const unlockNotificationSound = () => {
  if (!isSoundEnabled.value || !AudioContextClass) return

  try {
    notificationAudioContext ||= new AudioContextClass()
    if (notificationAudioContext.state === 'suspended') {
      notificationAudioContext.resume().catch((error) => {
        console.warn('เปิดเสียงแจ้งเตือนแชทไม่สำเร็จ:', error)
      })
    }
  } catch (error) {
    console.warn('เตรียมเสียงแจ้งเตือนแชทไม่สำเร็จ:', error)
  }
}

const playNotificationSound = () => {
  if (!isSoundEnabled.value || !AudioContextClass) return

  try {
    notificationAudioContext ||= new AudioContextClass()
    const playChime = () => {
      const context = notificationAudioContext
      const now = context.currentTime
      const gain = context.createGain()
      const oscillator = context.createOscillator()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, now)
      oscillator.frequency.setValueAtTime(1174.66, now + 0.11)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.33)
      oscillator.onended = () => {
        oscillator.disconnect()
        gain.disconnect()
      }
    }

    if (notificationAudioContext.state === 'suspended') {
      notificationAudioContext
        .resume()
        .then(playChime)
        .catch((error) => {
          console.warn('เล่นเสียงแจ้งเตือนแชทไม่สำเร็จ:', error)
        })
    } else {
      playChime()
    }
  } catch (error) {
    console.warn('เล่นเสียงแจ้งเตือนแชทไม่สำเร็จ:', error)
  }
}

const toggleSoundNotifications = () => {
  isSoundEnabled.value = !isSoundEnabled.value
  localStorage.setItem('fixmatch_chat_sound_enabled', String(isSoundEnabled.value))
  if (isSoundEnabled.value) unlockNotificationSound()
  $q.notify({
    type: 'info',
    message: isSoundEnabled.value ? 'เปิดเสียงแจ้งเตือนแชทแล้ว' : 'ปิดเสียงแจ้งเตือนแชทแล้ว',
    icon: isSoundEnabled.value ? 'volume_up' : 'volume_off',
    timeout: 1800,
  })
}

const toggleBrowserNotifications = async () => {
  if (isBrowserNotificationEnabled.value) {
    isBrowserNotificationEnabled.value = false
    localStorage.setItem('fixmatch_chat_browser_notifications', 'false')
    $q.notify({ type: 'info', message: 'ปิดการแจ้งเตือนบนอุปกรณ์แล้ว', timeout: 1800 })
    return
  }

  if (!('Notification' in window)) {
    $q.notify({ type: 'warning', message: 'เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนบนอุปกรณ์' })
    return
  }

  try {
    const permission =
      window.Notification.permission === 'default'
        ? await window.Notification.requestPermission()
        : window.Notification.permission
    if (permission !== 'granted') {
      $q.notify({
        type: 'warning',
        message: 'ยังไม่ได้รับอนุญาต กรุณาเปิดการแจ้งเตือนในการตั้งค่าเบราว์เซอร์',
      })
      return
    }

    isBrowserNotificationEnabled.value = true
    localStorage.setItem('fixmatch_chat_browser_notifications', 'true')
    $q.notify({ type: 'positive', message: 'เปิดการแจ้งเตือนบนอุปกรณ์แล้ว', timeout: 1800 })
  } catch (error) {
    console.warn('ขออนุญาตแจ้งเตือนบนอุปกรณ์ไม่สำเร็จ:', error)
    $q.notify({ type: 'negative', message: 'เปิดการแจ้งเตือนบนอุปกรณ์ไม่สำเร็จ' })
  }
}

const getNotificationBody = (message) => {
  if (message.type === 'invoice') return 'ส่งใบสรุปรายการซ่อมและค่าบริการ'
  if (message.type === 'receipt') return 'ส่งใบยืนยันการชำระเงิน'
  if (message.type === 'image' || message.imageUrl) return 'ส่งรูปภาพ'
  const text = String(message.text || '').trim()
  return text ? text.slice(0, 120) : 'ส่งข้อความใหม่'
}

const notifyIncomingMessage = (message) => {
  if (!message.sender || message.sender === 'system' || isMyMessage(message)) return

  if (localStorage.getItem('fixmatch_push_enabled') === 'true') return

  if (message.id !== undefined && message.id !== null) {
    const dedupeKey = `fixmatch_chat_notified_${props.orderId}_${encodeURIComponent(message.id)}`
    if (sessionStorage.getItem(dedupeKey)) return
    sessionStorage.setItem(dedupeKey, 'true')
    window.setTimeout(() => sessionStorage.removeItem(dedupeKey), 60000)
  }

  const senderName = props.isTechSide ? 'ลูกค้า' : 'ช่าง'
  const body = getNotificationBody(message)
  playNotificationSound()
  $q.notify({
    type: 'info',
    position: $q.screen.lt.md ? 'top' : 'top-right',
    message: `ข้อความใหม่จาก${senderName}`,
    caption: body,
    icon: 'mark_chat_unread',
    timeout: 4500,
    classes: 'fixmatch-chat-notification',
    actions: [{ icon: 'close', color: 'grey-7', round: true }],
  })

  if (
    isBrowserNotificationEnabled.value &&
    document.visibilityState === 'hidden' &&
    'Notification' in window &&
    window.Notification.permission === 'granted'
  ) {
    try {
      const notification = new window.Notification(`ข้อความใหม่จาก${senderName}`, {
        body,
        icon: `${import.meta.env.BASE_URL}icons/favicon-96x96.png`,
        tag: `fixmatch-chat-${props.orderId}`,
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.warn('แสดงการแจ้งเตือนบนอุปกรณ์ไม่สำเร็จ:', error)
    }
  }
}

const initWebSocket = () => {
  if (websocket || !props.orderId) return

  const token = localStorage
    .getItem('auth_token')
    ?.replace(/^Bearer\s+/i, '')
    .trim()
  if (!token) {
    isOnline.value = false
    return
  }
  const wsUrl = new URL(`/ws/chat/${encodeURIComponent(props.orderId)}`, SERVER_URL)
  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  wsUrl.searchParams.set('token', token)

  websocket = new WebSocket(wsUrl)

  websocket.onopen = () => {
    isOnline.value = true
    console.log('เชื่อมต่อ WebSocket สำเร็จ!')
    trySendPendingDocuments()
  }

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.orderId && String(data.orderId) !== String(props.orderId)) return
    if (data.type === 'invoice' || data.type === 'receipt') {
      persistChatDocument(data)
    }
    const isNewMessage = mergeMessage(data)
    if (isNewMessage) notifyIncomingMessage(data)
    if (data.type === 'invoice' && data.invoice?.items?.length) {
      emit('invoice-received', data)
    }
    if (isOpen.value) scrollToBottom()
  }

  websocket.onclose = () => {
    isOnline.value = false
    websocket = null
  }

  websocket.onerror = (error) => {
    isOnline.value = false
    console.error('WebSocket Error:', error)
  }
}

const closeWebSocket = () => {
  if (websocket) {
    websocket.close()
    websocket = null
  }
  isOnline.value = false
}

onMounted(() => {
  if (props.orderId) initWebSocket()
})

onUnmounted(() => {
  closeWebSocket()
  if (notificationAudioContext) {
    notificationAudioContext.close().catch((error) => {
      console.warn('ปิดเสียงแจ้งเตือนแชทไม่สำเร็จ:', error)
    })
  }
})

const quickReplies = [
  'ใกล้ถึงหรือยังครับ?',
  'จอดรถบริเวณลานหน้าบ้านได้เลยครับ',
  'ปิดวาล์วน้ำหลักเรียบร้อยแล้วครับ',
  'ต้องการให้อุปกรณ์อะไรเพิ่มเติมไหมครับ?',
]

const messages = ref([
  { id: 1, sender: 'system', text: 'เริ่มการสนทนากับช่างเทคนิค (Real-time)', time: '10:05' },
])

const mergeMessage = (message) => {
  const index = messages.value.findIndex((existing) => existing.id === message.id)
  if (index < 0) {
    messages.value.push(message)
    return true
  } else {
    messages.value[index] = { ...messages.value[index], ...message, deliveryStatus: 'sent' }
    return false
  }
}

const loadChatMessages = async (orderId) => {
  try {
    const response = await api.get(`/jobs/${encodeURIComponent(orderId)}/messages`)
    if (String(props.orderId) !== String(orderId)) return
    const serverMessages = response.data?.data
    if (!Array.isArray(serverMessages)) throw new Error('ข้อมูลข้อความจากระบบไม่ถูกต้อง')
    for (const message of serverMessages) {
      mergeMessage({ ...message, deliveryStatus: 'sent' })
      if (message.type === 'invoice' || message.type === 'receipt') persistChatDocument(message)
      if (message.type === 'invoice' && message.invoice?.items?.length)
        emit('invoice-received', message)
    }
    if (!props.isTechSide && !serverMessages.some((message) => message.type === 'receipt')) {
      const trackingResponse = await api.get(`/jobs/tracking/${encodeURIComponent(orderId)}`)
      const tracking = trackingResponse.data
      if (tracking?.payment?.status === 'PAID' && tracking.invoice?.items?.length) {
        const paidAt = tracking.payment.paid_at
          ? new Date(tracking.payment.paid_at).toLocaleString('th-TH')
          : ''
        const pdf = await createPaymentReceiptPdf({
          orderNo: orderId,
          job: {
            customerName: 'ลูกค้า FixMatch',
            issueDescription: props.issueTitle || 'งานซ่อมแซม',
          },
          technicianName: props.technician?.name || 'ช่างผู้ให้บริการ',
          items: tracking.invoice.items,
          total: Number(tracking.payment.amount),
          paidAt,
        })
        const receipt = {
          ...pdf,
          items: tracking.invoice.items,
          total: Number(tracking.payment.amount),
          paidAt,
          technician: props.technician,
        }
        await sendChatMessage({
          id: `${orderId}-cash-receipt`,
          orderId,
          sender: 'user',
          type: 'receipt',
          text: 'ยืนยันการชำระเงินสดแล้ว ส่งใบยืนยันการชำระเงิน',
          receipt,
          time: getCurrentTime(),
        })
      }
    }
    scrollToBottom()
  } catch (error) {
    console.error('โหลดประวัติแชทจากระบบไม่สำเร็จ:', error)
  }
}

const sendChatMessage = async (messageData) => {
  mergeMessage({ ...messageData, deliveryStatus: 'sending' })
  scrollToBottom()
  try {
    const response = await api.post(
      `/jobs/${encodeURIComponent(props.orderId)}/messages`,
      messageData,
    )
    const savedMessage = response.data?.data
    if (!savedMessage) throw new Error('ระบบไม่ได้ยืนยันการบันทึกข้อความ')
    mergeMessage({ ...savedMessage, deliveryStatus: 'sent' })
    if (savedMessage.type === 'invoice' || savedMessage.type === 'receipt')
      persistChatDocument(savedMessage)
    return true
  } catch (error) {
    console.error('ส่งข้อความในแชทไม่สำเร็จ:', error)
    const index = messages.value.findIndex((message) => message.id === messageData.id)
    if (index >= 0) messages.value[index] = { ...messages.value[index], deliveryStatus: 'failed' }
    return false
  }
}

const retryMessage = (message) => {
  const messageData = { ...message }
  delete messageData.deliveryStatus
  sendChatMessage(messageData)
}

const getInvoiceStorageKey = (orderId) =>
  `fixmatch_chat_invoices_${encodeURIComponent(String(orderId))}`

const getSavedInvoices = (orderId) => {
  try {
    const savedMessages = JSON.parse(localStorage.getItem(getInvoiceStorageKey(orderId)) || '[]')
    if (!Array.isArray(savedMessages)) {
      throw new Error('ข้อมูลบิลที่บันทึกไว้ไม่ถูกต้อง')
    }
    return savedMessages.filter(
      (message) =>
        (message.type === 'invoice' && message.invoice?.pdfBase64) ||
        (message.type === 'receipt' && message.receipt?.pdfBase64),
    )
  } catch (error) {
    console.error('ไม่สามารถอ่านบิลที่บันทึกไว้ในแชทได้:', error)
    return []
  }
}

const persistChatDocument = (message) => {
  const hasPdf =
    (message.type === 'invoice' && message.invoice?.pdfBase64) ||
    (message.type === 'receipt' && message.receipt?.pdfBase64)
  if (!hasPdf) return

  const orderId = message.orderId || props.orderId
  const savedInvoices = getSavedInvoices(orderId)
  if (savedInvoices.some((saved) => saved.id === message.id)) return

  try {
    localStorage.setItem(getInvoiceStorageKey(orderId), JSON.stringify([...savedInvoices, message]))
  } catch (error) {
    console.error('ไม่สามารถบันทึกบิลไว้ในแชทบนอุปกรณ์นี้ได้:', error)
  }
}

const getCurrentTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const downloadInvoice = (invoice) => {
  if (!invoice?.pdfBase64 || !invoice.fileName) return

  const binary = atob(invoice.pdfBase64)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const file = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = invoice.fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

const sendMessage = () => {
  const text = inputText.value.trim()
  if (!text) return

  const messageData = {
    id: createMessageId(),
    orderId: props.orderId,
    sender: props.isTechSide ? 'tech' : 'user',
    text,
    type: 'text',
    time: getCurrentTime(),
  }

  inputText.value = ''
  sendChatMessage(messageData)
}

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`

const sendQuickReply = (text) => {
  inputText.value = text
  sendMessage()
}

const triggerImageUpload = () => {
  if (fileInputRef.value) fileInputRef.value.click()
}

const handleImageSelected = async (e) => {
  const input = e.target
  const file = input.files[0]
  if (!file) return
  input.value = ''
  if (file.size > 4 * 1024 * 1024) {
    $q.notify({ type: 'warning', message: 'รูปภาพต้องมีขนาดไม่เกิน 4 MB' })
    return
  }

  try {
    const imageUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'))
      reader.readAsDataURL(file)
    })
    sendChatMessage({
      id: createMessageId(),
      orderId: props.orderId,
      sender: props.isTechSide ? 'tech' : 'user',
      type: 'image',
      imageUrl,
      time: getCurrentTime(),
    })
  } catch (error) {
    console.error('อ่านไฟล์รูปภาพไม่สำเร็จ:', error)
    $q.notify({ type: 'negative', message: 'อ่านรูปภาพไม่สำเร็จ กรุณาลองอีกครั้ง' })
  }
}

const getValidAvatar = (url) => {
  if (String(url).includes('avatar2.jpg')) return 'https://cdn.quasar.dev/img/avatar.png'
  return getBackendUploadUrl(url)
}
</script>

<style scoped>
.chat-card {
  width: 100%;
  max-width: 36rem;
  height: min(85vh, 48rem);
  border-top-left-radius: 1.5rem;
  border-top-right-radius: 1.5rem;
  background-color: #f5f8fc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px -18px rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

@media (min-width: 640px) {
  .chat-card {
    height: 680px;
    border-radius: 1rem;
  }
}

.drag-handle-container {
  display: flex;
  justify-content: center;
  padding-top: 0.625rem;
  padding-bottom: 0.25rem;
  background-color: #ffffff;
}

@media (min-width: 640px) {
  .drag-handle-container {
    display: none;
  }
}

.drag-handle {
  width: 2.75rem;
  height: 0.3rem;
  background-color: #cbd5e1;
  border-radius: 9999px;
}

.chat-header {
  padding: 0.875rem 1rem;
  background: linear-gradient(120deg, #ffffff 45%, #f0f9ff);
  border-bottom: 1px solid #e8eef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .chat-header {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

.header-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.avatar-badge-wrapper {
  position: relative;
  flex-shrink: 0;
  padding: 2px;
  border: 2px solid #dbeafe;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.1);
}

.profile-copy {
  min-width: 0;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0.75rem;
  height: 0.75rem;
  background-color: #94a3b8;
  border: 2px solid #ffffff;
  border-radius: 9999px;
}

.online-indicator.indicator-online {
  background-color: #10b981;
}

.online-indicator.indicator-offline {
  background-color: #f59e0b;
}

.tech-name-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
}

.tech-name {
  min-width: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-verified {
  color: #0284c7;
}

.tech-subtext {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: #64748b;
  margin-top: 0.25rem;
  margin-bottom: 0;
  line-height: 1.4;
}

.profile-specialty {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.online-text {
  color: #059669;
  font-weight: 700;
}

.offline-text {
  color: #b45309;
  font-weight: 700;
}

.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.connection-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: currentColor;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.call-btn {
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 9999px;
  background-color: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0369a1;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.call-btn:hover {
  background-color: #bae6fd;
  transform: translateY(-1px);
}

.issue-banner {
  padding: 0.5rem 1rem;
  background: linear-gradient(90deg, #eff6ff, #f0fdfa);
  border-bottom: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem;
  font-size: 0.75rem;
  color: #475569;
  flex-shrink: 0;
}

.issue-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-build {
  color: #0284c7;
}

.issue-label {
  font-weight: 500;
  color: #334155;
}

.issue-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-ref-code {
  flex: 0 0 auto;
  max-width: 40%;
  font-family: monospace;
  font-size: 0.625rem;
  font-weight: 700;
  color: #64748b;
  overflow-wrap: anywhere;
  text-align: right;
}

.messages-body {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

@media (min-width: 640px) {
  .messages-body {
    padding: 1.5rem;
  }
}

.message-row {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.message-row.align-me {
  align-items: flex-end;
}

.message-row.align-other {
  align-items: flex-start;
}

.message-row.align-system {
  align-items: center;
}

.system-msg-wrapper {
  width: 100%;
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.system-msg-badge {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  background-color: #e9eef5;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  line-height: 1.5;
}

.message-content {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  max-width: min(86%, 29rem);
}

.message-content.row-reverse {
  flex-direction: row-reverse;
}

.tech-msg-avatar {
  margin-bottom: 0.25rem;
  flex-shrink: 0;
}

.bubble-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.message-bubble {
  padding: 0.625rem 1rem;
  border-radius: 1.125rem;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.bubble-user {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #ffffff;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 1rem;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.18);
}

.bubble-tech {
  background-color: #ffffff;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 1rem;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.05);
}

.image-bubble {
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  max-width: 240px;
}

.invoice-bubble {
  width: min(100%, 20rem);
  padding: 0.875rem;
  border: 1px solid #dbeafe;
  border-radius: 1rem;
  background-color: #ffffff;
  color: #1e293b;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.invoice-card-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.5rem;
}

.invoice-line {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.25rem 0;
  font-size: 0.75rem;
}

.chat-attached-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}

.message-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 0.25rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  font-family: monospace;
}

.quick-replies-bar {
  padding: 0.625rem 1rem;
  background-color: #ffffff;
  border-top: 1px solid #e8eef5;
  overflow-x: auto;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  gap: 0.5rem;
  scroll-snap-type: x proximity;
}

.quick-reply-btn {
  display: inline-block;
  flex: 0 0 auto;
  padding: 0.45rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #f0f9ff;
  color: #0369a1;
  border: 1px solid #dbeafe;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  scroll-snap-align: start;
}

.quick-reply-btn:hover {
  background-color: #e0f2fe;
  border-color: #7dd3fc;
  transform: translateY(-1px);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.chat-footer {
  padding: 0.625rem 0.75rem 0.75rem;
  background-color: #ffffff;
  border-top: 1px solid #e8eef5;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .chat-footer {
    padding: 1rem;
  }
}

.chat-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.composer-hint {
  display: block;
  margin: 0 0 0.4rem 0.25rem;
  color: #94a3b8;
  font-size: 0.6875rem;
  font-weight: 600;
}

.action-btn:hover {
  background-color: #f1f5f9;
}

.file-input-hidden {
  display: none;
}

.chat-input {
  flex-grow: 1;
}

:deep(.chat-input .q-field__control) {
  min-height: 2.875rem;
  border-radius: 1rem !important;
  background-color: #f8fafc !important;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

:deep(.chat-input.q-field--focused .q-field__control) {
  background-color: #ffffff !important;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}

.send-btn {
  flex-shrink: 0;
  min-height: 2.875rem;
  min-width: 4rem;
  border-radius: 1rem !important;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.18);
}

@media (max-width: 599px) {
  .chat-card {
    height: 92vh;
    height: 92dvh;
    max-height: 52rem;
    border-top-left-radius: 1.375rem;
    border-top-right-radius: 1.375rem;
  }

  .chat-header {
    padding: 0.75rem 0.625rem;
    gap: 0.25rem;
  }

  .header-profile {
    gap: 0.5rem;
    flex: 1 1 auto;
  }

  .header-profile :deep(.q-avatar) {
    width: 2.25rem;
    height: 2.25rem;
  }

  .tech-name {
    font-size: 0.9rem;
  }

  .header-actions {
    gap: 0;
  }

  .header-actions :deep(.q-btn) {
    min-width: 2rem;
    min-height: 2rem;
    padding: 0.25rem;
  }

  .call-btn {
    width: 2rem;
    height: 2rem;
  }

  .issue-banner {
    padding: 0.5rem 0.75rem;
    font-size: 0.6875rem;
  }

  .messages-body {
    padding: 0.875rem 0.75rem;
    gap: 0.875rem;
  }

  .message-content {
    max-width: 90%;
    gap: 0.375rem;
  }

  .tech-msg-avatar {
    width: 1.75rem;
    height: 1.75rem;
  }

  .message-bubble {
    padding: 0.6rem 0.8rem;
    font-size: 0.875rem;
  }

  .quick-replies-bar {
    padding: 0.5rem 0.75rem;
  }

  .chat-footer {
    padding: 0.5rem 0.625rem calc(0.625rem + env(safe-area-inset-bottom, 0px));
  }

  .send-btn {
    min-width: 3.75rem;
    padding: 0 0.75rem;
  }
}
</style>

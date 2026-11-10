<template>
  <q-page class="payment-page font-sans">
    <div class="payment-container">

      <!-- Payment Status Card -->
      <div class="success-header">
        <div class="success-icon-badge">
          <q-icon :name="isPaid ? 'check_circle' : 'receipt_long'" size="36px" />
        </div>
        <h2 class="success-title">{{ isPaid ? 'ยืนยันการชำระเงินแล้ว' : 'งานซ่อมเสร็จสิ้นแล้ว!' }}</h2>
        <p class="order-ref-text">
          หมายเลขออเดอร์ <span class="order-id">#{{ orderId }}</span>
        </p>
      </div>

      <!-- Section 1: Itemized Service Invoice -->
      <div class="card-box">
        <div class="invoice-header">
          <div class="tech-profile">
            <q-avatar size="44px" class="tech-avatar">
              <BackendImage :src="jobDetails.techAvatar" :alt="technicianName" />
            </q-avatar>
            <div>
              <h3 class="tech-name">{{ technicianName }}</h3>
              <p class="tech-sub font-sans">ผู้ให้บริการซ่อม</p>
            </div>
          </div>
          <q-chip size="sm" class="status-chip-success">
            ซ่อมสำเร็จ
          </q-chip>
        </div>

        <h4 class="section-title">รายการและยอดเงินที่ต้องชำระ</h4>

        <!-- Service Items -->
        <div class="invoice-items-wrapper">
          <div v-for="(item, index) in invoiceItems" :key="index" class="invoice-item">
            <span>{{ item.description }}</span>
            <span class="item-amount">฿{{ item.amount.toLocaleString() }}</span>
          </div>

          <div v-if="!hasInvoice" class="text-warning q-py-md">
            ยังไม่ได้รับใบแจ้งค่าบริการจากช่าง กรุณาเปิดแชทเพื่อรับใบแจ้งหนี้ก่อนชำระเงิน
          </div>

          <!-- Total Amount -->
          <div class="invoice-total">
            <span>ยอดชำระสุทธิ</span>
            <span class="total-amount">฿{{ totalAmount.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Section 2: Payment Method Selection & QR Code -->
      <div class="card-box">
        <h4 class="section-title">ชำระด้วยเงินสดเท่านั้น</h4>
        <div class="cash-notice font-sans">
          <p class="cash-title">ชำระด้วยเงินสดหน้างาน</p>
          <p class="cash-sub">โปรดยื่นเงินสด ฿{{ totalAmount.toLocaleString() }} ให้ช่าง แล้วกดยืนยันด้านล่าง</p>
        </div>

        <q-btn v-if="!isPaid" unelevated no-caps :loading="isProcessingPayment || isCheckingPayment" class="btn-pay-submit"
          :disable="isCheckingPayment || !hasInvoice || totalAmount <= 0" @click="handlePaymentSubmit">
          ยืนยันการชำระเงิน (฿{{ totalAmount.toLocaleString() }})
        </q-btn>

        <div v-else class="paid-success-banner">
          <q-icon name="task_alt" size="18px" />
          <span>ชำระเงินสดแล้ว ใบยืนยันการชำระถูกส่งให้ช่างทางแชท</span>
        </div>
      </div>

      <div v-if="isPaid" class="card-box">
        <h4 class="section-title">แชทกับช่าง</h4>
        <q-btn unelevated no-caps color="primary" icon="chat" label="เปิดแชทและใบยืนยันการชำระ"
          @click="isChatOpen = true" />
      </div>

      <!-- Section 3: Technician Review & Rating -->
      <div class="card-box">
        <h4 class="section-title">ให้คะแนนและรีวิวบริการ</h4>

        <div class="rating-center">
          <p class="rating-prompt">ความพึงพอใจต่อการให้บริการของช่าง</p>

          <!-- Rating Stars -->
          <q-rating v-model="rating" size="32px" color="amber-5" icon="star_border" icon-selected="star"
            class="rating-stars" />

          <p v-if="rating > 0" class="rating-label">
            {{ ratingLabels[rating - 1] }}
          </p>
        </div>

        <!-- Feedback Tags -->
        <div class="tags-wrapper">
          <span class="tags-title">ประทับใจเรื่องอะไรบ้าง? (เลือกได้หลายข้อ)</span>
          <div class="tags-container">
            <button v-for="(tag, idx) in feedbackTags" :key="idx" @click="toggleTag(tag)" class="tag-btn"
              :class="{ 'selected': selectedTags.includes(tag) }">
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Review Comment -->
        <q-input v-model="reviewComment" type="textarea" outlined dense rows="3"
          placeholder="เขียนคำติชม หรือข้อเสนอแนะเพิ่มเติม..." class="minimal-input comment-input" />

        <div v-if="isReviewSubmitted" class="paid-success-banner q-mb-md">
          <q-icon name="task_alt" size="18px" />
          <span>ส่งแบบประเมินเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็น</span>
        </div>

        <q-btn unelevated no-caps :disabled="rating === 0 || !isPaid || isReviewSubmitted" :loading="isSubmittingReview"
          class="btn-submit-review" @click="submitReview">
          {{ isReviewSubmitted ? 'ส่งแบบประเมินแล้ว' : 'ส่งแบบประเมินและเสร็จสิ้น' }}
        </q-btn>
      </div>

    </div>

    <LiveChatSheet v-model="isChatOpen" :orderId="orderId"
      :technician="technicianProfile"
      :pendingReceipt="pendingReceipt" :issueTitle="jobDetails.issueDescription" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import fixmatchService from '@/services/fixmatchService'
import { useBookingStore } from '@/stores/bookingStore'
import { getCustomerBookingHistory } from '@/services/customerBookingHistory'
import { DEFAULT_TECHNICIAN_AVATAR, normalizeTechnicianProfile } from '@/services/technicianProfile'
import BackendImage from '@/components/BackendImage.vue'
import LiveChatSheet from '@/components/chat/LiveChatSheet.vue'
import { createPaymentReceiptPdf } from '@/services/invoicePdf'

const $q = useQuasar()
const router = useRouter()
const bookingStore = useBookingStore()
const orderId = computed(() => bookingStore.orderId || localStorage.getItem('current_order_id') || '')
const isChatOpen = ref(false)
const pendingReceipt = ref(null)
const hasInvoice = ref(false)
const invoiceItems = ref([])
const isCheckingPayment = ref(true)
const technicianProfile = ref({
  id: null,
  name: 'ไม่พบข้อมูลช่างของรายการนี้',
  avatarUrl: DEFAULT_TECHNICIAN_AVATAR,
  specialty: 'ช่างผู้ให้บริการ',
})
const technicianName = computed(() => technicianProfile.value.name)
const paymentMessageId = computed(() => `fixmatch_cash_paid_${orderId.value}`)

// ฟังก์ชันยืนยันการชำระเงิน
const handlePaymentSubmit = async () => {
  if (!hasInvoice.value || !orderId.value || totalAmount.value <= 0 || isPaid.value) return

  isProcessingPayment.value = true
  try {
    const paidAt = new Date().toLocaleString('th-TH')
    const receipt = await createPaymentReceiptPdf({
      orderNo: orderId.value,
      job: { customerName: bookingStore.bookingDetails.contactName, issueDescription: jobDetails.value.issueDescription },
      technicianName: technicianName.value,
      items: invoiceItems.value,
      total: totalAmount.value,
      paidAt,
    })

    const paymentResponse = await fixmatchService.submitPayment(orderId.value, {
      method: 'cash',
      amount: totalAmount.value
    })

    isPaid.value = true
    bookingStore.setPaymentData({
      paymentMethod: 'cash',
      totalAmount: totalAmount.value,
      isPaid: true,
    })
    pendingReceipt.value = {
      id: `${orderId.value}-cash-receipt`,
      orderId: orderId.value,
      ...receipt,
      items: invoiceItems.value,
      total: totalAmount.value,
      paidAt: paymentResponse.data?.paid_at
        ? new Date(paymentResponse.data.paid_at).toLocaleString('th-TH')
        : paidAt,
      technician: technicianProfile.value,
    }
    try {
      localStorage.setItem(paymentMessageId.value, JSON.stringify({
        receipt,
        items: invoiceItems.value,
        total: totalAmount.value,
        paidAt: pendingReceipt.value.paidAt,
      }))
    } catch (storageError) {
      console.error('บันทึกใบยืนยันการชำระในอุปกรณ์ไม่สำเร็จ:', storageError)
      $q.notify({
        type: 'warning',
        message: 'ชำระเงินแล้ว แต่บันทึกใบยืนยันในอุปกรณ์ไม่สำเร็จ กรุณาดาวน์โหลดจากแชท',
      })
    }
    isChatOpen.value = true
    $q.notify({
      type: 'positive',
      message: 'ยืนยันการชำระเงินสดแล้ว ส่งใบยืนยันให้ช่างทางแชท',
      icon: 'check_circle'
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || 'ยืนยันการชำระเงินไม่สำเร็จ กรุณาลองอีกครั้ง'
    })
  } finally {
    isProcessingPayment.value = false
  }
}

// ฟังก์ชันส่งรีวิวและคะแนน
const submitReview = async () => {
  if (!orderId.value || !isPaid.value || rating.value < 1 || isReviewSubmitted.value) return

  isSubmittingReview.value = true
  try {
    await fixmatchService.submitReview(orderId.value, {
      rating: rating.value,
      tags: selectedTags.value,
      comment: reviewComment.value
    })

    isReviewSubmitted.value = true
    $q.notify({
      type: 'positive',
      message: 'ขอบคุณสำหรับคะแนนและรีวิวของคุณ!',
      icon: 'star'
    })
    await router.replace({ name: 'diagnostic' })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || 'ไม่สามารถบันทึกรีวิวได้ กรุณาลองอีกครั้ง'
    })
  } finally {
    isSubmittingReview.value = false
  }
}

// State
const isPaid = ref(false)
const isProcessingPayment = ref(false)
const isSubmittingReview = ref(false)
const isReviewSubmitted = ref(false)

const rating = ref(5)
const reviewComment = ref('')
const selectedTags = ref([])

const jobDetails = ref({
  issueDescription: bookingStore.issueData.title || bookingStore.issueData.description || 'งานซ่อมแซม',
  techAvatar: DEFAULT_TECHNICIAN_AVATAR,
})

const totalAmount = computed(() => {
  return invoiceItems.value.reduce((sum, item) => sum + item.amount, 0)
})

const ratingLabels = ['ปรับปรุง', 'พอใช้', 'ปานกลาง', 'ดีมาก', 'ประทับใจที่สุด!']

const loadInvoice = async () => {
  if (!orderId.value) {
    isCheckingPayment.value = false
    return
  }

  let tracking = null
  let trackingLoaded = false
  try {
    const response = await fixmatchService.getTrackingStatus(orderId.value)
    tracking = response.data
    trackingLoaded = true
  } catch (error) {
    console.error('ไม่สามารถตรวจสอบสถานะชำระเงินจากเซิร์ฟเวอร์ได้:', error)
    $q.notify({
      type: 'warning',
      message: 'ตรวจสอบสถานะชำระเงินจากเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ',
    })
  }

  const serverPayment = tracking?.payment
  if (serverPayment?.status === 'PAID') {
    isPaid.value = true
    bookingStore.setPaymentData({
      paymentMethod: serverPayment.method || 'cash',
      totalAmount: Number(serverPayment.amount),
      isPaid: true,
    })
  }

  try {
    const savedMessages = JSON.parse(
      localStorage.getItem(`fixmatch_chat_invoices_${encodeURIComponent(String(orderId.value))}`) || '[]',
    )
    const invoiceMessage = Array.isArray(savedMessages)
      ? savedMessages.find(message => message.type === 'invoice' && message.invoice?.items?.length)
      : null

    let bookedTechnician = null
    try {
      const customerBookings = getCustomerBookingHistory(null)
      const currentBooking = customerBookings.find(booking =>
        String(booking.orderNo || booking.order_no || booking.orderId || booking.id) === String(orderId.value),
      )
      bookedTechnician = currentBooking?.technician || null
    } catch (error) {
      console.error('ไม่สามารถอ่านข้อมูลช่างจากประวัติการจองได้:', error)
    }

    const assignedTechnician = invoiceMessage?.invoice?.technician
      || bookedTechnician
      || (String(bookingStore.orderId) === String(orderId.value) ? bookingStore.selectedTechnician : null)
    const normalizedTechnician = normalizeTechnicianProfile(assignedTechnician)
    if (normalizedTechnician) {
      technicianProfile.value = normalizedTechnician
      jobDetails.value.techAvatar = normalizedTechnician.avatarUrl
    }

    const invoice = invoiceMessage?.invoice || tracking?.invoice
    if (invoice?.items?.length) {
      invoiceItems.value = invoice.items.map(item => ({
        description: item.description,
        amount: Number(item.amount),
      }))
      hasInvoice.value = invoiceItems.value.every(item => item.description && Number.isFinite(item.amount) && item.amount >= 0)
    }

    jobDetails.value.issueDescription = bookingStore.issueData.title || bookingStore.issueData.description || 'งานซ่อมแซม'
    const savedPayment = JSON.parse(localStorage.getItem(paymentMessageId.value) || 'null')
    if (savedPayment && !trackingLoaded && !isPaid.value) {
      isPaid.value = true
      bookingStore.setPaymentData({
        paymentMethod: 'cash',
        totalAmount: savedPayment.total,
        isPaid: true,
      })
    }
    if (savedPayment) {
      pendingReceipt.value = {
        id: `${orderId.value}-cash-receipt`,
        orderId: orderId.value,
        ...savedPayment.receipt,
        items: savedPayment.items,
        total: savedPayment.total,
        paidAt: savedPayment.paidAt,
      }
    } else if (serverPayment?.status === 'PAID' && hasInvoice.value) {
      const paidAt = serverPayment.paid_at
        ? new Date(serverPayment.paid_at).toLocaleString('th-TH')
        : ''
      const receipt = await createPaymentReceiptPdf({
        orderNo: orderId.value,
        job: {
          customerName: bookingStore.bookingDetails.contactName || 'ลูกค้า FixMatch',
          issueDescription: jobDetails.value.issueDescription,
        },
        technicianName: technicianName.value,
        items: invoiceItems.value,
        total: Number(serverPayment.amount),
        paidAt,
      })
      pendingReceipt.value = {
        id: `${orderId.value}-cash-receipt`,
        orderId: orderId.value,
        ...receipt,
        items: invoiceItems.value,
        total: Number(serverPayment.amount),
        paidAt,
        technician: technicianProfile.value,
      }
    }
  } catch (error) {
    console.error('ไม่สามารถโหลดใบแจ้งค่าบริการได้:', error)
    $q.notify({ type: 'negative', message: 'อ่านใบแจ้งค่าบริการไม่สำเร็จ' })
  } finally {
    isCheckingPayment.value = false
  }
}

const feedbackTags = [
  'ตรงต่อเวลา',
  'สุภาพเรียบร้อย',
  'งานสะอาดเรียบร้อย',
  'แก้ปัญหาตรงจุด',
  'อธิบายเข้าใจง่าย'
]

const toggleTag = (tag) => {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter(t => t !== tag)
  } else {
    selectedTags.value.push(tag)
  }
}

onMounted(loadInvoice)

</script>

<style scoped>
/* ==========================================================================
   Pure CSS Payment & Review Page Styling
   ========================================================================== */

/* Page & Layout Container */
.payment-page {
  background-color: #f8fafc;
  min-height: 100vh;
  padding: 2rem 1rem;
}

.payment-container {
  max-width: 576px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 1. Success Header */
.success-header {
  text-align: center;
  padding: 1rem 0 0.5rem;
}

.success-icon-badge {
  width: 64px;
  height: 64px;
  background-color: #d1fae5;
  color: #059669;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.success-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.order-ref-text {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.order-id {
  font-family: monospace;
  color: #334155;
  font-weight: 600;
}

/* 2. Card General Styling */
.card-box {
  background-color: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin: 0 0 0.75rem 0;
}

/* 3. Invoice Section */
.invoice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.tech-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tech-avatar {
  border: 1px solid #f1f5f9;
}

.tech-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.tech-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

.status-chip-success {
  background-color: #ecfdf5 !important;
  color: #047857 !important;
  font-weight: 600 !important;
}

.invoice-items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  font-size: 0.875rem;
}

.invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #475569;
}

.item-amount {
  font-weight: 500;
  color: #1e293b;
}

.discount-item {
  color: #059669;
}

.invoice-total {
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 700;
  color: #0f172a;
  font-size: 1rem;
}

.total-amount {
  font-size: 1.25rem;
  color: #0284c7;
}

/* 4. Payment Selection Section */
.payment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.payment-tab-btn {
  padding: 0.75rem 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background-color: #ffffff;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-tab-btn:hover {
  background-color: #f8fafc;
}

.payment-tab-btn.active {
  border-color: #0284c7;
  background-color: #f0f9ff;
  color: #0369a1;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.1);
}

/* PromptPay Display */
.qr-container {
  text-align: center;
  padding: 1.25rem;
  background-color: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.qr-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
}

.qr-box {
  width: 176px;
  height: 176px;
  background-color: #ffffff;
  padding: 0.5rem;
  border-radius: 0.75rem;
  margin: 0 auto 0.5rem auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-sub {
  font-size: 0.6875rem;
  color: #94a3b8;
  margin: 0;
}

/* Credit Card Inputs */
.card-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

:deep(.minimal-input .q-field__control) {
  border-radius: 0.75rem !important;
}

/* Cash Notice */
.cash-notice {
  padding: 1rem;
  background-color: #fffbeb;
  border-radius: 0.75rem;
  border: 1px solid #fef3c7;
  font-size: 0.75rem;
  color: #92400e;
}

.cash-title {
  font-weight: 600;
  margin: 0;
}

.cash-sub {
  margin: 0.125rem 0 0 0;
  opacity: 0.85;
}

/* Payment Buttons */
.btn-pay-submit {
  width: 100%;
  padding: 0.875rem 0 !important;
  margin-top: 1.25rem;
  background-color: #0284c7 !important;
  color: #ffffff !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
  border-radius: 0.75rem !important;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
  transition: all 0.2s ease;
}

.btn-pay-submit:hover {
  background-color: #0369a1 !important;
}

.paid-success-banner {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.75rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

/* 5. Review Section */
.rating-center {
  text-align: center;
  padding: 0.5rem 0;
}

.rating-prompt {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
}

.rating-stars {
  margin-bottom: 0.75rem;
}

.rating-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #d97706;
  margin: 0 0 1rem 0;
}

/* Feedback Tags */
.tags-wrapper {
  margin-bottom: 1rem;
}

.tags-title {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-btn:hover {
  background-color: #f1f5f9;
}

.tag-btn.selected {
  background-color: #f0f9ff;
  border-color: #0284c7;
  color: #0369a1;
  font-weight: 600;
}

.comment-input {
  margin-bottom: 1rem;
}

.btn-submit-review {
  width: 100%;
  padding: 0.75rem 0 !important;
  background-color: #1e293b !important;
  color: #ffffff !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  border-radius: 0.75rem !important;
  transition: all 0.2s ease;
}

.btn-submit-review:hover {
  background-color: #0f172a !important;
}
</style>
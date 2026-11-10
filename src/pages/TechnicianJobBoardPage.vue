<template>
    <q-page class="job-board-page">
        <div class="job-board-container">

            <!-- Top Bar: Online/Offline Toggle Banner -->
            <q-card flat class="status-banner" :class="isOnline ? 'banner-online' : 'banner-offline'">
                <div class="banner-body">
                    <div class="profile-info">
                        <div class="avatar-wrapper">
                            <q-avatar size="52px" class="profile-avatar">
                                <BackendImage :src="techProfile.avatarUrl" :alt="techProfile.fullName" />
                            </q-avatar>
                            <span class="status-dot" :class="isOnline ? 'dot-online' : 'dot-offline'"></span>
                        </div>
                        <div class="profile-text">
                            <div class="name-row">
                                <h2 class="tech-name">{{ technicianDisplayName }}</h2>
                                <q-icon name="verified" size="16px" class="icon-verified" />
                            </div>
                            <div class="text-caption text-grey-8" style="font-weight: 600;">
                                เชี่ยวชาญ: {{ techProfile.skills.join(', ') || 'งานซ่อมทั่วไป' }}
                            </div>

                            <p class="status-label" :class="isOnline ? 'text-online' : 'text-offline'">
                                <span class="pulse-indicator" v-if="isOnline"></span>
                                {{ isOnline ? 'พร้อมรับงานออนไลน์ (Real-time)' : 'ปิดรับงานชั่วคราว' }}
                            </p>
                            <p class="location-sharing-status" :class="{ 'location-sharing-error': locationError }">
                                <q-icon :name="locationError ? 'location_off' : isLocationReady ? 'my_location' : 'gps_not_fixed'"
                                    size="15px" />
                                <span>{{ locationStatusText }}</span>
                                <q-btn v-if="locationError" flat dense no-caps color="primary"
                                    label="ลองระบุตำแหน่งอีกครั้ง" @click="startLocationTracking" />
                            </p>
                            <p v-if="!isLocationReady && !isPaymentHistoryPage" class="text-caption text-grey-7 q-mb-none">
                                ยังดูรายการงานได้ แต่ต้องเปิด GPS ก่อนรับงานหรือเริ่มซ่อม
                            </p>
                        </div>
                    </div>

                    <div class="toggle-wrapper">
                        <q-toggle v-model="isOnline" color="emerald" size="lg"
                            :disable="!isLocationReady"
                            @update:model-value="handleToggleOnline" />
                    </div>
                </div>
            </q-card>

            <q-banner v-if="techProfile.status === 'REJECTED'" rounded class="bg-red-1 text-negative q-mt-md">
                <template #avatar><q-icon name="error_outline" /></template>
                บัญชีช่างยังไม่ผ่านการอนุมัติ{{ techProfile.rejectionReason ? `: ${techProfile.rejectionReason}` : '' }}
            </q-banner>

            <!-- Section: Work Mode Tabs -->
            <div v-if="!isPaymentHistoryPage" class="tab-bar">
                <button v-for="tab in tabs" :key="tab.id" @click="selectTab(tab.id)" class="tab-btn"
                    :class="{ 'tab-btn-active': activeTab === tab.id }">
                    <span>{{ tab.label }}</span>
                    <q-badge v-if="tab.count > 0" :color="tab.badgeColor" rounded class="tab-badge">
                        {{ tab.count }}
                    </q-badge>
                </button>
            </div>
            <q-banner v-if="jobLoadError && !isPaymentHistoryPage" rounded class="bg-red-1 text-negative">
                {{ jobLoadError }}
                <template #action>
                    <q-btn flat dense no-caps color="negative" label="ลองอีกครั้ง" @click="fetchMyJobs" />
                </template>
            </q-banner>

            <!-- TAB 1: Scheduled Bookings -->
            <div v-if="!isPaymentHistoryPage && activeTab === 'scheduled'" class="tab-content">
                <div v-if="isLoadingJobs" class="text-center q-pa-lg">
                    <q-spinner-dots color="primary" size="40px" />
                    <p class="text-grey-7 q-mt-sm">กำลังโหลดข้อมูลงานนัดหมาย...</p>
                </div>

                <div v-else-if="scheduledJobs.length === 0" class="empty-state-card">
                    <q-icon name="event_available" size="48px" class="empty-icon" />
                    <h3 class="empty-title">ไม่มีงานนัดหมายล่วงหน้า</h3>
                    <p class="empty-desc">เมื่อมีลูกค้าจองคิวนัดหมาย รายการงานจะแสดงในส่วนนี้</p>
                </div>

                <ScheduledBookingCard v-else v-for="job in scheduledJobs" :key="job.id" :job="job"
                    :loading="isSubmitting"
                    @open-gps="openGPSNavigation" @accept-job="handleAcceptJob(job)"
                    @reject-job="handleRejectScheduledJob(job)" />
            </div>

            <!-- TAB 2: Active / Ongoing Jobs -->
            <div v-if="!isPaymentHistoryPage && activeTab === 'ongoing'" class="tab-content">
                <div v-if="!ongoingJob" class="empty-state-card">
                    <q-icon name="handyman" size="48px" class="empty-icon" />
                    <h3 class="empty-title">ไม่มีงานที่กำลังปฏิบัติงาน</h3>
                    <p class="empty-desc">กดรับงานจากแท็บ "งานนัดหมายล่วงหน้า" เพื่อเริ่มงานซ่อม</p>
                </div>

                <q-card v-if="ongoingJob" flat class="ongoing-card">
                    <div class="ongoing-header">
                        <div class="status-chip">
                            <span class="live-dot"></span>
                            <span>{{ ongoingJob.status === 'REPAIRING' ? 'กำลังตรวจเช็คและซ่อมแซม' : 'กำลังเดินทางไปบ้านลูกค้า' }}</span>
                        </div>
                        <span class="order-no">#{{ ongoingJob.orderNo || ongoingJob.order_no }}</span>
                    </div>

                    <div class="ongoing-body">
                        <h3 class="ongoing-title">{{ ongoingJob.issueDescription || 'งานบริการซ่อมแซม' }}</h3>
                        <div class="job-meta-row">
                            <div class="meta-item">
                                <q-icon name="person" size="16px" class="meta-icon" />
                                <span>{{ ongoingJob.customerName }} ({{ ongoingJob.customerPhone }})</span>
                            </div>
                            <div class="meta-item">
                                <q-icon name="location_on" size="16px" class="meta-icon icon-red" />
                                <span>{{ ongoingJob.address }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 🟢 เพิ่มปุ่มการกระทำของช่าง (โทร / แชท / นำทาง / ปิดงาน) -->
                    <div class="q-gutter-sm row items-center q-mb-md">
                        <q-btn outline no-caps icon="call" label="โทร" :href="`tel:${ongoingJob.customerPhone}`"
                            class="col" />
                        <q-btn unelevated no-caps icon="chat" label="แชทลูกค้า" color="primary" class="col"
                            @click="openTechChat(ongoingJob)" />
                        <q-btn unelevated no-caps icon="navigation" label="นำทาง GPS" color="sky-6" class="col"
                            @click="openGPSNavigation(ongoingJob.latitude, ongoingJob.longitude)" />
                    </div>

                    <q-btn v-if="ongoingJob.status === 'IN_PROGRESS'" unelevated no-caps
                        class="btn-complete-job" :loading="isSubmitting" :disable="!isLocationReady"
                        @click="handleStartWork">
                        <q-icon name="build_circle" size="18px" class="mr-1" />
                        <span>ถึงบ้านลูกค้าแล้ว - เริ่มตรวจเช็คและซ่อมแซม</span>
                    </q-btn>
                    <template v-else-if="ongoingJob.status === 'REPAIRING'">
                        <p class="repairing-status-note">ลูกค้าจะเห็นสถานะกำลังตรวจเช็คและซ่อมแซม</p>
                        <q-btn unelevated no-caps class="btn-complete-job" :loading="isSubmitting"
                            @click="isCompletionDialogOpen = true">
                            <q-icon name="check_circle" size="18px" class="mr-1" />
                            <span>เสร็จสิ้นงานซ่อม (ออกใบสรุปค่าบริการ)</span>
                        </q-btn>
                    </template>
                </q-card>
            </div>

            <!-- TAB 3: Completed Jobs / Payment Confirmation -->
            <div v-if="!isPaymentHistoryPage && activeTab === 'completed'" class="tab-content completed-jobs-section">
                <h3 class="completed-jobs-title">งานเสร็จแล้ว / ยืนยันรับชำระเงิน</h3>
                <div v-if="completedJobs.length === 0" class="empty-state-card">
                    <q-icon name="task_alt" size="48px" class="empty-icon" />
                    <h3 class="empty-title">ยังไม่มีงานที่เสร็จสิ้น</h3>
                    <p class="empty-desc">งานที่เสร็จแล้วและสถานะการชำระเงินจะแสดงที่นี่</p>
                </div>
                <q-card v-for="job in completedJobs" :key="job.id" flat class="ongoing-card payment-confirmation-card">
                    <div class="ongoing-header">
                        <div class="status-chip" :class="{ 'payment-received-chip': job.paymentConfirmed }">
                            <span class="live-dot"></span>
                            <span>{{ job.paymentConfirmed ? 'รับเงินและปิดงานแล้ว' : job.paymentStatus === 'PAID' ? 'ลูกค้าชำระเงินแล้ว' : 'รอลูกค้าชำระเงิน' }}</span>
                        </div>
                        <span class="order-no">#{{ job.orderNo || job.order_no }}</span>
                    </div>
                    <div class="ongoing-body">
                        <h4 class="ongoing-title">{{ job.issueDescription || 'งานบริการซ่อมแซม' }}</h4>
                        <div class="job-meta-row">
                            <div class="meta-item">
                                <q-icon name="person" size="16px" class="meta-icon" />
                                <span>{{ job.customerName }} ({{ job.customerPhone }})</span>
                            </div>
                            <div class="meta-item">
                                <q-icon name="payments" size="16px" class="meta-icon" />
                                <span>ยอด ฿{{ Number(job.paymentAmount || job.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}</span>
                            </div>
                        </div>
                    </div>
                    <q-btn v-if="job.paymentStatus === 'PAID' && !job.paymentConfirmed"
                        unelevated no-caps color="positive" class="full-width"
                        :loading="confirmingPaymentJobId === job.id" :disable="isSubmitting"
                        icon="price_check" label="รับเงินจากลูกค้าแล้ว - จบงาน"
                        @click="confirmCustomerPayment(job)" />
                    <div v-else-if="job.paymentConfirmed" class="payment-confirmed-note">
                        ยืนยันรับเงินจากลูกค้าแล้ว{{ job.paymentConfirmedAt ? ` เมื่อ ${formatPaymentTime(job.paymentConfirmedAt)} น.` : '' }}
                    </div>
                    <div v-else class="waiting-payment-note">
                        ปุ่มยืนยันจะปรากฏเมื่อลูกค้าชำระเงินผ่านระบบแล้ว
                    </div>
                </q-card>
            </div>

            <div v-if="isPaymentHistoryPage" class="tab-content">
                <div v-if="isLoadingPayments" class="text-center q-pa-lg">
                    <q-spinner-dots color="primary" size="40px" />
                    <p class="text-grey-7 q-mt-sm">กำลังโหลดประวัติการชำระเงิน...</p>
                </div>

                <div v-else-if="paymentHistoryError" class="empty-state-card">
                    <q-icon name="error_outline" size="48px" class="empty-icon text-negative" />
                    <h3 class="empty-title">โหลดประวัติการชำระเงินไม่สำเร็จ</h3>
                    <p class="empty-desc">{{ paymentHistoryError }}</p>
                    <q-btn flat no-caps color="primary" icon="refresh" label="ลองอีกครั้ง"
                        @click="fetchPaymentHistory" />
                </div>

                <div v-else-if="paymentHistory.length === 0" class="empty-state-card">
                    <q-icon name="receipt_long" size="48px" class="empty-icon" />
                    <h3 class="empty-title">ยังไม่มีประวัติการชำระเงิน</h3>
                    <p class="empty-desc">รายการจะปรากฏที่นี่เมื่อลูกค้ายืนยันชำระเงินแล้ว</p>
                </div>

                <q-card v-else v-for="payment in paymentHistory" :key="payment.paymentId"
                    flat class="payment-history-card">
                    <div class="payment-history-header">
                        <div>
                            <h3 class="payment-customer">{{ payment.customerName || 'ลูกค้า FixMatch' }}</h3>
                            <p v-if="payment.customerPhone" class="payment-customer-phone">{{ payment.customerPhone }}</p>
                            <p class="payment-order">งาน #{{ payment.orderNo || '-' }}</p>
                        </div>
                        <q-badge color="positive" rounded label="ชำระแล้ว" />
                    </div>
                    <div class="payment-history-details">
                        <div class="payment-detail">
                            <q-icon name="calendar_today" />
                            <span>{{ formatPaymentDate(payment.paidAt) }}</span>
                        </div>
                        <div class="payment-detail">
                            <q-icon name="schedule" />
                            <span>{{ formatPaymentTime(payment.paidAt) }} น.</span>
                        </div>
                        <div class="payment-detail">
                            <q-icon name="payments" />
                            <span>เงินสด</span>
                        </div>
                    </div>
                    <div class="payment-history-footer">
                        <div>
                            <div class="payment-amount-label">ยอดที่ได้รับ</div>
                            <div class="payment-amount">
                                ฿{{ Number(payment.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}
                            </div>
                        </div>
                        <q-btn outline no-caps color="primary" icon="picture_as_pdf" label="ใบยืนยัน PDF"
                            :loading="downloadingPaymentId === payment.paymentId"
                            @click="downloadPaymentReceipt(payment)" />
                    </div>
                </q-card>
            </div>

        </div>

        <!-- Modal เด้งรับงานด่วน -->
        <InstantJobRequestModal v-model="isIncomingJobModalOpen" :job-request="incomingJobData"
            @accept="handleAcceptJob" @reject="handleRejectJob" />

        <!-- 🟢 Live Chat Modal Sheet Integration (ฝั่งช่าง) -->
        <LiveChatSheet v-model="isChatOpen" :orderId="activeOrderNo" :technician="activeCustomerInfo"
            :isTechSide="true" :pendingInvoice="pendingInvoice"
            issueTitle="สนทนากับลูกค้า" />

        <ServiceCompletionDialog v-model="isCompletionDialogOpen" :job="ongoingJob"
            :technicianName="technicianDisplayName" :loading="isSubmitting"
            @complete="completeJob" />
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import BackendImage from '@/components/BackendImage.vue'
import { api } from '../boot/axios'
import InstantJobRequestModal from '../components/tech/InstantJobRequestModal.vue'
import ScheduledBookingCard from '../components/tech/ScheduledBookingCard.vue'
import LiveChatSheet from '../components/chat/LiveChatSheet.vue'
import ServiceCompletionDialog from '../components/tech/ServiceCompletionDialog.vue'
import { normalizeTechnicianProfile } from '@/services/technicianProfile'
import { createPaymentReceiptPdf } from '@/services/invoicePdf'

const $q = useQuasar()
const route = useRoute()

const isOnline = ref(false)
const activeTab = ref('scheduled')
const isPaymentHistoryPage = computed(() => route.name === 'tech-payment-history')
const isIncomingJobModalOpen = ref(false)
const isLoadingJobs = ref(false)
const jobLoadError = ref('')
const isSubmitting = ref(false)
const isCompletionDialogOpen = ref(false)
const pendingInvoice = ref(null)
const isLoadingPayments = ref(false)
const paymentHistory = ref([])
const paymentHistoryError = ref('')
const downloadingPaymentId = ref(null)

const scheduledJobs = ref([])
const ongoingJob = ref(null)
const completedJobs = ref([])
const confirmingPaymentJobId = ref(null)
const isLocationReady = ref(false)
const locationError = ref('')
const locationStatusText = computed(() => {
    if (locationError.value) return locationError.value
    return isLocationReady.value
        ? 'กำลังแชร์ตำแหน่ง GPS เพื่อคำนวณเวลาเดินทาง'
        : 'กำลังขอสิทธิ์และค้นหาตำแหน่ง GPS...'
})
let refreshTimer = null
let locationWatchId = null
let locationHeartbeatTimer = null
let latestCoordinates = null
let isPublishingLocation = false
let hasPublishedInitialLocation = false
let hasInitializedJobs = false

// 🟢 สถานะเปิด-ปิดหน้าต่างแชทฝั่งช่าง
const isChatOpen = ref(false)
const activeOrderNo = ref('')
const activeCustomerInfo = ref({
    name: 'ลูกค้า',
    avatarUrl: 'https://cdn.quasar.dev/img/avatar.png',
    specialty: 'ผู้ใช้งานทั่วไป',
    phone: '080-000-0000'
})

const techProfile = ref({
    id: null,
    fullName: 'กำลังโหลด...',
    skills: [],
    avatarUrl: 'https://cdn.quasar.dev/img/avatar.png',
    status: '',
    rejectionReason: '',
})
const technicianDisplayName = computed(() => techProfile.value.fullName.startsWith('ช่าง')
    ? techProfile.value.fullName
    : `ช่าง${techProfile.value.fullName}`)

const tabs = computed(() => [
    { id: 'scheduled', label: 'งานนัดหมายล่วงหน้า', count: scheduledJobs.value.length, badgeColor: 'sky' },
    { id: 'ongoing', label: 'งานที่กำลังทำ', count: ongoingJob.value ? 1 : 0, badgeColor: 'emerald' },
    { id: 'completed', label: 'งานเสร็จ/รับชำระเงิน', count: completedJobs.value.length, badgeColor: 'positive' },
])

const selectTab = (tabId) => {
    activeTab.value = tabId
}

watch(isPaymentHistoryPage, (isHistoryPage) => {
    if (isHistoryPage) {
        stopAutoRefresh()
        stopLocationTracking()
        fetchPaymentHistory()
    } else {
        activeTab.value = 'scheduled'
        fetchMyJobs()
        startLocationTracking()
        startAutoRefresh()
    }
})

// 1. ดึงข้อมูลโปรไฟล์ช่าง
const fetchMyProfile = async () => {
    try {
        const response = await api.get('/technicians/me')
        const data = response.data?.data || response.data
        const profile = normalizeTechnicianProfile(data)
        if (!profile) throw new Error('ไม่พบข้อมูลโปรไฟล์ช่าง')

        techProfile.value = {
            id: profile.id,
            fullName: data.fullName || data.full_name || profile.name,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : (data.skills || []),
            avatarUrl: profile.avatarUrl,
            status: data.status || '',
            rejectionReason: data.rejectionReason || '',
        }
    } catch (error) {
        console.error("ดึงข้อมูลประวัติช่างไม่สำเร็จ", error)
    }
}

const fetchPaymentHistory = async () => {
    try {
        isLoadingPayments.value = true
        paymentHistoryError.value = ''
        const response = await api.get('/jobs/technician/payment-history')
        paymentHistory.value = response.data?.data || []
    } catch (error) {
        console.error('ดึงประวัติการชำระเงินไม่สำเร็จ:', error)
        paymentHistoryError.value = error.response?.data?.detail || 'กรุณาลองใหม่อีกครั้ง'
    } finally {
        isLoadingPayments.value = false
    }
}

const formatPaymentDate = (paidAt) => {
    const date = new Date(paidAt)
    if (!Number.isFinite(date.getTime())) return '-'
    return new Intl.DateTimeFormat('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok',
    }).format(date)
}

const formatPaymentTime = (paidAt) => {
    const date = new Date(paidAt)
    if (!Number.isFinite(date.getTime())) return '--:--'
    return new Intl.DateTimeFormat('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Bangkok',
    }).format(date)
}

const downloadPaymentReceipt = async (payment) => {
    if (!payment.items?.length) {
        $q.notify({ type: 'warning', message: 'ไม่พบรายละเอียดรายการในใบยืนยันการชำระเงิน' })
        return
    }

    try {
        downloadingPaymentId.value = payment.paymentId
        const receipt = await createPaymentReceiptPdf({
            orderNo: payment.orderNo,
            job: {
                customerName: payment.customerName,
                issueDescription: payment.issueDescription,
            },
            technicianName: technicianDisplayName.value,
            items: payment.items,
            total: Number(payment.amount),
            paidAt: `${formatPaymentDate(payment.paidAt)} ${formatPaymentTime(payment.paidAt)} น.`,
        })
        const binary = atob(receipt.pdfBase64)
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
        const link = document.createElement('a')
        link.href = url
        link.download = receipt.fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
        console.error('สร้างใบยืนยันการชำระเงินไม่สำเร็จ:', error)
        $q.notify({ type: 'negative', message: 'ดาวน์โหลดใบยืนยันการชำระเงินไม่สำเร็จ' })
    } finally {
        downloadingPaymentId.value = null
    }
}

// 2. ดึงรายการงานนัดหมายจริงจากฐานข้อมูล
const fetchMyJobs = async () => {
    if (isPaymentHistoryPage.value) return

    try {
        isLoadingJobs.value = true
        jobLoadError.value = ''
        const response = await api.get('/jobs/technician/my-jobs')
        const jobs = response.data.data || []

        scheduledJobs.value = jobs.filter(j => j.status === 'CONFIRMED' || j.status === 'PENDING')
        ongoingJob.value = jobs.find(j => ['IN_PROGRESS', 'REPAIRING'].includes(j.status)) || null
        completedJobs.value = jobs.filter(j => j.status === 'COMPLETED')
        if (!hasInitializedJobs) {
            hasInitializedJobs = true
            if (completedJobs.value.some(job => job.paymentStatus === 'PAID' && !job.paymentConfirmed)) {
                activeTab.value = 'completed'
            }
        }

    } catch (error) {
        console.error("ดึงข้อมูลงานซ่อมล้มเหลว:", error)
        jobLoadError.value = error.response?.data?.detail || 'โหลดรายการงานไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'
    } finally {
        isLoadingJobs.value = false
    }
}

// 3. ยืนยันรับงาน (เปลี่ยนสถานะเป็น IN_PROGRESS)
const handleAcceptJob = async (job) => {
    if (!isLocationReady.value) {
        $q.notify({
            type: 'warning',
            message: 'ต้องเปิดใช้งานตำแหน่ง GPS ก่อนรับงาน',
            icon: 'location_off'
        })
        return
    }

    // 🟢 ตรวจสอบและดึงไอดีงานให้ครอบคลุมทุกกรณี
    const jobId = job?.id || job?.job_id

    if (!jobId) {
        $q.notify({
            type: 'negative',
            message: 'ไม่พบรหัสออเดอร์งาน (Job ID) ที่ต้องการรับ',
            icon: 'error'
        })
        return
    }

    try {
        isSubmitting.value = true
        // 🟢 ส่ง Request ไปยัง Endpoint รับงานของ Backend
        await api.patch(`/jobs/${jobId}/accept`)

        $q.notify({
            type: 'positive',
            message: `รับงานออเดอร์ #${job.orderNo || job.order_no || jobId} เรียบร้อยแล้ว!`,
            icon: 'check_circle'
        })

        // โหลดข้อมูลงานใหม่และสลับไปแท็บ "งานที่กำลังทำ"
        await fetchMyJobs()
        activeTab.value = 'ongoing'
    } catch (error) {
        console.error("รับงานไม่สำเร็จ:", error)
        $q.notify({
            type: 'negative',
            message: error.response?.data?.detail || 'เกิดข้อผิดพลาดในการรับงาน',
            icon: 'error'
        })
    } finally {
        isSubmitting.value = false
    }
}

const handleRejectScheduledJob = (job) => {
    const jobId = job?.id || job?.job_id
    if (!jobId) {
        $q.notify({
            type: 'negative',
            message: 'ไม่พบรหัสออเดอร์งานที่ต้องการปฏิเสธ',
            icon: 'error'
        })
        return
    }

    $q.dialog({
        title: 'ยืนยันการปฏิเสธงาน',
        message: `ต้องการปฏิเสธงาน #${job.orderNo || job.order_no || jobId} ใช่หรือไม่? เมื่อตกลงแล้วจะไม่สามารถรับงานนี้ได้อีก`,
        cancel: {
            label: 'กลับไปตรวจสอบ',
            flat: true,
        },
        ok: {
            label: 'ยืนยันปฏิเสธงาน',
            color: 'negative',
            unelevated: true,
        },
        persistent: true,
    }).onOk(async () => {
        try {
            isSubmitting.value = true
            await api.patch(`/jobs/${jobId}/reject`)
            $q.notify({
                type: 'positive',
                message: `ปฏิเสธงาน #${job.orderNo || job.order_no || jobId} เรียบร้อยแล้ว`,
                icon: 'check_circle'
            })
            await fetchMyJobs()
        } catch (error) {
            console.error('ปฏิเสธงานไม่สำเร็จ:', error)
            $q.notify({
                type: 'negative',
                message: error.response?.data?.detail || 'เกิดข้อผิดพลาดในการปฏิเสธงาน',
                icon: 'error'
            })
        } finally {
            isSubmitting.value = false
        }
    })
}

const handleStartWork = async () => {
    const job = ongoingJob.value
    const jobId = job?.id || job?.job_id
    if (!jobId) {
        $q.notify({ type: 'negative', message: 'ไม่พบหมายเลขงานที่จะเริ่มตรวจเช็ค', icon: 'error' })
        return
    }
    if (job.status !== 'IN_PROGRESS') return
    if (!isLocationReady.value) {
        $q.notify({
            type: 'warning',
            message: 'ต้องเปิดใช้งานตำแหน่ง GPS ก่อนเริ่มงาน',
            icon: 'location_off'
        })
        return
    }

    try {
        isSubmitting.value = true
        await api.patch(`/jobs/${jobId}/start-work`)
        $q.notify({
            type: 'positive',
            message: 'เริ่มตรวจเช็คและซ่อมแซมแล้ว ลูกค้าจะเห็นสถานะนี้ในหน้าติดตาม',
            icon: 'build_circle'
        })
        await fetchMyJobs()
    } catch (error) {
        console.error('เริ่มตรวจเช็คและซ่อมแซมไม่สำเร็จ:', error)
        $q.notify({
            type: 'negative',
            message: error.response?.data?.detail || 'ไม่สามารถเริ่มงานได้ กรุณาลองอีกครั้ง',
            icon: 'error'
        })
    } finally {
        isSubmitting.value = false
    }
}

const confirmCustomerPayment = (job) => {
    const jobId = job?.id || job?.job_id
    if (!jobId || job.paymentStatus !== 'PAID' || job.paymentConfirmed) return

    $q.dialog({
        title: 'ยืนยันการรับชำระเงิน',
        message: `ยืนยันว่าได้รับ ฿${Number(job.paymentAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} จากลูกค้าสำหรับงาน #${job.orderNo || job.order_no || jobId} แล้วใช่หรือไม่?`,
        cancel: { label: 'กลับไปตรวจสอบ', flat: true },
        ok: { label: 'ยืนยันรับเงินและจบงาน', color: 'positive', unelevated: true },
        persistent: true,
    }).onOk(async () => {
        try {
            confirmingPaymentJobId.value = jobId
            await api.post(`/jobs/${jobId}/confirm-payment`)
            $q.notify({
                type: 'positive',
                message: 'ยืนยันรับเงินและจบงานเรียบร้อยแล้ว',
                icon: 'task_alt',
            })
            await fetchMyJobs()
            await fetchPaymentHistory()
            activeTab.value = 'completed'
        } catch (error) {
            console.error('ยืนยันรับเงินจากลูกค้าไม่สำเร็จ:', error)
            $q.notify({
                type: 'negative',
                message: error.response?.data?.detail || 'ยืนยันรับเงินไม่สำเร็จ กรุณาลองอีกครั้ง',
                icon: 'error',
            })
        } finally {
            confirmingPaymentJobId.value = null
        }
    })
}

// 4. ปิดงานซ่อม (เปลี่ยนสถานะเป็น COMPLETED)
const completeJob = async (invoiceData) => {
    const job = ongoingJob.value
    const jobId = job?.id || job?.job_id
    const orderNo = job?.orderNo || job?.order_no || jobId

    if (!jobId || !orderNo) {
        $q.notify({
            type: 'negative',
            message: 'ไม่พบหมายเลขงานสำหรับปิดงานและออกบิล',
            icon: 'error'
        })
        return
    }

    try {
        isSubmitting.value = true
        await api.patch(`/jobs/${jobId}/complete`, {
            work_items: invoiceData.items,
            total_amount: invoiceData.total,
            invoice_file_name: invoiceData.fileName,
        })

        openTechChat(job)
        pendingInvoice.value = {
            id: `${orderNo}-invoice`,
            orderId: orderNo,
            fileName: invoiceData.fileName,
            pdfBase64: invoiceData.pdfBase64,
            items: invoiceData.items,
            total: invoiceData.total,
            technician: {
                id: techProfile.value.id,
                name: technicianDisplayName.value,
                avatarUrl: techProfile.value.avatarUrl,
                specialty: techProfile.value.skills,
            },
        }
        isCompletionDialogOpen.value = false
        $q.notify({
            type: 'positive',
            message: 'ปิดงานเรียบร้อย กำลังส่งใบสรุปค่าบริการให้ลูกค้าทางแชท',
            icon: 'task_alt'
        })

        await fetchMyJobs()
        activeTab.value = 'ongoing'
    } catch (error) {
        console.error("ปิดงานไม่สำเร็จ:", error)
        $q.notify({
            type: 'negative',
            message: 'ไม่สามารถบันทึกปิดงานได้',
            icon: 'error'
        })
    } finally {
        isSubmitting.value = false
    }
}

// 🟢 ฟังก์ชันเปิดหน้าต่างแชทฝั่งช่าง
const openTechChat = (job) => {
    const orderNo = job.orderNo || job.order_no
    if (!orderNo) {
        $q.notify({ type: 'negative', message: 'ไม่พบหมายเลขงาน จึงไม่สามารถเปิดแชทได้' })
        return
    }
    activeOrderNo.value = orderNo
    activeCustomerInfo.value = {
        name: job.customerName || 'ลูกค้า FixMatch',
        avatarUrl: job.customerAvatarUrl || 'https://cdn.quasar.dev/img/avatar.png',
        specialty: `เคส: ${job.issueDescription || 'แจ้งซ่อมทั่วไป'}`,
        phone: job.customerPhone || ''
    }
    isChatOpen.value = true
}

const handleToggleOnline = (val) => {
    if (val && !isLocationReady.value) {
        isOnline.value = false
        $q.notify({
            type: 'warning',
            message: 'ต้องเปิดใช้งานตำแหน่ง GPS ก่อนเปิดรับงาน',
            icon: 'location_off'
        })
        return
    }

    isOnline.value = val
    $q.notify({
        type: val ? 'positive' : 'warning',
        message: val ? 'เปิดระบบรับงานออนไลน์แล้ว' : 'ปิดระบบรับงานชั่วคราว',
        timeout: 1200
    })

    if (val) {
        fetchMyJobs()
        startAutoRefresh()
    } else {
        stopAutoRefresh()
    }
}

const publishTechnicianLocation = async (position) => {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('ตำแหน่ง GPS ที่ได้รับไม่ถูกต้อง')
    }
    if (isPublishingLocation) return

    latestCoordinates = { latitude, longitude }
    isPublishingLocation = true
    try {
        await api.put('/technicians/location', latestCoordinates)
        locationError.value = ''
        isLocationReady.value = true
        if (!hasPublishedInitialLocation) {
            hasPublishedInitialLocation = true
            isOnline.value = true
            fetchMyJobs()
        }
    } catch (error) {
        console.error('ส่งตำแหน่ง GPS ของช่างไปยังระบบไม่สำเร็จ:', error)
        isLocationReady.value = false
        isOnline.value = false
        locationError.value = error.response?.data?.detail || 'บันทึกตำแหน่ง GPS ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'
    } finally {
        isPublishingLocation = false
    }
}

const handleLocationError = (error) => {
    console.error('ระบุตำแหน่ง GPS ของช่างไม่สำเร็จ:', error)
    latestCoordinates = null
    isLocationReady.value = false
    isOnline.value = false
    locationError.value = error.code === error.PERMISSION_DENIED
        ? 'กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์'
        : error.code === error.TIMEOUT
            ? 'ค้นหาตำแหน่ง GPS ไม่ทันเวลา กรุณาลองอีกครั้ง'
            : 'ไม่สามารถระบุตำแหน่ง GPS ได้ ตรวจสอบ GPS และอินเทอร์เน็ต'
}

const startLocationTracking = () => {
    if (!navigator.geolocation) {
        locationError.value = 'เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง GPS'
        isOnline.value = false
        return
    }

    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
        locationWatchId = null
    }
    if (locationHeartbeatTimer) {
        clearInterval(locationHeartbeatTimer)
        locationHeartbeatTimer = null
    }

    locationError.value = ''
    isLocationReady.value = false
    latestCoordinates = null
    locationWatchId = navigator.geolocation.watchPosition(
        publishTechnicianLocation,
        handleLocationError,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
    locationHeartbeatTimer = setInterval(() => {
        if (latestCoordinates && !isPublishingLocation) {
            publishTechnicianLocation({ coords: latestCoordinates })
        }
    }, 15000)
}

const stopLocationTracking = () => {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
        locationWatchId = null
    }
    if (locationHeartbeatTimer) {
        clearInterval(locationHeartbeatTimer)
        locationHeartbeatTimer = null
    }
    isLocationReady.value = false
    isOnline.value = false
}

const startAutoRefresh = () => {
    stopAutoRefresh()
    refreshTimer = setInterval(fetchMyJobs, 10000)
}

const stopAutoRefresh = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
    }
}

const openGPSNavigation = (lat, lng) => {
    if (!lat || !lng) {
        $q.notify({
            type: 'warning',
            message: 'ไม่พบพิกัด GPS สำหรับการนำทาง',
            icon: 'location_off'
        })
        return
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const mapsUrl = isIOS
        ? `https://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

    const link = document.createElement('a')
    link.href = mapsUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const handleRejectJob = () => {
    isIncomingJobModalOpen.value = false
}

onMounted(() => {
    fetchMyProfile()
    if (!isPaymentHistoryPage.value) {
        fetchMyJobs()
        startLocationTracking()
        startAutoRefresh()
    }
    if (isPaymentHistoryPage.value) fetchPaymentHistory()
})

onUnmounted(() => {
    stopAutoRefresh()
    stopLocationTracking()
})
</script>

<style scoped>
/* Style คงเดิม */
.job-board-page {
    background-color: #f8fafc;
    min-height: 100vh;
    padding: 1.25rem 0.875rem;
}

.location-sharing-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0.35rem 0 0;
    color: #047857;
    font-size: 0.75rem;
    font-weight: 600;
}

.location-sharing-status.location-sharing-error {
    color: #b91c1c;
}

@media (min-width: 640px) {
    .job-board-page {
        padding: 1.75rem 1.25rem;
    }
}

@media (min-width: 1024px) {
    .job-board-page {
        padding: 2.25rem 1.5rem;
    }
}

.job-board-container {
    max-width: 42rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.status-banner {
    border-radius: 1.25rem !important;
    border: 1px solid #e2e8f0;
    padding: 1rem 1.25rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.banner-online {
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(209, 250, 229, 0.6));
    border-color: #a7f3d0;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.1);
}

.banner-offline {
    background-color: #ffffff;
    border-color: #e2e8f0;
}

.banner-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.profile-info {
    display: flex;
    align-items: center;
    gap: 0.875rem;
}

.avatar-wrapper {
    position: relative;
    display: inline-block;
    flex-shrink: 0;
}

.profile-avatar {
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 9999px;
    border: 2px solid #ffffff;
}

.dot-online {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.dot-offline {
    background-color: #94a3b8;
}

.profile-text {
    display: flex;
    flex-direction: column;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.tech-name {
    font-size: 0.9375rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.01em;
}

@media (min-width: 640px) {
    .tech-name {
        font-size: 1.125rem;
    }
}

.icon-verified {
    color: #0284c7;
    flex-shrink: 0;
}

.status-label {
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 0.125rem;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.text-online {
    color: #047857;
}

.text-offline {
    color: #64748b;
}

.pulse-indicator {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background-color: #10b981;
    animation: pulse 1.8s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }

    70% {
        transform: scale(1);
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }

    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
}

.toggle-wrapper {
    flex-shrink: 0;
}

@media (max-width: 599px) {
    .status-banner {
        padding: 1rem;
    }

    .banner-body {
        align-items: center;
        gap: 0.5rem;
    }

    .profile-info {
        flex: 1;
        min-width: 0;
        gap: 0.75rem;
    }

    .profile-text {
        flex: 1;
        min-width: 0;
        gap: 0.125rem;
    }

    .name-row {
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .tech-name {
        overflow-wrap: anywhere;
    }

    .profile-text > .text-caption {
        line-height: 1.5;
        overflow-wrap: anywhere;
    }

    .status-label {
        align-items: flex-start;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }

    .location-sharing-status {
        align-items: flex-start;
        line-height: 1.5;
    }

    .location-sharing-status > span {
        flex: 1;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .toggle-wrapper {
        align-self: center;
    }
}

.tab-bar {
    display: flex;
    gap: 0.375rem;
    padding: 0.375rem;
    background-color: #f1f5f9;
    border-radius: 0.875rem;
    border: 1px solid #e2e8f0;
}

.tab-btn {
    flex: 1;
    padding: 0.625rem 0;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 0.625rem;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    transition: all 0.2s ease;
}

@media (min-width: 640px) {
    .tab-btn {
        font-size: 0.8125rem;
    }
}

.tab-btn:hover {
    color: #1e293b;
}

.tab-btn-active {
    background-color: #ffffff;
    color: #0f172a;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.tab-badge {
    font-size: 0.6875rem !important;
    font-weight: 700 !important;
    padding: 0.125rem 0.5rem !important;
}

.tab-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.empty-state-card {
    text-align: center;
    padding: 3rem 1.5rem;
    background-color: #ffffff;
    border-radius: 1.25rem;
    border: 1px dashed #cbd5e1;
}

.empty-icon {
    color: #cbd5e1;
    margin-bottom: 0.75rem;
}

.empty-title {
    font-size: 1rem;
    font-weight: 800;
    color: #334155;
    margin: 0;
}

.empty-desc {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

.ongoing-card {
    border-radius: 1.25rem !important;
    border: 1px solid #a7f3d0;
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.6), #ffffff);
    padding: 1.25rem;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08);
}

.completed-jobs-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.completed-jobs-title {
    margin: 0;
    color: #0f172a;
    font-size: 1rem;
    font-weight: 800;
}

.payment-confirmation-card {
    border-color: #bfdbfe;
    background: #ffffff;
}

.payment-received-chip {
    color: #047857;
    background-color: #d1fae5;
}

.payment-confirmed-note,
.waiting-payment-note {
    padding: 0.75rem;
    border-radius: 0.75rem;
    color: #047857;
    background: #ecfdf5;
    font-size: 0.8125rem;
    font-weight: 700;
    text-align: center;
}

.waiting-payment-note {
    color: #64748b;
    background: #f1f5f9;
}

.payment-history-card {
    border: 1px solid #dbeafe;
    border-radius: 1.125rem !important;
    padding: 1rem;
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.04);
}

.payment-history-header,
.payment-history-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.payment-history-header {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
}

.payment-customer {
    margin: 0;
    color: #0f172a;
    font-size: 0.9375rem;
    font-weight: 800;
}

.payment-customer-phone {
    margin: 0.125rem 0 0;
    color: #475569;
    font-size: 0.75rem;
}

.payment-order {
    margin: 0.125rem 0 0;
    color: #64748b;
    font-family: monospace;
    font-size: 0.75rem;
}

.payment-history-details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.625rem;
    padding: 0.875rem 0;
}

.payment-detail {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: #475569;
    font-size: 0.75rem;
}

.payment-detail .q-icon {
    color: #64748b;
    font-size: 1rem;
}

.payment-history-footer {
    padding-top: 0.75rem;
    border-top: 1px solid #e2e8f0;
}

.payment-amount-label {
    color: #64748b;
    font-size: 0.6875rem;
    font-weight: 600;
}

.payment-amount {
    color: #047857;
    font-size: 1.125rem;
    font-weight: 800;
}

@media (max-width: 599px) {
    .tab-bar {
        align-items: stretch;
        gap: 0.25rem;
        padding: 0.25rem;
    }

    .tab-btn {
        min-width: 0;
        min-height: 3.75rem;
        flex-wrap: wrap;
        align-content: center;
        gap: 0.25rem;
        padding: 0.5rem 0.25rem;
        text-align: center;
        line-height: 1.4;
    }

    .tab-btn > span {
        overflow-wrap: anywhere;
    }

    .tab-badge {
        flex: 0 0 auto;
    }

    .completed-jobs-title {
        font-size: 0.9375rem;
        line-height: 1.5;
    }

    .payment-confirmation-card {
        padding: 1rem;
    }

    .payment-confirmation-card .ongoing-header {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.875rem;
    }

    .payment-confirmation-card .status-chip {
        max-width: 100%;
        align-items: flex-start;
        border-radius: 0.75rem;
        line-height: 1.5;
        white-space: normal;
    }

    .payment-confirmation-card .status-chip span:last-child {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .payment-confirmation-card .live-dot {
        flex: 0 0 0.5rem;
        margin-top: 0.3rem;
    }

    .payment-confirmation-card .order-no {
        width: 100%;
        overflow-wrap: anywhere;
        line-height: 1.5;
    }

    .payment-confirmation-card .ongoing-title {
        font-size: 1rem;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }

    .payment-confirmation-card .meta-item {
        align-items: flex-start;
        line-height: 1.5;
    }

    .payment-confirmation-card .meta-item span {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .payment-confirmed-note,
    .waiting-payment-note {
        line-height: 1.6;
        overflow-wrap: anywhere;
    }
}

@media (min-width: 640px) {
    .ongoing-card {
        padding: 1.5rem;
    }
}

.ongoing-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #e6f4ed;
}

.status-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 800;
    color: #047857;
    background-color: #d1fae5;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
}

.live-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
    background-color: #10b981;
}

.order-no {
    font-size: 0.75rem;
    font-family: monospace;
    font-weight: 700;
    color: #64748b;
}

.ongoing-body {
    margin-bottom: 1.25rem;
}

.ongoing-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 0.75rem 0;
    line-height: 1.35;
}

.job-meta-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

@media (min-width: 640px) {
    .job-meta-row {
        flex-direction: row;
        gap: 1.25rem;
    }
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
}

.meta-icon {
    color: #64748b;
    flex-shrink: 0;
}

.icon-red {
    color: #f43f5e;
}

.btn-complete-job {
    width: 100%;
    padding: 0.875rem 0 !important;
    background-color: #059669 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.9375rem !important;
    border-radius: 0.875rem !important;
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25) !important;
    transition: all 0.2s ease !important;
}

.repairing-status-note {
    margin: 0 0 0.75rem;
    color: #047857;
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: center;
}

.btn-complete-job:hover {
    background-color: #047857 !important;
    box-shadow: 0 6px 16px rgba(5, 150, 105, 0.3) !important;
}

.mr-1 {
    margin-right: 0.375rem;
}

:deep(.q-toggle__inner--active .q-toggle__track) {
    opacity: 1;
}
</style>
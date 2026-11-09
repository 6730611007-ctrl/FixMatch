<template>
    <q-page class="customer-bookings-page font-sans">
        <div class="bookings-container">
            <!-- Header Title -->
            <div class="page-header">
                <h1 class="page-title">ประวัติการแจ้งซ่อม & สถานะงาน</h1>
                <p class="page-subtitle">ตรวจสอบรายการนัดหมายและติดต่อพูดคุยกับช่างผู้รับผิดชอบ</p>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="text-center q-pa-xl">
                <q-spinner-dots color="primary" size="48px" />
                <p class="text-grey-6 q-mt-sm">กำลังโหลดข้อมูลประวัติการซ่อม...</p>
            </div>

            <div v-else-if="hasLoadError && jobList.length === 0" class="empty-card">
                <q-icon name="cloud_off" size="56px" class="empty-icon" />
                <h3 class="empty-title">โหลดประวัติการจองไม่สำเร็จ</h3>
                <p class="empty-desc">ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
                <q-btn unelevated no-caps color="primary" class="q-mt-md rounded-xl px-4" @click="fetchCustomerJobs">
                    ลองโหลดอีกครั้ง
                </q-btn>
            </div>

            <!-- Empty State -->
            <div v-else-if="jobList.length === 0" class="empty-card">
                <q-icon name="history_toggle_off" size="56px" class="empty-icon" />
                <h3 class="empty-title">ยังไม่มีประวัติการแจ้งซ่อม</h3>
                <p class="empty-desc">คุณยังไม่ได้ทำรายการแจ้งซ่อมหรือจองคิวช่างในระบบ</p>
                <q-btn unelevated no-caps color="primary" class="q-mt-md rounded-xl px-4" to="/diagnostic">
                    แจ้งซ่อม / วิเคราะห์ปัญหาเลย
                </q-btn>
            </div>

            <!-- Job List Cards -->
            <div v-else class="job-list">
                <q-card v-for="job in jobList" :key="job.orderNo || job.order_no || job.orderId || job.id"
                    flat class="job-card">
                    <!-- Card Top: Status & Order No -->
                    <div class="job-card-header">
                        <div class="status-badge" :class="getStatusClass(job)">
                            <span class="status-dot"></span>
                            <span>{{ getStatusText(job) }}</span>
                        </div>
                        <span class="order-id">#{{ job.orderNo || job.order_no }}</span>
                    </div>

                    <!-- Job Details -->
                    <div class="job-body">
                        <h2 class="job-issue-title">{{ job.issueDescription || 'งานบริการซ่อมแซมทั่วไป' }}</h2>

                        <div class="job-meta-list">
                            <div class="meta-row">
                                <q-icon name="event" size="16px" class="meta-icon" />
                                <span>นัดหมาย: <strong>{{ job.appointmentDate }}</strong> | เวลา <strong>{{
                                    job.appointmentTime }} น.</strong></span>
                            </div>
                            <div class="meta-row">
                                <q-icon name="location_on" size="16px" class="meta-icon text-rose" />
                                <span>{{ job.address }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="job.paymentConfirmed" class="payment-confirmed-banner">
                        <q-icon name="task_alt" size="18px" />
                        <span>
                            ให้บริการเสร็จสิ้น — ช่างยืนยันรับชำระเงินแล้ว
                            <template v-if="job.paymentConfirmedAt">
                                ({{ formatPaymentTime(job.paymentConfirmedAt) }})
                            </template>
                        </span>
                    </div>
                    <div v-else-if="isJobCompleted(job)" class="payment-pending-banner">
                        <q-icon name="hourglass_top" size="18px" />
                        <span>งานซ่อมเสร็จแล้ว กำลังรอช่างยืนยันการรับชำระเงิน</span>
                    </div>

                    <q-separator class="q-my-md" />

                    <!-- Technician Info & Quick Chat Action -->
                    <div class="tech-section">
                        <div class="tech-profile-info">
                            <q-avatar size="42px" class="tech-avatar">
                                <img :src="getBookingTechnician(job).avatarUrl" @error="onAvatarError"
                                    :alt="getBookingTechnician(job).name" />
                            </q-avatar>
                            <div>
                                <div class="tech-name-row">
                                    <span class="tech-name">{{ getBookingTechnician(job).name }}</span>
                                    <q-icon v-if="hasAssignedTechnician(job)"
                                        name="verified" size="14px" class="verified-icon" />
                                </div>
                                <span class="tech-specialty">{{ getBookingTechnician(job).specialty }}</span>
                            </div>
                        </div>

                        <!-- Actions: Call & Chat -->
                        <div class="action-buttons">
                            <a v-if="getBookingTechnician(job).phone"
                                :href="`tel:${getBookingTechnician(job).phone}`" class="btn-call-sm"
                                title="โทรหาช่าง">
                                <q-icon name="call" size="18px" />
                            </a>
                            <q-btn unelevated no-caps class="btn-chat-sm" :disable="!canContactTechnician(job)"
                                @click="openChat(job)">
                                <q-icon name="chat" size="16px" class="q-mr-xs" />
                                <span>{{ canContactTechnician(job) ? 'แชทกับช่าง' : job.status === 'REJECTED' ? 'ช่างปฏิเสธงาน' : 'รอช่างรับงาน' }}</span>
                            </q-btn>
                        </div>
                    </div>
                </q-card>
            </div>
        </div>

        <!-- Live Chat Modal Sheet Integration -->
        <LiveChatSheet v-model="isChatOpen" :orderId="activeOrderNo" :technician="activeTechnician"
            :issueTitle="activeIssueTitle" />
    </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '../boot/axios'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import LiveChatSheet from '../components/chat/LiveChatSheet.vue'
import { getCustomerBookingHistory, mergeCustomerBookingHistory } from '@/services/customerBookingHistory'
import { DEFAULT_TECHNICIAN_AVATAR, normalizeTechnicianProfile } from '@/services/technicianProfile'

const $q = useQuasar()
const authStore = useAuthStore()

const isLoading = ref(false)
const hasLoadError = ref(false)
const jobList = ref([])
const isFetchingCustomerJobs = ref(false)
let refreshInterval = null

// Chat Control States
const isChatOpen = ref(false)
const activeOrderNo = ref('')
const activeIssueTitle = ref('งานซ่อมแซม')

const DEFAULT_AVATAR = DEFAULT_TECHNICIAN_AVATAR

const activeTechnician = ref({
    name: 'ช่างเทคนิค',
    avatarUrl: DEFAULT_AVATAR,
    specialty: 'ผู้เชี่ยวชาญ',
    phone: ''
})

const fetchCustomerJobs = async ({ silent = false } = {}) => {
    if (isFetchingCustomerJobs.value) return
    isFetchingCustomerJobs.value = true
    let savedBookings = []
    hasLoadError.value = false

    try {
        savedBookings = getCustomerBookingHistory(authStore.user)
        if (!silent) jobList.value = savedBookings
    } catch (error) {
        console.error('ไม่สามารถอ่านประวัติการจองที่บันทึกไว้ได้:', error)
        $q.notify({
            type: 'warning',
            message: 'ไม่สามารถอ่านประวัติการจองที่บันทึกไว้ในอุปกรณ์ได้',
            icon: 'warning'
        })
    }

    try {
        isLoading.value = !silent && savedBookings.length === 0

        const response = await api.get('/jobs/customer/my-jobs', { timeout: 15000 })

        const serverBookings = response.data?.data || response.data || []
        if (!Array.isArray(serverBookings)) {
            throw new Error('รูปแบบข้อมูลประวัติการจองจากเซิร์ฟเวอร์ไม่ถูกต้อง')
        }

        jobList.value = mergeCustomerBookingHistory(serverBookings, [
            ...savedBookings,
            ...(silent ? jobList.value : []),
        ])
    } catch (error) {
        console.error('ไม่สามารถดึงข้อมูลประวัติการซ่อมได้:', error)
        if (!silent) {
            jobList.value = savedBookings
            hasLoadError.value = savedBookings.length === 0
            $q.notify({
                type: savedBookings.length ? 'warning' : 'negative',
                message: savedBookings.length
                    ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กำลังแสดงประวัติที่บันทึกไว้ในอุปกรณ์'
                    : 'ไม่สามารถโหลดประวัติการแจ้งซ่อมได้ กรุณาลองใหม่อีกครั้ง',
                icon: savedBookings.length ? 'warning' : 'error'
            })
        }
    } finally {
        isLoading.value = false
        isFetchingCustomerJobs.value = false
    }
}

// 🟢 ปรับปรุงการแปลง URL รูปช่างเทคนิคเพื่อรองรับไฟล์ใน backend/uploads/
const getBookingTechnician = (job) => normalizeTechnicianProfile(job.technician || {
    id: job.technicianId || job.technician_id,
    name: job.technicianName || job.technician_name,
    avatar: job.technicianAvatar || job.technician_avatar || job.avatar_url,
    specialty: job.technicianSpecialty || job.technician_specialty,
    phone: job.technicianPhone || job.technician_phone,
}) || {
    id: null,
    name: 'กำลังรอช่างรับงาน',
    avatarUrl: DEFAULT_AVATAR,
    specialty: 'ช่างผู้เชี่ยวชาญ FixMatch',
}

const hasAssignedTechnician = (job) => {
    const technician = job.technician
    if (technician) {
        return Boolean(
            technician.id
            || technician.technician_id
            || technician.technicianId
            || technician.name
            || technician.fullName
            || technician.full_name
            || technician.technician_name,
        )
    }

    return Boolean(
        job.technicianId
        || job.technician_id
        || job.technicianName
        || job.technician_name,
    )
}

const onAvatarError = (evt) => {
    evt.target.src = DEFAULT_AVATAR
}

const getStatusText = (job) => {
    const status = String(job.status || '').toUpperCase()
    if (job.paymentConfirmed) {
        return 'บริการเสร็จสิ้น'
    }
    if (isJobCompleted(job)) return 'ซ่อมเสร็จ รอยืนยันรับเงิน'

    switch (status) {
        case 'CONFIRMED': return 'ยืนยันนัดหมายแล้ว'
        case 'IN_PROGRESS': return 'ช่างกำลังปฏิบัติงาน'
        case 'REPAIRING': return 'ช่างกำลังตรวจเช็คและซ่อมแซม'
        case 'REJECTED': return 'ช่างปฏิเสธงาน'
        default: return 'รอดำเนินการ'
    }
}

const isJobCompleted = (job) => ['COMPLETED', 'DONE', 'FINISHED'].includes(String(job.status || '').toUpperCase())

const getStatusClass = (job) => {
    if (job.paymentConfirmed) return 'status-completed'
    if (isJobCompleted(job)) return 'status-awaiting-payment'
    switch (String(job.status || '').toUpperCase()) {
        case 'CONFIRMED': return 'status-confirmed'
        case 'IN_PROGRESS': return 'status-progress'
        case 'REPAIRING': return 'status-progress'
        case 'REJECTED': return 'status-rejected'
        default: return 'status-default'
    }
}

const formatPaymentTime = (value) => {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return ''
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}

const canContactTechnician = (job) => {
    const orderId = job.orderNo || job.order_no || job.orderId || job.id
    const technician = getBookingTechnician(job)
    return Boolean(job.status !== 'REJECTED' && orderId && hasAssignedTechnician(job)
        && (technician.id || technician.phone || technician.name))
}

const openChat = (job) => {
    if (!canContactTechnician(job)) return

    activeOrderNo.value = job.orderNo || job.order_no || job.orderId || job.id
    activeIssueTitle.value = job.issueDescription || 'งานบริการซ่อมแซม'
    const technician = getBookingTechnician(job)
    activeTechnician.value = {
        name: technician.name,
        avatarUrl: technician.avatarUrl,
        specialty: technician.specialty,
        phone: technician.phone || ''
    }
    isChatOpen.value = true
}

const refreshWhenVisible = () => {
    if (document.visibilityState === 'visible') fetchCustomerJobs({ silent: true })
}

onMounted(() => {
    fetchCustomerJobs()
    refreshInterval = window.setInterval(refreshWhenVisible, 15000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
})

onUnmounted(() => {
    if (refreshInterval !== null) window.clearInterval(refreshInterval)
    window.removeEventListener('focus', refreshWhenVisible)
    document.removeEventListener('visibilitychange', refreshWhenVisible)
})
</script>

<style scoped>
.customer-bookings-page {
    background-color: #f8fafc;
    min-height: 100vh;
    padding: 1.5rem 1rem;
}

.bookings-container {
    max-width: 672px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.page-header {
    margin-bottom: 0.5rem;
}

.page-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}

.page-subtitle {
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0.25rem 0 0 0;
}

.empty-card {
    text-align: center;
    padding: 3rem 1.5rem;
    background-color: #ffffff;
    border-radius: 1.25rem;
    border: 1px dashed #cbd5e1;
}

.empty-icon {
    color: #94a3b8;
    margin-bottom: 0.75rem;
}

.empty-title {
    font-size: 1rem;
    font-weight: 700;
    color: #334155;
    margin: 0;
}

.empty-desc {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
}

.job-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.job-card {
    background-color: #ffffff;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.payment-confirmed-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    border: 1px solid #a7f3d0;
    border-radius: 0.75rem;
    background: #ecfdf5;
    color: #047857;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1.5;
}

.payment-confirmed-banner :deep(.q-icon) {
    flex: 0 0 auto;
}

.job-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.875rem;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
}

.status-confirmed {
    background-color: #fef3c7;
    color: #d97706;
}

.status-progress {
    background-color: #e0f2fe;
    color: #0284c7;
}

.status-completed {
    background-color: #d1fae5;
    color: #059669;
}

.status-awaiting-payment,
.payment-pending-banner {
    background-color: #fffbeb;
    color: #b45309;
}

.payment-pending-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    border: 1px solid #fde68a;
    border-radius: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1.5;
}

.payment-pending-banner :deep(.q-icon) {
    flex: 0 0 auto;
}

.status-default {
    background-color: #f1f5f9;
    color: #64748b;
}

.status-rejected {
    background-color: #fee2e2;
    color: #b91c1c;
}

.status-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background-color: currentColor;
}

.order-id {
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
}

.job-issue-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.5rem 0;
}

.job-meta-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: #475569;
}

.meta-icon {
    color: #64748b;
    flex-shrink: 0;
}

.text-rose {
    color: #f43f5e;
}

.tech-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.tech-profile-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.tech-avatar {
    border: 1px solid #e2e8f0;
}

.tech-name-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.tech-name {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1e293b;
}

.verified-icon {
    color: #0284c7;
}

.tech-specialty {
    font-size: 0.75rem;
    color: #64748b;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-call-sm {
    width: 36px;
    height: 36px;
    border-radius: 0.625rem;
    background-color: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #334155;
    text-decoration: none;
    transition: background-color 0.2s ease;
}

.btn-call-sm:hover {
    background-color: #e2e8f0;
}

.btn-chat-sm {
    padding: 0.375rem 0.875rem !important;
    background-color: #0284c7 !important;
    color: #ffffff !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    border-radius: 0.625rem !important;
}

@media (max-width: 599px) {
    .customer-bookings-page {
        padding: 1.25rem 0.75rem;
    }

    .bookings-container {
        gap: 1rem;
    }

    .page-title {
        font-size: 1.125rem;
        line-height: 1.5;
        text-wrap: balance;
    }

    .page-subtitle {
        margin-top: 0.375rem;
        line-height: 1.6;
    }

    .job-card {
        padding: 1rem;
    }

    .job-card-header {
        align-items: flex-start;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .status-badge {
        max-width: 100%;
        line-height: 1.4;
    }

    .order-id {
        width: 100%;
        overflow-wrap: anywhere;
        line-height: 1.5;
    }

    .job-issue-title {
        font-size: 0.9375rem;
        line-height: 1.5;
        overflow-wrap: anywhere;
    }

    .meta-row {
        align-items: flex-start;
        line-height: 1.55;
    }

    .meta-row span {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .payment-confirmed-banner,
    .payment-pending-banner {
        line-height: 1.6;
        overflow-wrap: anywhere;
    }

    .tech-section {
        align-items: stretch;
        flex-direction: column;
        gap: 0.875rem;
    }

    .tech-profile-info {
        min-width: 0;
    }

    .tech-profile-info > div {
        min-width: 0;
    }

    .tech-name-row {
        flex-wrap: wrap;
    }

    .tech-name,
    .tech-specialty {
        overflow-wrap: anywhere;
    }

    .action-buttons {
        width: 100%;
    }

    .btn-call-sm {
        width: 44px;
        height: 44px;
        flex: 0 0 44px;
    }

    .btn-chat-sm {
        min-height: 44px;
        flex: 1;
    }
}
</style>
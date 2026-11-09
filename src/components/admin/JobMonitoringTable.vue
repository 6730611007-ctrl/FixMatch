<template>
    <q-card flat class="monitoring-card">
        <!-- Header & Filter Navigation -->
        <div class="monitoring-header">
            <div class="header-text">
                <h2 class="monitoring-title">ติดตามสถานะงานซ่อมทั้งหมด (Real-time Monitor)</h2>
                <p class="monitoring-subtitle">
                    ข้อมูลจากรายการงานจริง อัปเดตล่าสุด {{ lastUpdated || 'กำลังโหลด...' }}
                </p>
                <p v-if="loadError && jobs.length > 0" class="refresh-error">
                    อัปเดตสถานะล่าสุดไม่สำเร็จ: {{ loadError }}
                </p>
            </div>

            <!-- Filter Buttons Bar -->
            <div class="filter-bar">
                <q-btn flat round dense icon="refresh" color="primary" :loading="isLoading" aria-label="รีเฟรชรายการงาน"
                    @click="fetchJobs" />
                <button v-for="filter in filterOptions" :key="filter.value" @click="activeFilter = filter.value"
                    type="button" class="filter-btn" :class="{ 'filter-btn-active': activeFilter === filter.value }">
                    {{ filter.label }}
                </button>
            </div>
        </div>

        <!-- Table Container -->
        <div v-if="isLoading && jobs.length === 0" class="table-state">
            <q-spinner-dots color="primary" size="36px" />
            <span>กำลังโหลดสถานะงานจริงจากระบบ...</span>
        </div>
        <div v-else-if="loadError && jobs.length === 0" class="table-state table-error">
            <q-icon name="error_outline" size="30px" />
            <span>{{ loadError }}</span>
            <q-btn flat no-caps color="primary" label="ลองอีกครั้ง" @click="fetchJobs" />
        </div>
        <div v-else class="table-container">
            <table class="monitoring-table">
                <thead>
                    <tr>
                        <th>ออเดอร์</th>
                        <th>ลูกค้า</th>
                        <th>ช่างผู้รับงาน</th>
                        <th>อาการเสีย</th>
                        <th>สถานะงาน</th>
                        <th class="text-right">ยอดรวม</th>
                        <th class="text-right">การจัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="job in filteredJobs" :key="job.orderNo">
                        <td class="order-cell">#{{ job.orderNo }}</td>
                        <td class="customer-cell">{{ job.customerName }}</td>
                        <td class="tech-cell">{{ job.techName }}</td>
                        <td class="issue-cell">
                            <span class="truncate-text">{{ job.issueTitle }}</span>
                        </td>
                        <td>
                            <span class="status-badge" :class="statusStyles[job.status]">
                                {{ statusLabels[job.status] }}
                            </span>
                        </td>
                        <td class="price-cell">฿{{ job.amount.toLocaleString() }}</td>
                        <td class="action-cell">
                            <button type="button" @click="viewJobDetail(job)" class="btn-detail">
                                ดูรายละเอียด
                            </button>
                        </td>
                    </tr>
                    <tr v-if="filteredJobs.length === 0">
                        <td colspan="7" class="empty-cell">
                            {{ loadError || 'ไม่พบรายการงานซ่อมในหมวดหมู่นี้' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Job Detail Dialog -->
        <q-dialog v-model="isDetailOpen">
            <q-card v-if="selectedJob" class="detail-modal-card">
                <div class="modal-header">
                    <h3 class="modal-title">รายละเอียดออเดอร์ #{{ selectedJob.orderNo }}</h3>
                    <q-btn icon="close" flat round dense v-close-popup class="modal-close-btn" />
                </div>

                <div class="modal-body">
                    <div class="detail-row">
                        <span class="detail-label">ลูกค้า:</span>
                        <span class="detail-value">{{ selectedJob.customerName }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ช่างเทคนิค:</span>
                        <span class="detail-value">{{ selectedJob.techName }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">อาการเสีย:</span>
                        <span class="detail-value">{{ selectedJob.issueTitle }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">เบอร์ลูกค้า:</span>
                        <span class="detail-value">{{ selectedJob.customerPhone || '-' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">เบอร์ช่าง:</span>
                        <span class="detail-value">{{ selectedJob.techPhone || '-' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">วันและเวลานัด:</span>
                        <span class="detail-value">{{ selectedJob.appointmentDate || '-' }} {{ selectedJob.appointmentTime || '' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ที่อยู่:</span>
                        <span class="detail-value">{{ selectedJob.address || '-' }} {{ selectedJob.addressNote || '' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">สถานะชำระเงิน:</span>
                        <span class="detail-value">{{ selectedJob.paymentStatus === 'PAID' ? 'ชำระแล้ว' : 'ยังไม่ชำระ' }}</span>
                    </div>
                    <div class="detail-row highlight-row">
                        <span class="detail-label">ค่าบริการรวม:</span>
                        <span class="detail-price">฿{{ formatCurrency(selectedJob.amount) }}</span>
                    </div>
                    <div v-if="selectedJob.paidAt" class="detail-row">
                        <span class="detail-label">ชำระเมื่อ:</span>
                        <span class="detail-value">{{ formatDateTime(selectedJob.paidAt) }}</span>
                    </div>
                </div>

                <q-btn unelevated no-caps class="btn-close-modal" v-close-popup>
                    ปิดหน้าต่าง
                </q-btn>
            </q-card>
        </q-dialog>

    </q-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { adminService } from '../../services/adminService'

const router = useRouter()
const authStore = useAuthStore()
const activeFilter = ref('ALL')
const isDetailOpen = ref(false)
const selectedJob = ref(null)
const jobs = ref([])
const isLoading = ref(false)
const loadError = ref('')
const lastUpdated = ref('')
let refreshTimer = null

const filterOptions = [
    { label: 'ทั้งหมด', value: 'ALL' },
    { label: 'รอช่างรับงาน', value: 'CONFIRMED' },
    { label: 'กำลังซ่อม', value: 'IN_PROGRESS' },
    { label: 'กำลังตรวจเช็ค/ซ่อม', value: 'REPAIRING' },
    { label: 'เสร็จสิ้น', value: 'COMPLETED' },
    { label: 'ยกเลิก', value: 'CANCELLED' },
    { label: 'ช่างปฏิเสธงาน', value: 'REJECTED' }
]

const fetchJobs = async () => {
    if (isLoading.value) return
    isLoading.value = true
    loadError.value = ''
    try {
        const response = await adminService.getAllJobs()
        const data = response.data?.data
        if (!Array.isArray(data)) throw new Error('ข้อมูลรายการงานจากระบบไม่ถูกต้อง')
        jobs.value = data.map(job => ({
            ...job,
            amount: Number(job.amount) || 0,
            status: String(job.status || 'CONFIRMED').toUpperCase(),
            techName: job.techName || 'ยังไม่มีช่างรับงาน',
        }))
        lastUpdated.value = new Intl.DateTimeFormat('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(new Date())
    } catch (error) {
        console.error('โหลดสถานะงานซ่อมจริงไม่สำเร็จ:', error)
        loadError.value = error.response?.data?.detail || error.message || 'ไม่สามารถโหลดข้อมูลสถานะงานจากระบบได้'
        if (error.response?.status === 401) {
            authStore.logout()
            await router.replace({ name: 'login', query: { redirect: '/admin' } })
        }
    } finally {
        isLoading.value = false
    }
}

const filteredJobs = computed(() => {
    if (activeFilter.value === 'ALL') return jobs.value
    return jobs.value.filter(j => j.status === activeFilter.value)
})

const statusLabels = {
    PENDING: 'รอช่างรับงาน',
    CONFIRMED: 'รอช่างรับงาน',
    ASSIGNED: 'รอช่างรับงาน',
    IN_PROGRESS: 'กำลังปฏิบัติงาน',
    REPAIRING: 'กำลังตรวจเช็คและซ่อมแซม',
    COMPLETED: 'เสร็จสิ้นเรียบร้อย',
    DONE: 'เสร็จสิ้นเรียบร้อย',
    CANCELLED: 'ยกเลิก',
    REJECTED: 'ช่างปฏิเสธงาน'
}

const statusStyles = {
    PENDING: 'status-pending',
    CONFIRMED: 'status-pending',
    ASSIGNED: 'status-pending',
    IN_PROGRESS: 'status-progress',
    REPAIRING: 'status-progress',
    COMPLETED: 'status-completed',
    DONE: 'status-completed',
    CANCELLED: 'status-cancelled',
    REJECTED: 'status-cancelled'
}

const formatCurrency = (amount) => Number(amount || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

const formatDateTime = (value) => {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return '-'
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}

const viewJobDetail = (job) => {
    selectedJob.value = job
    isDetailOpen.value = true
}

defineExpose({ fetchJobs })

onMounted(() => {
    fetchJobs()
    refreshTimer = setInterval(fetchJobs, 10000)
})

onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
/* ==========================================================================
   1. Monitoring Card Layout
   ========================================================================== */
.monitoring-card {
    border-radius: 1.25rem !important;
    border: 1px solid #f1f5f9;
    background-color: #ffffff;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@media (min-width: 640px) {
    .monitoring-card {
        padding: 1.5rem;
    }
}

/* ==========================================================================
   2. Header & Filter Navigation Bar
   ========================================================================== */
.monitoring-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.875rem;
    border-bottom: 1px solid #f1f5f9;
}

@media (min-width: 640px) {
    .monitoring-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}

.header-text {
    display: flex;
    flex-direction: column;
}

.refresh-error {
    margin: 0.25rem 0 0;
    color: #b91c1c;
    font-size: 0.6875rem;
}

.monitoring-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.01em;
}

@media (min-width: 640px) {
    .monitoring-title {
        font-size: 1.25rem;
    }
}

.monitoring-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

/* Filter Segmented Control Bar */
.filter-bar {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background-color: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.75rem;
    align-self: flex-start;
}

.table-state {
    display: flex;
    min-height: 10rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.8125rem;
    text-align: center;
}

.table-error {
    color: #b91c1c;
}

@media (min-width: 640px) {
    .filter-bar {
        align-self: center;
    }
}

.filter-btn {
    padding: 0.375rem 0.875rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-btn:hover {
    color: #0f172a;
}

.filter-btn-active {
    background-color: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* ==========================================================================
   3. Real-time Monitoring Table
   ========================================================================== */
.table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.monitoring-table {
    width: 100%;
    text-align: left;
    border-collapse: collapse;
    min-width: 640px;
}

.monitoring-table th {
    padding: 0.75rem 0.5rem;
    font-size: 0.6875rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #f1f5f9;
}

.monitoring-table td {
    padding: 0.875rem 0.5rem;
    font-size: 0.8125rem;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
}

.monitoring-table tbody tr {
    transition: background-color 0.15s ease;
}

.monitoring-table tbody tr:hover {
    background-color: rgba(248, 250, 252, 0.8);
}

.order-cell {
    font-family: monospace;
    font-weight: 700;
    color: #334155;
}

.customer-cell {
    font-weight: 700;
    color: #0f172a;
}

.tech-cell {
    color: #475569;
    font-weight: 500;
}

.issue-cell {
    color: #475569;
}

.truncate-text {
    display: block;
    max-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Status Badges */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 700;
    white-space: nowrap;
}

.status-pending {
    background-color: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
}

.status-progress {
    background-color: #f0f9ff;
    color: #0369a1;
    border: 1px solid #bae6fd;
}

.status-completed {
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
}

.status-cancelled {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
}

.price-cell {
    font-weight: 800;
    color: #0f172a;
    text-align: right;
}

.text-right {
    text-align: right;
}

.action-cell {
    text-align: right;
}

.btn-detail {
    padding: 0.375rem 0.75rem;
    border-radius: 0.625rem;
    background-color: #f1f5f9;
    color: #334155;
    font-weight: 700;
    font-size: 0.75rem;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-detail:hover {
    background-color: #e2e8f0;
    color: #0f172a;
}

.empty-cell {
    text-align: center;
    padding: 2rem !important;
    color: #94a3b8;
    font-size: 0.8125rem;
}

/* ==========================================================================
   4. Detail Modal Dialog
   ========================================================================== */
.detail-modal-card {
    width: 100%;
    max-width: 28rem;
    border-radius: 1.25rem !important;
    padding: 1.5rem;
    background-color: #ffffff;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
}

.modal-title {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}

.modal-close-btn {
    color: #94a3b8;
}

.modal-body {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
}

.detail-label {
    color: #64748b;
    font-weight: 500;
}

.detail-value {
    font-weight: 700;
    color: #0f172a;
}

.highlight-row {
    padding-top: 0.5rem;
    border-top: 1px dashed #e2e8f0;
    margin-top: 0.25rem;
}

.detail-price {
    font-size: 1rem;
    font-weight: 800;
    color: #0284c7;
}

.btn-close-modal {
    width: 100%;
    padding: 0.75rem 0 !important;
    background-color: #0f172a !important;
    color: #ffffff !important;
    border-radius: 0.75rem !important;
    font-size: 0.8125rem !important;
    font-weight: 700 !important;
    margin-top: 0.5rem;
}
</style>
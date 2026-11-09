<template>
    <q-page class="admin-page">
        <div class="admin-container">

            <!-- Top Admin Header -->
            <div class="admin-header">
                <div class="header-title-box">
                    <h1 class="header-title">ผู้ดูแลระบบ FixMatch Admin</h1>
                    <p class="header-subtitle">อนุมัติพาร์ทเนอร์ช่าง และติดตามสถานะบริการซ่อมแซมทั่วประเทศ</p>
                </div>
                <div class="header-actions">
                    <q-btn flat dense round icon="refresh" color="grey-7" :loading="isLoading" @click="fetchData">
                        <q-tooltip>รีเฟรชข้อมูล</q-tooltip>
                    </q-btn>
                    <div class="admin-badge">
                        <q-icon name="admin_panel_settings" size="16px" />
                        <span>Admin System</span>
                    </div>
                </div>
            </div>

            <!-- Key Metrics Overview Cards -->
            <div class="metrics-grid">
                <q-card flat class="metric-card">
                    <div class="metric-info">
                        <span class="metric-label">ช่างรอการอนุมัติ (KYC)</span>
                        <span class="metric-value text-amber">{{ pendingTechs.length }} ท่าน</span>
                    </div>
                    <div class="metric-icon-box bg-amber-soft text-amber">
                        <q-icon name="engineering" size="28px" />
                    </div>
                </q-card>

                <q-card flat class="metric-card">
                    <div class="metric-info">
                        <span class="metric-label">งานซ่อมวันนี้</span>
                        <span class="metric-value text-sky">{{ metrics.todayJobsCount }} รายการ</span>
                    </div>
                    <div class="metric-icon-box bg-sky-soft text-sky">
                        <q-icon name="build_circle" size="28px" />
                    </div>
                </q-card>

                <q-card flat class="metric-card">
                    <div class="metric-info">
                        <span class="metric-label">รายได้รวมระบบ (Platform Fee)</span>
                        <span class="metric-value text-emerald">฿{{ metrics.totalRevenue.toLocaleString() }}</span>
                    </div>
                    <div class="metric-icon-box bg-emerald-soft text-emerald">
                        <q-icon name="payments" size="28px" />
                    </div>
                </q-card>
            </div>

            <!-- Section 1: Technician KYC Verification List -->
            <q-card flat class="section-card">
                <div class="section-header">
                    <div>
                        <h2 class="section-title">รายการช่างเทคนิคที่รอตรวจสอบเอกสาร</h2>
                        <p class="section-subtitle">ตรวจสอบเอกสารบัตรประชาชนและทักษะก่อนเปิดใช้งานบัญชีช่าง</p>
                    </div>
                    <q-badge color="amber" rounded class="request-badge">
                        {{ pendingTechs.length }} คำขอ
                    </q-badge>
                </div>

                <div v-if="isLoading" class="loading-state">
                    <q-spinner-dots color="primary" size="40px" />
                    <p class="loading-text">กำลังโหลดข้อมูลช่างจากระบบ...</p>
                </div>

                <div v-else-if="pendingTechs.length === 0" class="empty-state">
                    <q-icon name="verified" size="40px" class="icon-verified" />
                    <p class="empty-title">ตรวจสอบเอกสารครบถ้วนแล้ว</p>
                    <p class="empty-subtitle">ไม่มีรายการคำขออนุมัติช่างค้างในขณะนี้</p>
                </div>

                <!-- Tech Verification Table -->
                <div v-else class="table-container">
                    <table class="tech-table">
                        <thead>
                            <tr>
                                <th>ชื่อ - นามสกุล</th>
                                <th>เบอร์โทรศัพท์</th>
                                <th>ทักษะที่ลงทะเบียน</th>
                                <th>วันที่สมัคร</th>
                                <th class="text-right">ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="tech in pendingTechs" :key="tech.id">
                                <td class="tech-name-cell">
                                    <q-avatar size="32px" class="tech-avatar">
                                        {{ tech.fullName ? tech.fullName.charAt(0) : 'T' }}
                                    </q-avatar>
                                    <span class="tech-name">{{ tech.fullName }}</span>
                                </td>
                                <td class="tech-phone">{{ tech.phone }}</td>
                                <td>
                                    <div class="skill-tags">
                                        <span v-for="(skill, idx) in tech.skills" :key="idx" class="skill-chip">
                                            {{ skill }}
                                        </span>
                                    </div>
                                </td>
                                <td class="tech-date">{{ tech.registeredDate }}</td>
                                <td class="text-right">
                                    <button @click="openApprovalModal(tech)" class="btn-inspect">
                                        ตรวจสอบเอกสาร
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </q-card>

            <!-- Section 2: Real-time All Jobs Monitoring Table -->
            <JobMonitoringTable ref="jobMonitoringTable" />

        </div>

        <!-- Tech KYC Approval Modal Component -->
        <TechApprovalModal v-model="isModalOpen" :technician="selectedTech" :is-action-loading="isActionLoading"
            @approve="handleApproveTech" @reject="handleRejectTech" />
    </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import TechApprovalModal from '../../components/admin/TechApprovalModal.vue'
import JobMonitoringTable from '../../components/admin/JobMonitoringTable.vue'
import { adminService } from '../../services/adminService.js'

const $q = useQuasar()
const isLoading = ref(false)
const isActionLoading = ref(false)
const isModalOpen = ref(false)
const selectedTech = ref(null)
const jobMonitoringTable = ref(null)

const pendingTechs = ref([])
const metrics = reactive({
    todayJobsCount: 0,
    totalRevenue: 0
})

// ดึงข้อมูลทั้งหมดจาก Backend API
const fetchData = async () => {
    isLoading.value = true
    try {
        const [techRes, metricsRes] = await Promise.all([
            adminService.getPendingTechnicians(),
            adminService.getAdminMetrics()
        ])

        pendingTechs.value = techRes.data || []
        metrics.todayJobsCount = metricsRes.data?.todayJobsCount || 0
        metrics.totalRevenue = metricsRes.data?.totalRevenue || 0
        await jobMonitoringTable.value?.fetchJobs()
    } catch (error) {
        console.error('Failed to fetch admin data:', error)
        $q.notify({
            type: 'negative',
            message: 'ไม่สามารถดึงข้อมูลจาก Server ได้ กรุณาตรวจสอบการเชื่อมต่อ',
            icon: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

// เปิด Modal ดูเอกสารช่าง
const openApprovalModal = (tech) => {
    selectedTech.value = tech
    isModalOpen.value = true
}

// ส่งคำขอกดอนุมัติไปยัง Backend
const handleApproveTech = async (techId) => {
    isActionLoading.value = true
    try {
        await adminService.approveTechnician(techId)

        // ตัดรายการที่อนุมัติแล้วออกจาก Array
        pendingTechs.value = pendingTechs.value.filter(t => t.id !== techId)
        isModalOpen.value = false

        $q.notify({
            type: 'positive',
            message: 'อนุมัติพาร์ทเนอร์ช่างเรียบร้อยแล้ว!',
            icon: 'verified'
        })
    } catch (error) {
        console.error('Failed to approve technician:', error)
        $q.notify({
            type: 'negative',
            message: 'เกิดข้อผิดพลาดในการอนุมัติช่าง',
            icon: 'error'
        })
    } finally {
        isActionLoading.value = false
    }
}

// ส่งคำขอกดปฏิเสธไปยัง Backend
const handleRejectTech = (techId) => {
    $q.dialog({
        title: 'ระบุเหตุผลการปฏิเสธ',
        message: 'เหตุผลนี้จะแสดงให้ช่างเห็นในหน้าสถานะบัญชี',
        prompt: {
            model: '',
            type: 'textarea',
            isValid: value => Boolean(value?.trim()),
            attrs: { maxlength: 1000, rows: 4 },
        },
        cancel: { label: 'ยกเลิก', flat: true },
        ok: { label: 'ปฏิเสธคำขอ', color: 'negative', unelevated: true },
        persistent: true,
    }).onOk(async (reason) => {
        isActionLoading.value = true
        try {
            await adminService.rejectTechnician(techId, reason.trim())
            pendingTechs.value = pendingTechs.value.filter(t => t.id !== techId)
            isModalOpen.value = false
            $q.notify({
                type: 'warning',
                message: 'ปฏิเสธคำขอและบันทึกเหตุผลเรียบร้อยแล้ว',
                icon: 'block'
            })
        } catch (error) {
            console.error('Failed to reject technician:', error)
            $q.notify({
                type: 'negative',
                message: error.response?.data?.detail || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอ',
                icon: 'error'
            })
        } finally {
            isActionLoading.value = false
        }
    })
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
/* ==========================================================================
   1. Layout & Page Container
   ========================================================================== */
.admin-page {
    background-color: #f8fafc;
    min-height: 100vh;
    padding: 2rem 1rem;
}

@media (min-width: 640px) {
    .admin-page {
        padding: 2rem 1.5rem;
    }
}

.admin-container {
    max-width: 72rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* ==========================================================================
   2. Top Admin Header
   ========================================================================== */
.admin-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

@media (min-width: 640px) {
    .admin-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}

.header-title-box {
    display: flex;
    flex-direction: column;
}

.header-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
    line-height: 1.25;
    margin: 0;
}

@media (min-width: 768px) {
    .header-title {
        font-size: 2rem;
    }
}

.header-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.admin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background-color: #1e293b;
    color: #ffffff;
    font-family: monospace;
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-weight: 600;
}

/* ==========================================================================
   3. Key Metrics Overview Cards
   ========================================================================== */
.metrics-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

@media (min-width: 640px) {
    .metrics-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

.metric-card {
    padding: 1.25rem;
    border-radius: 1rem !important;
    border: 1px solid #f1f5f9;
    background-color: #ffffff;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.metric-info {
    display: flex;
    flex-direction: column;
}

.metric-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    display: block;
}

.metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 0.25rem;
    display: block;
}

.metric-icon-box {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Color Accent Utilities */
.text-amber {
    color: #f59e0b;
}

.bg-amber-soft {
    background-color: #fffbeb;
}

.text-sky {
    color: #0284c7;
}

.bg-sky-soft {
    background-color: #f0f9ff;
}

.text-emerald {
    color: #059669;
}

.bg-emerald-soft {
    background-color: #ecfdf5;
}

/* ==========================================================================
   4. Technician KYC Verification Card
   ========================================================================== */
.section-card {
    border-radius: 1rem !important;
    border: 1px solid #f1f5f9;
    background-color: #ffffff;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
}

.section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.section-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.125rem;
    margin-bottom: 0;
}

.request-badge {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 700;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
}

.empty-state {
    background-color: rgba(248, 250, 252, 0.5);
    border-radius: 1rem;
    border: 1px dashed #e2e8f0;
}

.icon-verified {
    color: #34d399;
    margin-bottom: 0.5rem;
}

.loading-text,
.empty-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

.empty-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: #334155;
    margin: 0;
}

/* ==========================================================================
   5. Tech Verification Table
   ========================================================================== */
.table-container {
    overflow-x: auto;
}

.tech-table {
    width: 100%;
    text-align: left;
    border-collapse: collapse;
}

.tech-table th {
    padding-bottom: 0.75rem;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #f1f5f9;
}

.tech-table td {
    padding: 0.875rem 0;
    font-size: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
}

.tech-table tbody tr {
    transition: background-color 0.15s ease;
}

.tech-table tbody tr:hover {
    background-color: rgba(248, 250, 252, 0.8);
}

.tech-name-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: #1e293b;
}

.tech-avatar {
    background-color: #f0f9ff;
    color: #0284c7;
    font-weight: 700;
}

.tech-phone {
    color: #475569;
    font-family: monospace;
}

.tech-date {
    color: #94a3b8;
    font-family: monospace;
}

.skill-tags {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.skill-chip {
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.625rem;
    font-weight: 600;
    background-color: #f1f5f9;
    color: #334155;
}

.text-right {
    text-align: right;
}

.btn-inspect {
    padding: 0.375rem 0.75rem;
    border-radius: 0.75rem;
    background-color: #0284c7;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.75rem;
    border: none;
    cursor: pointer;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-inspect:hover {
    background-color: #0369a1;
}

.btn-inspect:active {
    transform: scale(0.95);
}
</style>
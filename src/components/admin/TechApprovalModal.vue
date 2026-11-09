<template>
    <div>
        <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
            <!-- Check technician presence to prevent undefined property errors -->
            <q-card v-if="technician" class="approval-dialog-card">

                <!-- Modal Header -->
                <div class="modal-header">
                    <div class="header-title-group">
                        <h3 class="modal-title">ตรวจสอบเอกสารลงทะเบียนช่าง</h3>
                        <div class="app-id-chip">
                            <q-icon name="badge" size="13px" />
                            <span>รหัสสมัคร: {{ technician?.id || '-' }}</span>
                        </div>
                    </div>
                    <q-btn icon="close" flat round dense v-close-popup class="btn-close-modal" />
                </div>

                <!-- Scrollable Modal Body -->
                <div class="modal-body-scroll">

                    <!-- Personal & Banking Details Grid -->
                    <div class="info-card-grid">
                        <div class="info-item">
                            <span class="info-label">ชื่อ-นามสกุล</span>
                            <span class="info-value">{{ technician?.fullName || '-' }}</span>
                        </div>

                        <div class="info-item">
                            <span class="info-label">เบอร์โทรศัพท์ / LINE ID</span>
                            <span class="info-value">
                                {{ technician?.phone || '-' }}
                                <span class="line-badge" v-if="technician?.lineId">LINE: {{ technician.lineId }}</span>
                            </span>
                        </div>

                        <div class="info-item">
                            <span class="info-label">ประสบการณ์ทำงาน</span>
                            <span class="info-value">{{ technician?.experienceYears || 0 }} ปี</span>
                        </div>

                        <div class="info-item">
                            <span class="info-label">บัญชีรับเงิน</span>
                            <span class="info-value">
                                {{ technician?.bankName || '-' }} {{ technician?.bankAccountNo || '' }}
                            </span>
                        </div>
                    </div>

                    <!-- Document Previews Section -->
                    <div class="documents-container">

                        <!-- Profile Photo Preview -->
                        <div v-if="technician?.avatarImg" class="doc-preview-card">
                            <div class="doc-header">
                                <q-icon name="account_circle" size="16px" class="doc-icon text-sky" />
                                <span class="doc-label">1. รูปถ่ายหน้าตรง / รูปโปรไฟล์</span>
                            </div>
                            <div class="image-wrapper">
                                <img v-if="documentUrls.avatar" :src="documentUrls.avatar" alt="รูปโปรไฟล์"
                                    class="preview-img" />
                                <div v-else class="no-img-placeholder">กำลังโหลดรูปโปรไฟล์...</div>
                            </div>
                        </div>

                        <!-- ID Card Preview -->
                        <div class="doc-preview-card">
                            <div class="doc-header">
                                <q-icon name="badge" size="16px" class="doc-icon text-sky" />
                                <span class="doc-label">2. รูปถ่ายบัตรประชาชน</span>
                            </div>
                            <div class="image-wrapper">
                                <img v-if="documentUrls.idCard" :src="documentUrls.idCard"
                                    alt="บัตรประชาชน" class="preview-img" />
                                <div v-else class="no-img-placeholder">
                                    <q-icon name="hide_image" size="32px" />
                                    <span>ไม่มีรูปถ่ายบัตรประชาชน</span>
                                </div>
                            </div>
                        </div>

                        <!-- Certificate Preview (Optional) -->
                        <div v-if="technician?.certificateImg" class="doc-preview-card">
                            <div class="doc-header">
                                <q-icon name="workspace_premium" size="16px" class="doc-icon text-amber" />
                                <span class="doc-label">3. ใบรับรองวิชาชีพ / การฝึกอบรม</span>
                            </div>
                            <div class="image-wrapper">
                                <img v-if="documentUrls.certificate && !certificateIsPdf"
                                    :src="documentUrls.certificate" alt="ใบรับรองวิชาชีพ" class="preview-img" />
                                <q-btn v-else-if="documentUrls.certificate && certificateIsPdf" flat no-caps
                                    color="primary" icon="download" label="ดาวน์โหลดใบรับรอง PDF"
                                    :href="documentUrls.certificate" :download="technician.certificateImg" />
                                <div v-else class="no-img-placeholder">กำลังโหลดเอกสาร...</div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Footer Actions -->
                <div class="modal-footer">
                    <button type="button" @click="$emit('reject', technician?.id)" class="btn-reject">
                        <q-icon name="close" size="16px" />
                        <span>ไม่อนุมัติ / ปฏิเสธการสมัคร</span>
                    </button>

                    <button type="button" @click="$emit('approve', technician?.id)" class="btn-approve">
                        <q-icon name="check_circle" size="16px" />
                        <span>อนุมัติการใช้งาน (Approve)</span>
                    </button>
                </div>

            </q-card>
        </q-dialog>
    </div>
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { api } from '@/boot/axios'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    technician: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'approve', 'reject'])
const isOpen = ref(props.modelValue)
const documentUrls = ref({ avatar: '', idCard: '', certificate: '' })
const certificateIsPdf = ref(false)
const loadedObjectUrls = new Set()
let documentRequestId = 0

const clearDocumentUrls = () => {
    for (const url of loadedObjectUrls) URL.revokeObjectURL(url)
    loadedObjectUrls.clear()
    documentUrls.value = { avatar: '', idCard: '', certificate: '' }
    certificateIsPdf.value = false
}

const loadDocument = async (techId, type, filename, requestId) => {
    if (!filename) return
    try {
        const response = await api.get(`/admin/technicians/${techId}/documents/${type}`, {
            responseType: 'blob',
        })
        if (requestId !== documentRequestId) return
        const url = URL.createObjectURL(response.data)
        loadedObjectUrls.add(url)
        const key = type === 'id-card' ? 'idCard' : type
        documentUrls.value = { ...documentUrls.value, [key]: url }
        if (type === 'certificate') {
            certificateIsPdf.value = String(filename).toLowerCase().endsWith('.pdf')
        }
    } catch (error) {
        if (requestId === documentRequestId) {
            console.error(`โหลดเอกสาร ${type} ของผู้สมัครไม่สำเร็จ:`, error)
        }
    }
}

const loadTechnicianDocuments = async () => {
    const requestId = ++documentRequestId
    clearDocumentUrls()
    const techId = props.technician?.id
    if (!isOpen.value || !techId) return
    await Promise.all([
        loadDocument(techId, 'avatar', props.technician.avatarImg, requestId),
        loadDocument(techId, 'id-card', props.technician.idCardImg, requestId),
        loadDocument(techId, 'certificate', props.technician.certificateImg, requestId),
    ])
}

watch(() => props.modelValue, (val) => {
    isOpen.value = val
})

watch(() => [isOpen.value, props.technician?.id], loadTechnicianDocuments, { immediate: true })

watch(isOpen, (val) => {
    emit('update:modelValue', val)
})

onUnmounted(() => {
    documentRequestId += 1
    clearDocumentUrls()
})
</script>

<style scoped>
/* ==========================================================================
   1. Dialog Container & Main Layout
   ========================================================================== */
.approval-dialog-card {
    width: 100%;
    max-width: 42rem;
    border-radius: 1.5rem !important;
    background-color: #ffffff;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
    overflow: hidden;
}

@media (min-width: 640px) {
    .approval-dialog-card {
        padding: 1.5rem;
    }
}

/* ==========================================================================
   2. Header Section
   ========================================================================== */
.modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 0.875rem;
    border-bottom: 1px solid #f1f5f9;
}

.header-title-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.modal-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.01em;
}

@media (min-width: 640px) {
    .modal-title {
        font-size: 1.25rem;
    }
}

.app-id-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.2rem 0.625rem;
    border-radius: 9999px;
    background-color: #f1f5f9;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
    width: fit-content;
}

.btn-close-modal {
    color: #94a3b8;
}

/* ==========================================================================
   3. Body Content & Details Grid
   ========================================================================== */
.modal-body-scroll {
    padding: 1rem 0;
    max-height: 65vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.info-card-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 1rem;
}

@media (min-width: 520px) {
    .info-card-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.info-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.info-value {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.375rem;
}

.line-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #059669;
    background-color: #d1fae5;
    padding: 0.125rem 0.375rem;
    border-radius: 0.375rem;
}

/* ==========================================================================
   4. Document Previews Section
   ========================================================================== */
.documents-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.doc-preview-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.doc-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.doc-icon.text-sky {
    color: #0284c7;
}

.doc-icon.text-amber {
    color: #d97706;
}

.doc-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.image-wrapper {
    height: 12rem;
    background-color: #f1f5f9;
    border-radius: 0.875rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

@media (min-width: 640px) {
    .image-wrapper {
        height: 14rem;
    }
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.preview-img:hover {
    transform: scale(1.02);
}

.no-img-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 600;
}

/* ==========================================================================
   5. Footer Action Buttons
   ========================================================================== */
.modal-footer {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.625rem;
    padding-top: 0.875rem;
    border-top: 1px solid #f1f5f9;
}

@media (min-width: 520px) {
    .modal-footer {
        grid-template-columns: repeat(2, 1fr);
    }
}

.btn-reject {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #fecdd3;
    background-color: #fff1f2;
    color: #e11d48;
    font-size: 0.8125rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-reject:hover {
    background-color: #ffe4e6;
    border-color: #fda4af;
}

.btn-approve {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: none;
    background-color: #10b981;
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    transition: all 0.2s ease;
}

.btn-approve:hover {
    background-color: #059669;
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
}

.btn-reject:active,
.btn-approve:active {
    transform: scale(0.98);
}
</style>
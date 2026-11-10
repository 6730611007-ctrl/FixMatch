<template>
    <q-page class="custom-page">
        <div class="content-container">

            <!-- Stepper Header (Minimal Progress Bar) -->
            <div class="stepper-card">
                <div class="stepper-wrapper">
                    <div v-for="(stepItem, index) in steps" :key="stepItem.id" class="step-item">
                        <div class="step-header" @click="goToStep(stepItem.id)">
                            <div class="step-circle" :class="{
                                'active': currentStep === stepItem.id,
                                'completed': currentStep > stepItem.id
                            }">
                                <q-icon v-if="currentStep > stepItem.id" name="check" size="14px" />
                                <span v-else>{{ stepItem.id }}</span>
                            </div>
                            <span class="step-title" :class="{ 'active-text': currentStep >= stepItem.id }">
                                {{ stepItem.title }}
                            </span>
                        </div>

                        <!-- Connector Line -->
                        <div v-if="index < steps.length - 1" class="step-line">
                            <div class="step-line-progress"
                                :style="{ width: currentStep > stepItem.id ? '100%' : '0%' }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Animated Steps View -->
            <Transition name="step-fade" mode="out-in">
                <!-- Step 1: Smart Diagnostic Form -->
                <div v-if="currentStep === 1" key="step1">
                    <q-card flat class="form-card">
                        <div class="card-header">
                            <div class="ai-badge">
                                <q-icon :name="bookingStore.pendingTechnicianBooking ? 'event_available' : 'auto_awesome'"
                                    size="14px" />
                                <span>{{ bookingStore.pendingTechnicianBooking ? 'จองบริการ' : 'AI Assistant' }}</span>
                            </div>
                            <h2 class="card-title">
                                {{ bookingStore.pendingTechnicianBooking ? 'รายละเอียดงานที่ต้องการให้ช่างดูแล' : 'แจ้งปัญหาบ้าน' }}
                            </h2>
                            <p class="card-subtitle">
                                {{ bookingStore.pendingTechnicianBooking
                                    ? `คุณเลือก ${bookingStore.selectedTechnician?.name || 'ช่าง'} ไว้แล้ว ระบุงานที่ต้องการและดำเนินการนัดหมาย`
                                    : 'ระบุรายละเอียดหรือแนบรูปภาพเพื่อให้ระบบวิเคราะห์เบื้องต้น' }}
                            </p>
                        </div>

                        <q-form @submit.prevent="handleAnalyze" class="form-space">
                            <!-- Text Area -->
                            <div class="input-group">
                                <label class="input-label">รายละเอียดอาการเสีย</label>
                                <q-input v-model="formData.description" type="textarea" outlined flat rows="4"
                                    placeholder="เช่น มีน้ำหยดจากเพดานห้องน้ำชั้นบน, เสียงดังผิดปกติจากคัทเอาต์..."
                                    class="minimal-input" :rules="[val => !!val || 'กรุณาระบุรายละเอียดปัญหา']" />
                            </div>

                            <!-- Upload Area -->
                            <div class="input-group">
                                <label class="input-label">แนบรูปภาพประกอบ</label>
                                <q-file v-model="formData.files" outlined multiple append max-files="3"
                                    accept=".jpg, .png, image/*" class="hidden-input" ref="fileInputRef"
                                    @rejected="onFileRejected" />

                                <div @click="triggerFileInput" class="dropzone">
                                    <div class="dropzone-icon">
                                        <q-icon name="cloud_upload" size="24px" />
                                    </div>
                                    <p class="dropzone-text">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                    <p class="dropzone-sub">รองรับ JPG, PNG สูงสุด 3 ไฟล์</p>
                                </div>

                                <!-- Preview List -->
                                <TransitionGroup name="chip-list" tag="div" v-if="formData.files.length > 0"
                                    class="chip-container">
                                    <q-chip v-for="(file, idx) in formData.files" :key="file.name + idx" removable
                                        @remove="removeFile(idx)" class="minimal-chip">
                                        <q-icon name="image" size="14px" class="chip-icon" />
                                        <span class="chip-name">{{ file.name }}</span>
                                    </q-chip>
                                </TransitionGroup>
                            </div>

                            <!-- AI Submit Button -->
                            <q-btn type="submit" unelevated no-caps class="btn-ai-submit" :loading="isAnalyzing">
                                <div class="btn-content">
                                    <q-icon
                                        :name="bookingStore.pendingTechnicianBooking ? 'event_available' : 'auto_awesome'"
                                        size="18px" class="ai-btn-icon" />
                                    <span>{{ bookingStore.pendingTechnicianBooking ? 'ดำเนินการจองช่างที่เลือก' : 'วิเคราะห์ปัญหาด้วย AI' }}</span>
                                </div>
                            </q-btn>
                        </q-form>
                    </q-card>
                </div>

                <!-- Step 2: AI Analysis Result -->
                <div v-else-if="currentStep === 2" key="step2" class="step-space">
                    <AnalysisResultCard :analysis="aiResult" @select-technician="currentStep = 3" />

                    <q-btn flat no-caps class="btn-back" @click="currentStep = 1">
                        <q-icon name="arrow_back" size="16px" class="back-icon" />
                        <span>แก้ไขข้อมูลปัญหา</span>
                    </q-btn>
                </div>

                <!-- Step 3: Technician Selection -->
                <div v-else-if="currentStep === 3" key="step3" class="step-space">
                    <TechSelectionList :auto-select-first="false" @confirm-booking="openBookingModal" />

                    <q-btn flat no-caps class="btn-back" @click="currentStep = 2">
                        <q-icon name="arrow_back" size="16px" class="back-icon" />
                        <span>ย้อนกลับไปดูผลวิเคราะห์</span>
                    </q-btn>

                </div>

                <!-- Step 4: Technician Tracking -->
                <div v-else-if="currentStep === 4" key="step4" class="step-space">
                    <TechnicianTrackingPage :orderId="createdOrderId" @back="currentStep = 3"
                        @complete-job="currentStep = 5" />
                </div>

                <!-- Step 5: Job Summary & Payment -->
                <div v-else-if="currentStep === 5" key="step5" class="step-space">
                    <JobSummaryPage />
                </div>
            </Transition>

            <BookingConfirmationSheet v-model="isBookingModalOpen" :technician="selectedTechForBooking"
                @booking-complete="handleBookingComplete" />

        </div>
    </q-page>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useBookingStore } from '@/stores/bookingStore'
import { useAuthStore } from '@/stores/authStore'
import { useRoute, useRouter } from 'vue-router'
import { setActiveTrackingOrder } from '@/services/activeTracking'
import { saveCustomerBooking } from '@/services/customerBookingHistory'
import fixmatchService from '@/services/fixmatchService'
import AnalysisResultCard from '../components/diagnostic/AnalysisResultCard.vue'
import TechSelectionList from '../components/tech/TechSelectionList.vue'
import BookingConfirmationSheet from '../components/booking/BookingConfirmationSheet.vue'
import TechnicianTrackingPage from './TechnicianTrackingPage.vue'
import JobSummaryPage from './JobSummaryPage.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const authStore = useAuthStore()

const getStepFromQuery = (value) => {
    const step = Number(value)
    return Number.isInteger(step) && step >= 1 && step <= 3 ? step : 1
}

const currentStep = ref(getStepFromQuery(route.query.step))
const isAnalyzing = ref(false)
const fileInputRef = ref(null)

const isBookingModalOpen = ref(false)
const selectedTechForBooking = ref(null)
const createdOrderId = ref('')

const steps = [
    { id: 1, title: 'แจ้งปัญหา' },
    { id: 2, title: 'ผลวิเคราะห์' },
    { id: 3, title: 'เลือกช่าง' },
    { id: 4, title: 'ติดตามช่าง' },
    { id: 5, title: 'ชำระเงิน' }
]

const formData = reactive({
    description: '',
    files: []
})

const aiResult = ref(null)

const openBookingModal = (tech) => {
    selectedTechForBooking.value = tech
    bookingStore.setSelectedTechnician(tech)
    isBookingModalOpen.value = true
}

const goToStep = (stepId) => {
    if (stepId < currentStep.value) {
        currentStep.value = stepId
    }
}

watch(currentStep, (step) => {
    if (route.name !== 'diagnostic') return

    const query = { ...route.query }
    if (step <= 3) {
        query.step = String(step)
    } else {
        delete query.step
    }

    if (query.step !== route.query.step) {
        router.replace({ query })
    }
})

const triggerFileInput = () => {
    if (fileInputRef.value) fileInputRef.value.pickFiles()
}

const removeFile = (index) => {
    formData.files.splice(index, 1)
}

const onFileRejected = () => {
    $q.notify({
        type: 'negative',
        message: 'ไฟล์เกินจำนวนที่กำหนด หรือประเภทไฟล์ไม่ถูกต้อง',
        position: 'top'
    })
}

const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
    })
}

const handleAnalyze = async () => {
    if (bookingStore.pendingTechnicianBooking) {
        const selectedTechnician = bookingStore.selectedTechnician
        if (!selectedTechnician) {
            $q.notify({ type: 'warning', message: 'กรุณาเลือกช่างก่อนดำเนินการจอง' })
            await router.push({ name: 'home' })
            return
        }

        if (!authStore.token) {
            await router.push({ name: 'login' })
            return
        }

        const role = String(authStore.user?.role || '').toLowerCase()
        if (role && role !== 'customer' && role !== 'admin') {
            $q.notify({ type: 'warning', message: 'บัญชีช่างไม่สามารถจองบริการในฐานะลูกค้าได้' })
            return
        }

        aiResult.value = { issue_summary: formData.description.trim() }
        bookingStore.setIssue({
            category: 'งานบริการ',
            title: formData.description.trim(),
            description: formData.description.trim(),
        })
        openBookingModal(selectedTechnician)
        return
    }

    isAnalyzing.value = true

    try {
        let base64Image = null

        if (formData.files && formData.files.length > 0) {
            base64Image = await convertFileToBase64(formData.files[0])
        }

        const payload = {
            user_input: formData.description,
            image_base64: base64Image
        }

        const response = await fixmatchService.analyzeIssue(payload)
        const resultData = response.data

        if (
            resultData.is_home_related === false ||
            resultData.category === 'General' ||
            resultData.category === 'ไม่เกี่ยวกับบ้าน' ||
            (resultData.issue_summary && resultData.issue_summary.includes('ไม่เกี่ยวกับ'))
        ) {
            $q.notify({
                type: 'warning',
                message: '❌ เรื่องนี้ไม่เกี่ยวกับงานซ่อมบ้าน กรุณาระบุรายละเอียดใหม่อีกครั้ง',
                position: 'top',
                timeout: 4000,
                icon: 'warning'
            })
            return
        }

        aiResult.value = resultData

        // บันทึกลง Pinia Store
        bookingStore.setIssue({
            category: resultData.category || 'ทั่วไป',
            title: resultData.issue_summary || 'แจ้งปัญหาบ้าน',
            description: formData.description,
        })

        currentStep.value = 2
    } catch (error) {
        console.error('AI Analysis Error:', error)
        const errorDetail = error.response?.data?.detail

        if (errorDetail && (errorDetail.is_home_related === false || errorDetail.message)) {
            $q.notify({
                type: 'warning',
                message: errorDetail.message || '❌ เรื่องนี้ไม่เกี่ยวกับงานซ่อมบ้าน กรุณาระบุใหม่อีกครั้ง',
                position: 'top',
                timeout: 4000,
                icon: 'warning'
            })
        } else {
            $q.notify({
                type: 'negative',
                message: 'ไม่สามารถเชื่อมต่อระบบวิเคราะห์ AI ได้ กรุณาลองใหม่อีกครั้ง',
                position: 'top'
            })
        }
    } finally {
        isAnalyzing.value = false
    }
}

const handleBookingComplete = async (bookingDetails) => {
    isBookingModalOpen.value = false
    if (!authStore.token) {
        $q.notify({ type: 'warning', message: 'กรุณาเข้าสู่ระบบก่อนยืนยันการจอง' })
        await router.push({ name: 'login' })
        return
    }

    $q.loading.show({ message: 'กำลังบันทึกข้อมูลการจอง...' })

    try {
        const response = await fixmatchService.createBooking({
            technicianId: bookingDetails.technician?.id,
            scheduleDate: bookingDetails.schedule?.date,
            scheduleTime: bookingDetails.schedule?.time,
            address: bookingDetails.location?.address,
            addressNote: bookingDetails.location?.note,
            latitude: bookingDetails.location?.latitude,
            longitude: bookingDetails.location?.longitude,
            contactName: bookingDetails.contact?.name,
            contactPhone: bookingDetails.contact?.phone,
            issueDescription: aiResult.value?.issue_summary || formData.description || 'แจ้งซ่อมแซมบ้าน',
        })

        const createdBooking = response.data?.data || response.data
        const returnedOrderNo = createdBooking?.order_no || createdBooking?.orderId
        if (!returnedOrderNo || typeof returnedOrderNo !== 'string') {
            throw new Error('เซิร์ฟเวอร์ไม่ได้ส่งหมายเลขงานจริงกลับมา กรุณาตรวจสอบประวัติการจองก่อนทำรายการซ้ำ')
        }
        const orderNo = returnedOrderNo
        const bookedTechnician = createdBooking?.technician
            || bookingDetails.technician
            || bookingStore.selectedTechnician
        createdOrderId.value = orderNo

        // บันทึกลง Store และ localStorage สำรอง
        bookingStore.setOrderId(orderNo)
        bookingStore.setSelectedTechnician(bookedTechnician)
        bookingStore.setBookingDetails({
            scheduleDate: bookingDetails.schedule?.date,
            scheduleTime: bookingDetails.schedule?.time,
            address: bookingDetails.location?.address,
            addressNote: bookingDetails.location?.note,
            latitude: bookingDetails.location?.latitude,
            longitude: bookingDetails.location?.longitude,
            contactName: bookingDetails.contact?.name,
            contactPhone: bookingDetails.contact?.phone,
        })
        bookingStore.setPendingTechnicianBooking(false)
        localStorage.setItem('current_order_id', orderNo)
        setActiveTrackingOrder(orderNo)

        try {
            saveCustomerBooking(authStore.user, {
                id: orderNo,
                orderNo,
                order_no: orderNo,
                status: createdBooking?.status || 'CONFIRMED',
                issueDescription: aiResult.value?.issue_summary || formData.description || 'แจ้งซ่อมแซมบ้าน',
                appointmentDate: bookingDetails.schedule?.date || '',
                appointmentTime: bookingDetails.schedule?.time || '',
                address: bookingDetails.location?.address || '',
                technician: bookedTechnician,
                createdAt: new Date().toISOString(),
            })
        } catch (storageError) {
            console.error('ไม่สามารถบันทึกประวัติการจองในอุปกรณ์ได้:', storageError)
            $q.notify({
                type: 'warning',
                message: 'จองสำเร็จ แต่ไม่สามารถบันทึกประวัติไว้ในอุปกรณ์นี้ได้',
                icon: 'warning',
            })
        }

        $q.notify({
            type: 'positive',
            message: `นัดหมายช่างสำเร็จ! หมายเลขออเดอร์ #${createdOrderId.value}`,
            icon: 'check_circle',
            timeout: 3000
        })

        currentStep.value = 4
        await router.replace({ name: 'booking-waiting', params: { orderId: orderNo } })
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error)
        $q.notify({
            type: 'negative',
            message: error.response?.data?.detail || 'บันทึกการจองไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองอีกครั้ง',
            icon: 'error',
            timeout: 4000,
        })
    } finally {
        $q.loading.hide()
    }
}

onMounted(() => {
    if (bookingStore.orderId) {
        createdOrderId.value = bookingStore.orderId
    }
})
</script>

<style scoped>
.custom-page {
    background-color: #f8fafc;
    min-height: 100vh;
    padding: 1.5rem 0.875rem;
}

@media (min-width: 640px) {
    .custom-page {
        padding: 2rem 1.25rem;
    }
}

@media (min-width: 1024px) {
    .custom-page {
        padding: 2.5rem 1.5rem;
    }
}

.content-container {
    max-width: 44rem;
    margin: 0 auto;
}

.stepper-card {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid #f1f5f9;
    border-radius: 1.25rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@media (min-width: 640px) {
    .stepper-card {
        padding: 0.875rem 1.25rem;
        margin-bottom: 2rem;
    }
}

.stepper-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.step-item {
    display: flex;
    align-items: center;
    flex: 1;
}

.step-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

@media (min-width: 640px) {
    .step-header {
        gap: 0.75rem;
    }
}

.step-circle {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    background-color: #f1f5f9;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
}

@media (min-width: 640px) {
    .step-circle {
        width: 2.25rem;
        height: 2.25rem;
    }
}

.step-circle.active {
    background-color: #0284c7;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    transform: scale(1.05);
}

.step-circle.completed {
    background-color: #0f172a;
    color: #ffffff;
}

.step-title {
    font-size: 0.75rem;
    font-weight: 500;
    color: #94a3b8;
    transition: color 0.2s ease;
    display: none;
}

@media (min-width: 520px) {
    .step-title {
        display: inline;
    }
}

.step-title.active-text {
    color: #0f172a;
    font-weight: 700;
}

.step-line {
    flex: 1;
    height: 2px;
    background-color: #f1f5f9;
    margin: 0 0.375rem;
    border-radius: 9999px;
    overflow: hidden;
}

@media (min-width: 640px) {
    .step-line {
        margin: 0 0.75rem;
    }
}

.step-line-progress {
    height: 100%;
    background-color: #0284c7;
    transition: width 0.4s ease;
}

.form-card {
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 1.5rem !important;
    padding: 1.25rem;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
}

@media (min-width: 640px) {
    .form-card {
        padding: 2rem;
    }
}

.card-header {
    margin-bottom: 1.25rem;
}

.ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background-color: #f0f9ff;
    color: #0369a1;
    font-size: 0.75rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    border: 1px solid #bae6fd;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
}

@media (min-width: 640px) {
    .card-title {
        font-size: 1.5rem;
    }
}

.card-subtitle {
    font-size: 0.8125rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

.form-space {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.input-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

@media (max-width: 599px) {
    .card-header {
        margin-bottom: 1rem;
    }

    .card-title {
        font-size: 1.125rem;
        line-height: 1.5;
        text-wrap: balance;
    }

    .card-subtitle {
        margin-top: 0.5rem;
        line-height: 1.65;
    }

    .form-space {
        gap: 1rem;
    }

    .input-group {
        gap: 0.5rem;
    }

    .input-label {
        font-size: 0.8125rem;
        letter-spacing: 0;
    }

    :deep(.minimal-input textarea) {
        line-height: 1.6;
    }

    :deep(.minimal-input .q-field__bottom) {
        align-items: flex-start;
        min-height: 1.5rem;
        padding: 0.25rem 0.75rem 0;
        line-height: 1.5;
    }
}

:deep(.minimal-input .q-field__control) {
    border-radius: 1rem !important;
    background-color: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.25s ease !important;
}

:deep(.minimal-input.q-field--focused .q-field__control) {
    border-color: #0284c7 !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1) !important;
}

.hidden-input {
    display: none;
}

.dropzone {
    border: 2px dashed #e2e8f0;
    border-radius: 1rem;
    padding: 1.5rem 1rem;
    text-align: center;
    cursor: pointer;
    background-color: #ffffff;
    transition: all 0.3s ease;
}

@media (min-width: 640px) {
    .dropzone {
        padding: 2rem;
    }
}

.dropzone:hover {
    border-color: #0284c7;
    background-color: #f0f9ff;
}

.dropzone-icon {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 0.75rem;
    border-radius: 1rem;
    background-color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    transition: all 0.3s ease;
}

.dropzone:hover .dropzone-icon {
    background-color: #e0f2fe;
    color: #0284c7;
    transform: translateY(-2px);
}

.dropzone-text {
    font-size: 0.875rem;
    font-weight: 700;
    color: #334155;
    margin: 0;
}

.dropzone-sub {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

.chip-container {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.75rem;
}

.minimal-chip {
    background-color: #f1f5f9;
    color: #334155;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 0.75rem;
    padding: 0.375rem 0.75rem;
}

.chip-icon {
    margin-right: 0.375rem;
    color: #94a3b8;
}

.chip-name {
    max-width: 9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.btn-ai-submit {
    width: 100%;
    padding: 0.875rem 0 !important;
    background-color: #0f172a !important;
    color: #ffffff !important;
    border-radius: 1rem !important;
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.2) !important;
    transition: all 0.2s ease !important;
}

.btn-ai-submit:hover {
    background-color: #000000 !important;
    transform: translateY(-1px);
}

.btn-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 0.875rem;
}

.ai-btn-icon {
    color: #38bdf8;
}

.step-space {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.btn-back {
    width: 100%;
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: 0.75rem !important;
    padding: 0.625rem 0 !important;
}

.back-icon {
    margin-right: 0.375rem;
}

.step-fade-enter-active,
.step-fade-leave-active {
    transition: all 0.3s ease;
}

.step-fade-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.step-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
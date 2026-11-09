<template>
    <q-dialog v-model="isOpen" :position="$q.screen.lt.sm ? 'bottom' : 'standard'" transition-show="slide-up"
        transition-hide="slide-down" persistent>
        <q-card class="booking-sheet-card">
            <!-- Drag Handle for Mobile -->
            <div class="drag-handle-wrapper">
                <div class="drag-handle-bar"></div>
            </div>

            <!-- Header Section -->
            <div class="dialog-header">
                <div class="header-text-group">
                    <h3 class="header-title">ยืนยันวันเวลาและสถานที่</h3>
                    <p class="header-subtitle">ระบุจุดนัดหมายเพื่อให้ช่างเดินทางไปถึงอย่างถูกต้อง</p>
                </div>
                <q-btn icon="close" flat round dense class="btn-close-modal" v-close-popup />
            </div>

            <!-- Form Content (Scrollable Area) -->
            <q-card-section class="dialog-content">
                <!-- Selected Technician Summary Brief -->
                <div v-if="technician" class="technician-brief-card">
                    <q-avatar size="44px" class="tech-avatar">
                        <img :src="selectedTechnician.avatarUrl" @error="onImageError"
                            :alt="selectedTechnician.name" />
                    </q-avatar>
                    <div class="tech-info">
                        <span class="tech-label">ช่างเทคนิคที่เลือก</span>
                        <h4 class="tech-name">{{ selectedTechnician.name }}</h4>
                    </div>
                    <div v-if="selectedTechnician.basePrice != null" class="tech-price-block">
                        <span class="price-label">ค่าตรวจเช็ก</span>
                    <div class="price-value">฿{{ Number(selectedTechnician.basePrice).toLocaleString() }}</div>
                    </div>
                </div>

                <q-form ref="formRef" @submit.prevent="handleSubmit" class="booking-form">
                    <!-- 1. Schedule Selection -->
                    <div class="form-section">
                        <label class="form-label">วันและเวลาที่สะดวกให้เข้าบริการ</label>
                        <div class="grid-2-cols">
                            <!-- Date Input -->
                            <div class="input-wrapper">
                                <q-input v-model="bookingForm.date" outlined dense readonly placeholder="เลือกวันที่"
                                    class="minimal-input cursor-pointer" :rules="[val => !!val || 'กรุณาเลือกวันที่']"
                                    @click="datePickerProxy?.show()">
                                    <template #append>
                                        <q-icon name="event" class="cursor-pointer input-icon" />
                                        <q-popup-proxy ref="datePickerProxy" transition-show="scale"
                                            transition-hide="scale">
                                            <q-date v-model="bookingForm.date" mask="YYYY-MM-DD" color="primary"
                                                :options="dateOptions">
                                                <div class="row items-center justify-end">
                                                    <q-btn v-close-popup label="ตกลง" color="primary" flat />
                                                </div>
                                            </q-date>
                                        </q-popup-proxy>
                                    </template>
                                </q-input>
                            </div>

                            <!-- Time Input -->
                            <div class="input-wrapper">
                                <q-input v-model="bookingForm.time" outlined dense readonly placeholder="เลือกเวลา"
                                    class="minimal-input cursor-pointer" :rules="[val => !!val || 'กรุณาเลือกเวลา']"
                                    @click="timePickerProxy?.show()">
                                    <template #append>
                                        <q-icon name="schedule" class="cursor-pointer input-icon" />
                                        <q-popup-proxy ref="timePickerProxy" transition-show="scale"
                                            transition-hide="scale">
                                            <q-time v-model="bookingForm.time" mask="HH:mm" format24h color="primary">
                                                <div class="row items-center justify-end">
                                                    <q-btn v-close-popup label="ตกลง" color="primary" flat />
                                                </div>
                                            </q-time>
                                        </q-popup-proxy>
                                    </template>
                                </q-input>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Service Address -->
                    <div class="form-section">
                        <div class="label-with-action">
                            <label class="form-label mb-0">สถานที่เกิดปัญหา</label>
                            <button type="button" class="btn-location" :disabled="isLocating"
                                @click="useCurrentLocation">
                                <q-spinner-dots v-if="isLocating" size="16px" />
                                <q-icon v-else name="my_location" size="14px" />
                                <span>{{ isLocating ? 'กำลังค้นหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบัน' }}</span>
                            </button>
                        </div>

                        <q-input v-model="bookingForm.address" type="textarea" outlined rows="2"
                            placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, รหัสไปรษณีย์" class="minimal-input mb-2"
                            :rules="[val => !!val || 'กรุณาระบุสถานที่เข้าซ่อม']" />
                        <div v-if="bookingForm.latitude !== null" class="gps-coordinate-note">
                            <div>
                                <q-icon name="place" size="14px" />
                                จุด GPS สำหรับนำทาง: {{ bookingForm.latitude.toFixed(6) }}, {{ bookingForm.longitude.toFixed(6) }}
                                <span v-if="bookingForm.locationAccuracy !== null">
                                    (คลาดเคลื่อนประมาณ {{ Math.round(bookingForm.locationAccuracy) }} เมตร)
                                </span>
                            </div>
                            <q-btn flat dense no-caps size="sm" color="negative" label="ล้างพิกัด GPS"
                                @click="clearSelectedCoordinates" />
                        </div>
                        <div class="location-help-text">
                            ที่อยู่ใช้บอกสถานที่ ส่วนพิกัด GPS เป็นจุดปักหมุดแยกกัน การแก้ที่อยู่จะไม่ลบพิกัด
                        </div>

                        <q-input v-model="bookingForm.addressNote" outlined dense
                            placeholder="จุดสังเกตเพิ่มเติม (เช่น บ้านสองชั้นประตูสีขาว หลังเซเว่น)"
                            class="minimal-input" />
                    </div>

                    <!-- 3. Contact Information -->
                    <div class="grid-2-cols">
                        <div class="form-section">
                            <label class="form-label">ชื่อผู้ติดต่อ</label>
                            <q-input v-model="bookingForm.contactName" outlined dense placeholder="ชื่อ-นามสกุล"
                                class="minimal-input" :rules="[val => !!val || 'กรุณาระบุชื่อผู้ติดต่อ']" />
                        </div>

                        <div class="form-section">
                            <label class="form-label">เบอร์โทรศัพท์</label>
                            <q-input v-model="bookingForm.contactPhone" outlined dense mask="###-###-####"
                                placeholder="08X-XXX-XXXX" class="minimal-input"
                                :rules="[
                                    val => !!val || 'กรุณาระบุเบอร์โทรศัพท์',
                                    val => String(val || '').replace(/\D/g, '').length === 10 || 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'
                                ]" />
                        </div>
                    </div>
                </q-form>
            </q-card-section>

            <!-- Sticky Footer Submit Button (วางไว้นอกส่วน Scroll เพื่อให้กดได้ตลอดเวลา) -->
            <div class="dialog-footer-sticky">
                <q-btn type="button" unelevated no-caps class="btn-submit"
                    @click="handleSubmit">
                    <span>ยืนยันการจองเรียบร้อย</span>
                </q-btn>
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { useQuasar } from 'quasar'
import { normalizeTechnicianProfile } from '@/services/technicianProfile'
import { useAuthStore } from '@/stores/authStore'

const $q = useQuasar()
const authStore = useAuthStore()

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    technician: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'booking-complete'])
const selectedTechnician = computed(() => normalizeTechnicianProfile(props.technician) || {
    name: 'ไม่ระบุชื่อช่าง',
    avatarUrl: 'https://cdn.quasar.dev/img/avatar.png',
})

// Explicit Declarations for Template Refs
const formRef = ref(null)
const datePickerProxy = ref(null)
const timePickerProxy = ref(null)

const isOpen = ref(props.modelValue)
const isLocating = ref(false)

// Sync modelValue with local state
watch(() => props.modelValue, (val) => {
    isOpen.value = val
    if (val) prefillContactDetails()
})
watch(isOpen, (val) => {
    emit('update:modelValue', val)
})

const onImageError = (evt) => {
    evt.target.src = 'https://cdn.quasar.dev/img/avatar.png'
}

const getLocalDateString = (date = new Date()) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 10)
}

const todayStr = getLocalDateString()
const dateOptions = (date) => date.replaceAll('/', '-') >= todayStr

const bookingForm = reactive({
    date: todayStr,
    time: '10:00',
    address: '',
    addressNote: '',
    contactName: '',
    contactPhone: '',
    latitude: null,
    longitude: null,
    locationAccuracy: null,
})

const formatContactPhone = (phone) => {
    let digits = String(phone || '').replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('66')) digits = `0${digits.slice(2)}`
    digits = digits.slice(0, 10)
    if (digits.length !== 10) return digits
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

const prefillContactDetails = () => {
    const user = authStore.user || {}
    if (!bookingForm.contactName.trim()) {
        bookingForm.contactName = user.fullName || user.full_name || user.name || ''
    }
    if (!bookingForm.contactPhone.trim()) {
        bookingForm.contactPhone = formatContactPhone(authStore.userPhone || user.phone)
    }
}

prefillContactDetails()

const clearSelectedCoordinates = () => {
    bookingForm.latitude = null
    bookingForm.longitude = null
    bookingForm.locationAccuracy = null
}

const useCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
        $q.notify({
            type: 'negative',
            message: 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS'
        })
        return
    }

    isLocating.value = true

    navigator.geolocation.getCurrentPosition(
        (position) => {
            isLocating.value = false
            const { latitude, longitude, accuracy } = position.coords
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                $q.notify({
                    type: 'negative',
                    message: 'ตำแหน่ง GPS ที่ได้รับไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
                })
                return
            }

            bookingForm.latitude = latitude
            bookingForm.longitude = longitude
            bookingForm.locationAccuracy = Number.isFinite(accuracy) ? accuracy : null

            $q.notify({
                type: 'positive',
                message: Number.isFinite(accuracy)
                    ? `ดึงพิกัดแล้ว (คลาดเคลื่อนประมาณ ${Math.round(accuracy)} เมตร)`
                    : 'ดึงตำแหน่งปัจจุบันเรียบร้อยแล้ว'
            })
        },
        (error) => {
            isLocating.value = false

            let errorMessage = 'ไม่สามารถดึงตำแหน่งได้ กรุณากรอกที่อยู่ด้วยตนเอง'

            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = 'คุณปฏิเสธการเข้าถึงตำแหน่ง กรุณาเปิดสิทธิ์ GPS ที่การตั้งค่าเบราว์เซอร์'
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMessage = 'ไม่สามารถระบุตำแหน่งอุปกรณ์ของคุณได้ในขณะนี้'
            } else if (error.code === error.TIMEOUT) {
                errorMessage = 'ค้นหาตำแหน่งไม่ทันเวลา กรุณากรอกที่อยู่ด้วยตนเอง'
            }

            $q.notify({
                type: 'warning',
                message: errorMessage,
                timeout: 2500
            })
        },
        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        }
    )
}

const handleSubmit = async () => {
    if (!formRef.value) return

    const isValid = await formRef.value.validate()
    if (!isValid) return
    if (bookingForm.date < getLocalDateString()) {
        $q.notify({ type: 'warning', message: 'วันนัดหมายต้องไม่เป็นวันที่ผ่านมาแล้ว' })
        return
    }

    isOpen.value = false
    emit('booking-complete', {
        technician: props.technician,
        schedule: {
            date: bookingForm.date,
            time: bookingForm.time
        },
        location: {
            address: bookingForm.address,
            note: bookingForm.addressNote,
            latitude: bookingForm.latitude,
            longitude: bookingForm.longitude,
        },
        contact: {
            name: bookingForm.contactName,
            phone: bookingForm.contactPhone
        }
    })
}
</script>

<style scoped>
.gps-coordinate-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.25rem 0.5rem;
    margin: -0.25rem 0 0.75rem;
    color: #64748b;
    font-size: 0.75rem;
}

.location-help-text {
    margin: -0.5rem 0 0.75rem;
    color: #64748b;
    font-size: 0.6875rem;
    line-height: 1.4;
}

/* ==========================================================================
   1. Dialog Container & Main Sheet Layout
   ========================================================================== */
.booking-sheet-card {
    width: 100%;
    max-width: 38rem;
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
    background-color: #ffffff;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);

    /* จัดการ Layout ด้วย Flexbox ควบคุมความสูงสูงสุดไม่ให้ล้นหน้าจอ */
    display: flex;
    flex-direction: column;
    max-height: 90vh;
}

@media (min-width: 640px) {
    .booking-sheet-card {
        border-radius: 1.5rem !important;
        max-height: 85vh;
    }
}

.drag-handle-wrapper {
    display: flex;
    justify-content: center;
    padding-top: 0.75rem;
    padding-bottom: 0.25rem;
    flex-shrink: 0;
}

@media (min-width: 640px) {
    .drag-handle-wrapper {
        display: none;
    }
}

.drag-handle-bar {
    width: 3rem;
    height: 0.375rem;
    background-color: #e2e8f0;
    border-radius: 9999px;
}

/* ==========================================================================
   2. Header & Modal Text
   ========================================================================== */
.dialog-header {
    padding: 1.25rem 1.5rem 0.75rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
}

.header-text-group {
    display: flex;
    flex-direction: column;
}

.header-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.01em;
}

@media (min-width: 640px) {
    .header-title {
        font-size: 1.25rem;
    }
}

.header-subtitle {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.125rem;
    margin-bottom: 0;
}

.btn-close-modal {
    color: #94a3b8;
}

/* เนื้อหาภายในให้เลื่อนเฉพาะส่วนนี้ (Scrollable) */
.dialog-content {
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    flex-grow: 1;
    -webkit-overflow-scrolling: touch;
}

/* ส่วนปุ่มยืนยันด้านล่างที่จะเกาะติดหน้าจอเสมอ (Sticky Footer) */
.dialog-footer-sticky {
    padding: 1rem 1.5rem 1.25rem 1.5rem;
    background-color: #ffffff;
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.03);
}

@media (min-width: 640px) {
    .dialog-footer-sticky {
        border-top: none;
        padding-top: 0.5rem;
    }
}

/* ==========================================================================
   3. Selected Technician Summary Brief Card
   ========================================================================== */
.technician-brief-card {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background-color: #f0f9ff;
    border-radius: 1rem;
    border: 1px solid #bae6fd;
    margin-bottom: 1.25rem;
}

.tech-avatar {
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
}

.tech-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.tech-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.tech-name {
    font-size: 0.9375rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
}

.tech-price-block {
    text-align: right;
    flex-shrink: 0;
}

.price-label {
    font-size: 0.625rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
}

.price-value {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
}

/* ==========================================================================
   4. Booking Form & Custom Quasar Inputs Styling
   ========================================================================== */
.booking-form {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
}

.form-section {
    display: flex;
    flex-direction: column;
}

.form-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.375rem;
}

.mb-0 {
    margin-bottom: 0;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.grid-2-cols {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.875rem;
}

@media (min-width: 640px) {
    .grid-2-cols {
        grid-template-columns: repeat(2, 1fr);
    }
}

.input-wrapper {
    display: flex;
    flex-direction: column;
}

:deep(.minimal-input .q-field__control) {
    border-radius: 0.875rem !important;
    background-color: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    transition: all 0.25s ease !important;
}

:deep(.minimal-input.q-field--focused .q-field__control) {
    border-color: #0284c7 !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.1) !important;
}

:deep(.minimal-input .q-field__native) {
    font-size: 0.8125rem !important;
    font-weight: 600 !important;
    color: #0f172a !important;
}

:deep(.minimal-input .q-field__marginal) {
    color: #94a3b8 !important;
}

.input-icon {
    color: #0284c7;
}

.label-with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.375rem;
}

.btn-location {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    color: #0284c7;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s ease;
}

.btn-location:hover {
    background-color: #e0f2fe;
    color: #0369a1;
}

/* ==========================================================================
   5. Submit Action Button
   ========================================================================== */
.btn-submit {
    width: 100%;
    padding: 0.875rem 0 !important;
    background-color: #0284c7 !important;
    color: #ffffff !important;
    font-size: 0.9375rem !important;
    font-weight: 700 !important;
    border-radius: 0.875rem !important;
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25) !important;
    transition: all 0.2s ease !important;
}

@media (min-width: 640px) {
    .btn-submit {
        font-size: 1rem !important;
    }
}

.btn-submit:hover {
    background-color: #0369a1 !important;
    box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35) !important;
}
</style>
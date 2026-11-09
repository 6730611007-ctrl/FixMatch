<template>
    <q-page class="register-page">
        <div class="register-container">

            <!-- Header -->
            <div class="text-center mb-6">
                <router-link to="/login" class="back-link">
                    <q-icon name="arrow_back_ios" size="12px" />
                    <span>กลับไปหน้าแรก</span>
                </router-link>

                <div class="brand-icon-wrapper">
                    <q-icon name="engineering" size="36px" />
                </div>
                <h2 class="page-title">ลงทะเบียนพาร์ทเนอร์ช่าง FixMatch (ภูเก็ต)</h2>
                <p class="page-subtitle">มาร่วมเป็นส่วนหนึ่งของเครือข่ายช่างมืออาชีพ รับงานซ่อมในเขตจังหวัดภูเก็ต</p>
            </div>

            <!-- Stepper Header -->
            <div class="stepper-container">
                <div v-for="stepItem in steps" :key="stepItem.id" class="step-item">
                    <div class="step-number" :class="{ 'step-active': step >= stepItem.id }">
                        {{ stepItem.id }}
                    </div>
                    <span class="step-label" :class="{ 'step-label-active': step >= stepItem.id }">
                        {{ stepItem.title }}
                    </span>
                </div>
            </div>

            <!-- Form Container -->
            <q-card flat class="form-card">

                <!-- STEP 1: ข้อมูลส่วนตัว & การติดต่อ -->
                <div v-if="step === 1" class="step-section">
                    <h3 class="step-title">1. ข้อมูลส่วนตัว</h3>

                    <div class="form-group">
                        <label class="form-label">ชื่อ - นามสกุลจริง (ตรงตามบัตรประชาชน)</label>
                        <q-input v-model="techForm.fullName" outlined dense placeholder="นายสมชาย การช่าง"
                            class="form-input" />
                    </div>

                    <div class="grid-2-cols">
                        <div class="form-group">
                            <label class="form-label">เบอร์โทรศัพท์</label>
                            <q-input v-model="techForm.phone" outlined dense mask="###-###-####"
                                placeholder="08X-XXX-XXXX" class="form-input" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">LINE ID</label>
                            <q-input v-model="techForm.lineId" outlined dense placeholder="somchai_fixer"
                                class="form-input" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">พื้นที่รับงานหลักในจังหวัดภูเก็ต</label>
                        <q-select v-model="techForm.serviceArea" outlined dense multiple use-chips
                            :options="areaOptions" placeholder="เลือกเขตบริการในภูเก็ต" class="form-input" />
                    </div>

                    <q-btn unelevated no-caps class="btn-primary w-full mt-4" @click="step = 2">
                        ถัดไป: เลือกทักษะงานซ่อม
                    </q-btn>
                </div>

                <!-- STEP 2: เลือกทักษะและความเชี่ยวชาญ -->
                <div v-if="step === 2" class="step-section">
                    <h3 class="step-title">2. หมวดหมู่งานซ่อมที่เชี่ยวชาญ</h3>

                    <div class="skills-grid">
                        <button v-for="skill in skillCategories" :key="skill.id" type="button"
                            @click="toggleSkill(skill.id)" class="skill-card"
                            :class="{ 'skill-card-selected': techForm.selectedSkills.includes(skill.id) }">
                            <q-icon :name="skill.icon" size="28px"
                                :class="techForm.selectedSkills.includes(skill.id) ? 'icon-brand' : 'icon-slate'" />
                            <div>
                                <div class="skill-title">{{ skill.title }}</div>
                                <div class="skill-desc">{{ skill.desc }}</div>
                            </div>
                        </button>
                    </div>

                    <div class="form-group">
                        <label class="form-label">ประสบการณ์การทำงาน (ปี)</label>
                        <q-input v-model.number="techForm.experienceYears" type="number" outlined dense
                            placeholder="เช่น 5" class="form-input" />
                    </div>

                    <div class="btn-group">
                        <q-btn flat no-caps class="btn-secondary w-1-3" @click="step = 1">ย้อนกลับ</q-btn>
                        <q-btn unelevated no-caps class="btn-primary w-2-3"
                            :disabled="techForm.selectedSkills.length === 0" @click="step = 3">
                            ถัดไป: อัปโหลดเอกสาร
                        </q-btn>
                    </div>
                </div>

                <!-- STEP 3: อัปโหลดเอกสารยืนยันตัวตน (KYC) -->
                <div v-if="step === 3" class="step-section">
                    <h3 class="step-title">3. เอกสารยืนยันตัวตน (KYC)</h3>

                    <!-- Avatar / Profile Picture Upload -->
                    <div class="form-group mb-4">
                        <label class="form-label">รูปถ่ายหน้าตรง / รูปโปรไฟล์ (เห็นใบหน้าชัดเจน)</label>
                        <q-file v-model="techForm.avatarFile" outlined dense class="custom-file-uploader"
                            accept=".jpg, .png, image/*">
                            <template v-slot:default>
                                <div class="upload-box">
                                    <q-icon name="account_box" size="32px" class="upload-icon text-sky" />
                                    <p class="upload-title">
                                        {{ techForm.avatarFile ? techForm.avatarFile.name :
                                            'คลิกเพื่ออัปโหลดรูปถ่ายหน้าตรง' }}
                                    </p>
                                    <p class="upload-hint">ใช้เป็นรูปโปรไฟล์แสดงให้ลูกค้าเห็น</p>
                                </div>
                            </template>
                        </q-file>
                    </div>

                    <!-- ID Card Upload -->
                    <div class="form-group">
                        <label class="form-label">รูปถ่ายบัตรประชาชน (เห็นข้อมูลชัดเจน)</label>
                        <q-file v-model="techForm.idCardFile" outlined dense class="custom-file-uploader"
                            accept=".jpg, .png, image/*">
                            <template v-slot:default>
                                <div class="upload-box">
                                    <q-icon name="badge" size="32px" class="upload-icon" />
                                    <p class="upload-title">
                                        {{ techForm.idCardFile ? techForm.idCardFile.name :
                                            'คลิกเพื่ออัปโหลดรูปบัตรประชาชน' }}
                                    </p>
                                    <p class="upload-hint">รองรับไฟล์ JPG, PNG</p>
                                </div>
                            </template>
                        </q-file>
                    </div>

                    <!-- Certificate / Work Portfolio -->
                    <div class="form-group">
                        <label class="form-label">ใบรับรองการผ่านการฝึกอบรม / ใบอนุญาตประกอบวิชาชีพ (ถ้ามี)</label>
                        <q-file v-model="techForm.certificateFile" outlined dense class="custom-file-uploader"
                            accept=".jpg, .png, .pdf, image/*">
                            <template v-slot:default>
                                <div class="upload-box">
                                    <q-icon name="workspace_premium" size="32px" class="upload-icon" />
                                    <p class="upload-title">
                                        {{ techForm.certificateFile ? techForm.certificateFile.name :
                                            'คลิกเพื่ออัปโหลดใบรับรองวิชาชีพ' }}
                                    </p>
                                </div>
                            </template>
                        </q-file>
                    </div>

                    <!-- Bank Account Details for Payout -->
                    <div class="form-group pt-2">
                        <label class="form-label">บัญชีธนาคารสำหรับรับเงินค่าบริการ</label>
                        <div class="grid-2-cols">
                            <q-select v-model="techForm.bankName" outlined dense :options="bankOptions"
                                placeholder="เลือกธนาคาร" class="form-input" />
                            <q-input v-model="techForm.bankAccountNo" outlined dense placeholder="เลขที่บัญชี"
                                class="form-input" />
                        </div>
                    </div>

                    <div class="btn-group pt-2">
                        <q-btn flat no-caps class="btn-secondary w-1-3" @click="step = 2">ย้อนกลับ</q-btn>
                        <q-btn unelevated no-caps :loading="isSubmitting" class="btn-primary w-2-3"
                            @click="handleRegisterSubmit">
                            ส่งข้อมูลให้เจ้าหน้าที่ตรวจสอบ
                        </q-btn>
                    </div>
                </div>

                <!-- STEP 4: ติดตามสถานะการสมัคร -->
                <div v-if="step === 4" class="pending-container">
                    <div class="pending-icon-wrapper" :class="`status-${registrationStatus.toLowerCase()}`">
                        <q-spinner-dots v-if="isCheckingStatus" size="44px" color="primary" />
                        <q-icon v-else :name="registrationStatusIcon" size="44px" />
                    </div>
                    <div>
                        <h3 class="pending-title">{{ registrationStatusTitle }}</h3>
                        <p class="pending-desc">
                            {{ registrationStatusDescription }}
                        </p>
                    </div>

                    <div class="ref-card">
                        <div class="ref-label">หมายเลขอ้างอิงการสมัคร:</div>
                        <div class="ref-code">#{{ registration.referenceId || 'กำลังโหลด...' }}</div>
                        <div v-if="registration.submittedAt" class="ref-label q-mt-sm">
                            วันที่สมัคร {{ formatStatusDate(registration.submittedAt) }}
                        </div>
                    </div>

                    <div v-if="registrationStatus === 'REJECTED' && registration.rejectionReason"
                        class="rejection-reason">
                        <strong>เหตุผลที่ไม่อนุมัติ</strong>
                        <p>{{ registration.rejectionReason }}</p>
                    </div>

                    <div v-if="trackingError" class="text-negative text-caption">
                        {{ trackingError }}
                    </div>

                    <q-btn outline no-caps class="w-full" :loading="isCheckingStatus"
                        @click="loadRegistrationStatus">
                        <q-icon name="refresh" class="q-mr-sm" />
                        ตรวจสอบสถานะล่าสุด
                    </q-btn>

                    <q-btn v-if="registrationStatus === 'APPROVED'" unelevated no-caps
                        class="btn-primary w-full" to="/login">
                        เข้าสู่ระบบช่าง
                    </q-btn>
                    <q-btn v-else flat no-caps class="btn-dark w-full" to="/login">
                        กลับไปหน้าเข้าสู่ระบบ
                    </q-btn>
                </div>

            </q-card>

        </div>
    </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import fixmatchService from '../services/fixmatchService'
import { skillCategories } from '../services/technicianSkills'

const $q = useQuasar()
const step = ref(1)
const isSubmitting = ref(false)
const isCheckingStatus = ref(false)
const trackingError = ref('')
const registration = ref({
    referenceId: '',
    fullName: '',
    status: '',
    isApproved: false,
    rejectionReason: '',
    submittedAt: '',
})
const registrationStatus = computed(() => String(registration.value.status || '').toUpperCase())
const registrationStatusIcon = computed(() => {
    if (registrationStatus.value === 'APPROVED') return 'check_circle'
    if (registrationStatus.value === 'REJECTED') return 'cancel'
    if (trackingError.value) return 'cloud_off'
    return 'hourglass_top'
})
const registrationStatusTitle = computed(() => {
    if (isCheckingStatus.value && !registration.value.status) return 'กำลังตรวจสอบสถานะใบสมัคร'
    if (registrationStatus.value === 'APPROVED') return 'อนุมัติการสมัครแล้ว'
    if (registrationStatus.value === 'REJECTED') return 'ใบสมัครยังไม่ผ่านการอนุมัติ'
    if (trackingError.value && !registration.value.status) return 'ยังโหลดสถานะไม่ได้'
    return 'ส่งข้อมูลเรียบร้อยแล้ว'
})
const registrationStatusDescription = computed(() => {
    if (registrationStatus.value === 'APPROVED') return 'ผู้ดูแลระบบอนุมัติบัญชีช่างของคุณแล้ว สามารถเข้าสู่ระบบเพื่อเริ่มใช้งานได้'
    if (registrationStatus.value === 'REJECTED') return 'โปรดตรวจสอบเหตุผลด้านล่างและติดต่อผู้ดูแลระบบเพื่อดำเนินการแก้ไข'
    if (trackingError.value && !registration.value.status) return 'ข้อมูลติดตามใบสมัครยังไม่พร้อม กดลองตรวจสอบอีกครั้ง'
    return 'ทีมงานกำลังตรวจสอบเอกสารและข้อมูลของคุณ สถานะจะอัปเดตอัตโนมัติ คุณสามารถปิดหน้าเว็บแล้วกลับมาติดตามได้ภายหลัง'
})
let statusRefreshTimer = null

const steps = [
    { id: 1, title: 'ส่วนตัว' },
    { id: 2, title: 'ทักษะ' },
    { id: 3, title: 'เอกสาร' }
]

const techForm = reactive({
    fullName: '',
    phone: '',
    lineId: '',
    serviceArea: ['ภูเก็ต - ทุกพื้นที่'],
    selectedSkills: [],
    experienceYears: null,
    avatarFile: null,
    idCardFile: null,
    certificateFile: null,
    bankName: null,
    bankAccountNo: ''
})

// 🟢 กำหนดพื้นที่เฉพาะจังหวัดภูเก็ตเท่านั้น
const areaOptions = [
    'ภูเก็ต - อำเภอเมืองภูเก็ต',
    'ภูเก็ต - อำเภอกะทู้ (ป่าตอง/กมลา)',
    'ภูเก็ต - อำเภอถลาง (เชิงทะเล/ไม้ขาว)',
    'ภูเก็ต - ทุกพื้นที่'
]

const bankOptions = ['ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงเทพ', 'ธนาคารกรุงไทย']

const toggleSkill = (skillId) => {
    if (techForm.selectedSkills.includes(skillId)) {
        techForm.selectedSkills = techForm.selectedSkills.filter(id => id !== skillId)
    } else {
        techForm.selectedSkills.push(skillId)
    }
}

const handleRegisterSubmit = async () => {
    isSubmitting.value = true
    try {
        const formData = new FormData()

        const registrationToken = localStorage.getItem('technician_application_token')
        if (!registrationToken) {
            throw new Error('ไม่พบข้อมูลยืนยันบัญชี กรุณากลับไปเริ่มสมัครบัญชีช่างอีกครั้ง')
        }
        formData.append('registration_token', registrationToken)

        formData.append('fullName', techForm.fullName || '')
        formData.append('phone', techForm.phone || '')
        formData.append('lineId', techForm.lineId || '')
        // แนบพื้นที่รับงานเฉพาะภูเก็ต
        formData.append('serviceArea', JSON.stringify(techForm.serviceArea.length > 0 ? techForm.serviceArea : ['ภูเก็ต - ทุกพื้นที่']))
        formData.append('selectedSkills', JSON.stringify(techForm.selectedSkills))
        formData.append('experienceYears', techForm.experienceYears || 0)

        const bankNameValue = typeof techForm.bankName === 'object' && techForm.bankName !== null
            ? techForm.bankName.label || techForm.bankName.value
            : techForm.bankName;

        formData.append('bankName', bankNameValue || '')
        formData.append('bankAccountNo', techForm.bankAccountNo || '')

        if (techForm.avatarFile) {
            formData.append('avatarFile', techForm.avatarFile)
        }
        if (techForm.idCardFile) {
            formData.append('idCardFile', techForm.idCardFile)
        }
        if (techForm.certificateFile) {
            formData.append('certificateFile', techForm.certificateFile)
        }

        const result = await fixmatchService.registerTechnician(formData)
        if (!result?.tracking_token || !result?.reference_id) {
            throw new Error('เซิร์ฟเวอร์ไม่ได้ส่งข้อมูลสำหรับติดตามใบสมัคร')
        }

        localStorage.setItem('technician_registration_tracking_token', result.tracking_token)
        registration.value = {
            ...registration.value,
            referenceId: result.reference_id,
            status: result.status || 'PENDING',
        }
        localStorage.removeItem('technician_application_token')
        isSubmitting.value = false
        step.value = 4
        loadRegistrationStatus()
        $q.notify({
            type: 'positive',
            message: 'ส่งข้อมูลลงทะเบียนช่างเรียบร้อยแล้ว',
            icon: 'check_circle'
        })
    } catch (error) {
        isSubmitting.value = false
        console.error('ลงทะเบียนไม่สำเร็จ:', error)
        $q.notify({
            type: 'negative',
            message: error.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง',
            icon: 'error'
        })
    }
}

const loadRegistrationStatus = async () => {
    if (isCheckingStatus.value) return
    const trackingToken = localStorage.getItem('technician_registration_tracking_token')
    if (!trackingToken) {
        trackingError.value = 'ไม่พบข้อมูลติดตามในอุปกรณ์นี้ กรุณาใช้ลิงก์เดิมหรือส่งใบสมัครใหม่'
        return
    }

    isCheckingStatus.value = true
    trackingError.value = ''
    try {
        const response = await fixmatchService.getTechnicianRegistrationStatus(trackingToken)
        const statusData = response.data?.data
        if (!statusData?.referenceId || !statusData?.status) {
            throw new Error('ข้อมูลสถานะการสมัครจากระบบไม่ถูกต้อง')
        }
        registration.value = statusData
        step.value = 4
    } catch (error) {
        console.error('ตรวจสอบสถานะใบสมัครช่างไม่สำเร็จ:', error)
        trackingError.value = error.response?.data?.detail || 'ตรวจสอบสถานะไม่สำเร็จ กรุณาลองอีกครั้ง'
    } finally {
        isCheckingStatus.value = false
    }
}

const formatStatusDate = (value) => {
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return '-'
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

onMounted(() => {
    if (localStorage.getItem('technician_registration_tracking_token')) {
        step.value = 4
        loadRegistrationStatus()
        statusRefreshTimer = window.setInterval(loadRegistrationStatus, 30000)
    }
})

onUnmounted(() => {
    if (statusRefreshTimer) window.clearInterval(statusRefreshTimer)
})
</script>

<style scoped>
/* ==========================================================================
   1. Page & Layout Containers
   ========================================================================== */
.register-page {
    background-color: #f8fafc;
    min-height: 100vh;
    padding: 2rem 1rem;
}

@media (min-width: 640px) {
    .register-page {
        padding: 2rem 1.5rem;
    }
}

.register-container {
    max-width: 36rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* ==========================================================================
   2. Header Navigation & Branding
   ========================================================================== */
.back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-decoration: none;
    margin-bottom: 1rem;
    transition: color 0.2s ease;
}

.back-link:hover {
    color: #1e293b;
}

.brand-icon-wrapper {
    width: 4rem;
    height: 4rem;
    background-color: #f0f9ff;
    color: #0284c7;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem auto;
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.page-subtitle {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    margin-bottom: 0;
}

/* ==========================================================================
   3. Stepper Bar
   ========================================================================== */
.stepper-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: #ffffff;
    border-radius: 1rem;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.step-number {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    background-color: #f1f5f9;
    color: #94a3b8;
    transition: all 0.3s ease;
}

.step-active {
    background-color: #0284c7;
    color: #ffffff;
}

.step-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
    display: none;
}

@media (min-width: 640px) {
    .step-label {
        display: inline;
    }
}

.step-label-active {
    color: #1e293b;
}

/* ==========================================================================
   4. Form Card & Section Structure
   ========================================================================== */
.form-card {
    border-radius: 1.5rem !important;
    border: 1px solid #f1f5f9;
    background-color: #ffffff;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.step-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.step-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f1f5f9;
    margin: 0;
}

.grid-2-cols {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
}

@media (min-width: 640px) {
    .grid-2-cols {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* ==========================================================================
   5. Form Controls & Quasar Input Overrides
   ========================================================================== */
.form-group {
    display: flex;
    flex-direction: column;
}

.form-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.375rem;
}

:deep(.q-field--outlined .q-field__control) {
    border-radius: 0.75rem !important;
    background-color: #f8fafc;
}

:deep(.q-field--focused .q-field__control) {
    border-color: #0284c7 !important;
    background-color: #ffffff;
}

/* Custom File Uploader Override */
:deep(.custom-file-uploader .q-field__control) {
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
}

:deep(.custom-file-uploader .q-field__control:before),
:deep(.custom-file-uploader .q-field__control:after) {
    display: none !important;
}

:deep(.custom-file-uploader .q-field__native) {
    padding: 0;
}

/* ==========================================================================
   6. Skills Selection Grid
   ========================================================================== */
.skills-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
}

.skill-card {
    padding: 1rem;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    text-align: left;
    background: #ffffff;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 7rem;
    cursor: pointer;
}

.skill-card:hover {
    background-color: #f8fafc;
}

.skill-card-selected {
    border-color: #0284c7 !important;
    background-color: rgba(240, 249, 255, 0.6) !important;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
}

.icon-brand {
    color: #0284c7;
}

.icon-slate {
    color: #94a3b8;
}

.skill-title {
    font-weight: 700;
    font-size: 0.75rem;
    color: #1e293b;
}

.skill-desc {
    font-size: 0.625rem;
    color: #94a3b8;
    margin-top: 0.125rem;
}

/* ==========================================================================
   7. Document Upload Box (KYC)
   ========================================================================== */
.upload-box {
    width: 100%;
    border: 2px dashed #e2e8f0;
    border-radius: 1rem;
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    background-color: #ffffff;
    transition: all 0.2s ease;
}

.upload-box:hover {
    border-color: #0284c7;
    background-color: #f0f9ff;
}

.upload-icon {
    color: #94a3b8;
    margin-bottom: 0.25rem;
}

.upload-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    margin: 0;
}

.upload-hint {
    font-size: 0.625rem;
    color: #94a3b8;
    margin-top: 0.125rem;
    margin-bottom: 0;
}

/* ==========================================================================
   8. Pending Approval State (Step 4)
   ========================================================================== */
.pending-container {
    text-align: center;
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.pending-icon-wrapper {
    width: 5rem;
    height: 5rem;
    background-color: #fffbeb;
    color: #f59e0b;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

.pending-icon-wrapper.status-approved {
    background-color: #ecfdf5;
    color: #059669;
}

.pending-icon-wrapper.status-rejected {
    background-color: #fef2f2;
    color: #dc2626;
}

.pending-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.pending-desc {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.5rem;
    line-height: 1.6;
    max-width: 24rem;
    margin-left: auto;
    margin-right: auto;
}

.ref-card {
    padding: 1rem;
    background-color: #f8fafc;
    border-radius: 1rem;
    border: 1px solid #f1f5f9;
    text-align: left;
    font-size: 0.75rem;
}

.ref-label {
    color: #94a3b8;
}

.ref-code {
    font-family: monospace;
    font-weight: 700;
    color: #334155;
    margin-top: 0.25rem;
}

/* ==========================================================================
   9. Buttons & Utilities
   ========================================================================== */
.btn-group {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.5rem;
}

.w-full {
    width: 100%;
}

.w-1-3 {
    width: 33.333333%;
}

.w-2-3 {
    width: 66.666667%;
}

.mt-4 {
    margin-top: 1rem;
}

.pt-2 {
    padding-top: 0.5rem;
}

.mb-6 {
    margin-bottom: 1.5rem;
}

.btn-primary {
    padding: 0.75rem 0 !important;
    background-color: #0284c7 !important;
    color: #ffffff !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2) !important;
}

.btn-secondary {
    padding: 0.75rem 0 !important;
    color: #475569 !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
}

.btn-dark {
    padding: 0.75rem 0 !important;
    background-color: #1e293b !important;
    color: #ffffff !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    border-radius: 0.75rem !important;
}

:deep(.hidden-file-input .q-field__control) {
    background: transparent !important;
    padding: 0 !important;
    border: none !important;
}

:deep(.hidden-file-input .q-field__append) {
    display: none !important;
}
</style>
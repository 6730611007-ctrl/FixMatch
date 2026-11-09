<template>
    <q-page class="register-glass-page">

        <!-- Background Dark Room Overlay with Ambient Glow Orbs -->
        <div class="bg-dark-room"></div>
        <div class="bg-glow-orb orb-top"></div>
        <div class="bg-glow-orb orb-bottom"></div>

        <div class="glass-page-wrapper">
            <div class="glass-card">

                <!-- Top Navigation & Header -->
                <div class="card-header">
                    <router-link to="/login" class="glass-back-link">
                        <q-icon name="arrow_back_ios" size="12px" />
                        <span>กลับไปหน้าเข้าสู่ระบบ</span>
                    </router-link>

                    <div class="logo-header-group">
                        <div class="glass-logo-box">
                            <q-icon name="engineering" class="logo-icon" />
                        </div>
                        <h2 class="card-title">
                            สมัครพาร์ทเนอร์ช่าง <span class="text-sky">FixMatch</span>
                        </h2>
                        <p class="card-subtitle">
                            กรอกข้อมูลบัญชี Google (Gmail) เพื่อเริ่มต้นลงทะเบียนช่างเทคนิคในเขตภูเก็ต
                        </p>
                    </div>
                </div>

                <!-- Registration Form -->
                <q-form @submit.prevent="handleRegister" class="form-content">

                    <!-- Full Name -->
                    <div class="form-group">
                        <label class="input-label">ชื่อ - นามสกุลจริง (ตรงตามบัตรประชาชน)</label>
                        <q-input v-model="registerForm.fullName" outlined dense placeholder="นายสมชาย การช่าง"
                            class="glass-input" :rules="[(val) => !!val || 'กรุณากรอกชื่อ-นามสกุล']">
                            <template #prepend>
                                <q-icon name="badge" class="field-icon" size="18px" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Email (Gmail เท่านั้น) -->
                    <div class="form-group">
                        <label class="input-label">บัญชี Google (Gmail)</label>
                        <q-input v-model="registerForm.email" outlined dense type="email"
                            placeholder="your.email@gmail.com" class="glass-input" :rules="[
                                val => !!val || 'กรุณากรอกอีเมล',
                                val => val.toLowerCase().endsWith('@gmail.com') || 'กรุณาใช้อีเมล Gmail (@gmail.com) เท่านั้น'
                            ]">
                            <template #prepend>
                                <q-icon name="email" class="field-icon" size="18px" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Password -->
                    <div class="form-group">
                        <label class="input-label">รหัสผ่านสำหรับเข้าใช้งาน</label>
                        <q-input v-model="registerForm.password" :type="isPasswordVisible ? 'text' : 'password'"
                            outlined dense placeholder="ตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร" class="glass-input" :rules="[
                                (val) => !!val || 'กรุณากรอกรหัสผ่าน',
                                (val) => val.length >= 6 || 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
                            ]">
                            <template #prepend>
                                <q-icon name="lock" class="field-icon" size="18px" />
                            </template>
                            <template #append>
                                <q-icon :name="isPasswordVisible ? 'visibility' : 'visibility_off'"
                                    class="field-icon cursor-pointer" size="18px"
                                    @click="isPasswordVisible = !isPasswordVisible" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Confirm Password -->
                    <div class="form-group">
                        <label class="input-label">ยืนยันรหัสผ่าน</label>
                        <q-input v-model="registerForm.confirmPassword" :type="isPasswordVisible ? 'text' : 'password'"
                            outlined dense placeholder="กรอกรหัสผ่านอีกครั้ง" class="glass-input" :rules="[
                                (val) => !!val || 'กรุณายืนยันรหัสผ่าน',
                                (val) => val === registerForm.password || 'รหัสผ่านไม่ตรงกัน',
                            ]">
                            <template #prepend>
                                <q-icon name="lock_reset" class="field-icon" size="18px" />
                            </template>
                        </q-input>
                    </div>

                    <!-- Terms Agreement Checkbox -->
                    <div class="terms-row">
                        <q-checkbox v-model="registerForm.agreeTerms" dense dark color="sky-10"
                            class="terms-checkbox" />
                        <span class="terms-text">
                            ฉันยอมรับ <a href="#" class="terms-link">เงื่อนไขข้อตกลงพาร์ทเนอร์ช่าง</a> และ
                            <a href="#" class="terms-link">นโยบายความเป็นส่วนตัว</a>
                        </span>
                    </div>

                    <!-- Submit Button -->
                    <q-btn type="submit" unelevated no-caps :disabled="!registerForm.agreeTerms" :loading="isLoading"
                        class="btn-glass-submit">
                        <div class="btn-inner">
                            <span>ถัดไป: กรอกข้อมูลช่างและพื้นที่ให้บริการ</span>
                            <q-icon name="arrow_forward" size="18px" />
                        </div>
                    </q-btn>
                </q-form>

                <!-- Footer Link to Login -->
                <div class="card-footer">
                    มีบัญชีสมาชิกอยู่แล้ว?
                    <router-link to="/login" class="register-link">เข้าสู่ระบบที่นี่</router-link>
                </div>

            </div>
        </div>
    </q-page>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '../boot/axios'

const $q = useQuasar()
const router = useRouter()

const isLoading = ref(false)
const isPasswordVisible = ref(false)

const registerForm = reactive({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
})

const handleRegister = async () => {
    isLoading.value = true

    try {
        const response = await api.post('/auth/register-technician', {
            email: registerForm.email.trim(),
            password: registerForm.password,
            full_name: registerForm.fullName.trim()
        })

        localStorage.setItem('technician_application_token', response.data.application_token)

        $q.notify({
            type: 'positive',
            message: 'สร้างบัญชีเบื้องต้นสำเร็จ! กรุณากรอกข้อมูลช่างเพิ่มเติม',
            icon: 'check_circle',
            timeout: 1500
        })

        // นำทางไปหน้ากรอกรายละเอียดช่างต่อทันที
        router.push('/tech-register')

    } catch (error) {
        console.error('ลงทะเบียนไม่สำเร็จ:', error)

        let errorMsg = 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง'
        const detail = error.response?.data?.detail

        if (typeof detail === 'string') {
            errorMsg = detail
        } else if (Array.isArray(detail)) {
            errorMsg = detail.map(err => err.msg).join(', ')
        }

        $q.notify({
            type: 'negative',
            message: errorMsg,
            icon: 'error',
            timeout: 2500
        })
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
/* ==========================================================================
   1. Page Layout & Dark Blurred Room Background
   ========================================================================== */
.register-glass-page {
    position: relative;
    min-height: 100vh;
    background-color: #0b1329;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem 1rem;
    overflow: hidden;
}

.bg-dark-room {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 50% 30%, rgba(15, 32, 67, 0.7) 0%, rgba(7, 11, 22, 0.95) 100%),
        linear-gradient(180deg, rgba(11, 19, 41, 0.85), rgba(7, 11, 22, 0.95));
    z-index: 0;
}

.bg-glow-orb {
    position: absolute;
    border-radius: 9999px;
    filter: blur(90px);
    pointer-events: none;
    z-index: 0;
}

.orb-top {
    width: 30rem;
    height: 30rem;
    top: -10rem;
    left: 10%;
    background-color: rgba(2, 132, 199, 0.25);
}

.orb-bottom {
    width: 25rem;
    height: 25rem;
    bottom: -8rem;
    right: 15%;
    background-color: rgba(56, 189, 248, 0.15);
}

.glass-page-wrapper {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 26.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ==========================================================================
   2. Liquid Glass Card Container
   ========================================================================== */
.glass-card {
    width: 100%;
    background: rgba(15, 23, 42, 0.58);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 2rem;
    padding: 2.25rem 2rem;
    box-shadow:
        0 30px 60px rgba(0, 0, 0, 0.4),
        inset 0 1px 1px rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: #ffffff;
}

.glass-back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    margin-bottom: 0.875rem;
    transition: color 0.2s ease;
}

.glass-back-link:hover {
    color: #38bdf8;
}

.logo-header-group {
    text-align: center;
}

.glass-logo-box {
    width: 3.5rem;
    height: 3.5rem;
    background: linear-gradient(135deg, rgba(2, 132, 199, 0.4), rgba(56, 189, 248, 0.2));
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem auto;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.logo-icon {
    font-size: 1.875rem !important;
    color: #38bdf8;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.01em;
}

@media (min-width: 640px) {
    .card-title {
        font-size: 1.375rem;
    }
}

.text-sky {
    color: #38bdf8;
}

.card-subtitle {
    font-size: 0.75rem;
    color: rgba(226, 232, 240, 0.75);
    margin-top: 0.375rem;
    margin-bottom: 0;
    line-height: 1.45;
}

/* ==========================================================================
   3. Form Controls & Glass Inputs
   ========================================================================== */
.form-content {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.input-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(241, 245, 249, 0.9);
    margin-bottom: 0.375rem;
}

.field-icon {
    color: rgba(255, 255, 255, 0.6);
}

.terms-row {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.125rem 0;
}

.terms-checkbox {
    margin-top: 0.125rem;
}

.terms-text {
    font-size: 0.75rem;
    color: rgba(226, 232, 240, 0.8);
    line-height: 1.45;
}

.terms-link {
    color: #38bdf8;
    font-weight: 700;
    text-decoration: none;
}

.terms-link:hover {
    text-decoration: underline;
}

.btn-glass-submit {
    width: 100%;
    padding: 0.75rem 0 !important;
    margin-top: 0.375rem;
    background-color: #0076ff !important;
    color: #ffffff !important;
    font-size: 0.875rem !important;
    font-weight: 700 !important;
    border-radius: 9999px !important;
    box-shadow: 0 8px 20px rgba(0, 118, 255, 0.4) !important;
    transition: all 0.2s ease !important;
}

.btn-glass-submit:hover:not(:disabled) {
    background-color: #0066de !important;
    box-shadow: 0 10px 24px rgba(0, 118, 255, 0.5) !important;
}

.btn-glass-submit:disabled {
    opacity: 0.45 !important;
    box-shadow: none !important;
}

.btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
}

.card-footer {
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.25rem;
}

.register-link {
    font-weight: 700;
    color: #38bdf8;
    text-decoration: none;
    margin-left: 0.25rem;
}

.register-link:hover {
    text-decoration: underline;
}

:deep(.glass-input .q-field__control) {
    border-radius: 9999px !important;
    background-color: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    padding: 0 1rem !important;
    transition: all 0.2s ease !important;
}

:deep(.glass-input.q-field--focused .q-field__control) {
    border-color: #38bdf8 !important;
    background-color: rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2) !important;
}

:deep(.glass-input .q-field__native) {
    font-size: 0.8125rem !important;
    color: #ffffff !important;
}

:deep(.glass-input .q-field__native::placeholder) {
    color: rgba(255, 255, 255, 0.4) !important;
}
</style>
<template>
    <q-page class="login-page">
        <!-- Decorative background -->
        <div class="scene scene-top" aria-hidden="true">
            <span class="tool tool-house">⌂</span>
            <span class="tool tool-hammer">🔨</span>
            <span class="tool tool-drill">🛠️</span>
            <span class="tool tool-wrench">🔧</span>
            <span class="tool tool-screwdriver">🪛</span>
            <span class="tool tool-lock">🔒</span>
            <span class="tool tool-key">🔑</span>
        </div>

        <div class="login-shell">
            <!-- Brand illustration above the card -->
            <header class="brand-scene">
                <div class="brand-dots dots-left"></div>
                <div class="brand-dots dots-right"></div>
                <div class="brand-house">
                    <q-icon name="home" class="house-icon" />
                    <div class="house-roof"></div>
                    <div class="house-body">
                        <q-icon name="home_repair_service" class="brand-toolbox" />
                    </div>
                </div>
                <span class="floating-tool floating-hammer"><q-icon name="handyman" /></span>
                <span class="floating-tool floating-wrench"><q-icon name="build" /></span>
                <span class="floating-tool floating-screw"><q-icon name="construction" /></span>
                <div class="brand-name">FixMath <span>Pro</span></div>
            </header>

            <section class="login-card">
                <div class="header-section">
                    <h1 class="app-title">เข้าสู่ระบบ FixMath Pro</h1>
                    <p class="app-subtitle">บริการสำหรับลูกค้าและพาร์ทเนอร์ช่างเทคนิค (เขตภูเก็ต)</p>
                </div>

                <!-- 🟢 กล่องแจ้งเตือนสำหรับช่างเทคนิค -->
                <div class="tech-notice-box">
                    <q-icon name="engineering" size="20px" class="text-sky-600 q-mr-xs" />
                    <div class="tech-notice-text">
                        <strong>สำหรับช่างเทคนิค:</strong> เข้าสู่ระบบด้วย Google บัญชีที่ผ่านการอนุมัติ
                        ระบบจะนำท่านไปยังบอร์ดรับงานโดยอัตโนมัติ
                    </div>
                </div>

                <div v-if="bookingStore.pendingTechnicianBooking" class="booking-login-notice">
                    <q-icon name="event_available" size="20px" />
                    <span>
                        เลือก{{ bookingStore.selectedTechnician?.name || 'ช่าง' }}ไว้แล้ว
                        กรุณาเข้าสู่ระบบเพื่อดำเนินการนัดหมาย
                    </span>
                </div>

                <!-- Google Login Button Container -->
                <div class="google-login-container">
                    <div id="googleSignInBtn" class="google-btn-wrapper"></div>
                </div>

                <div class="register-footer">
                    ยังไม่ได้ลงทะเบียนเป็นช่าง?
                    <router-link to="/register" class="register-link">สมัครพาร์ทเนอร์ช่าง FixMath Pro</router-link>
                </div>
                <div v-if="hasTechnicianTracking" class="register-footer">
                    สมัครเป็นช่างแล้ว?
                    <router-link to="/tech-register" class="register-link">ติดตามสถานะใบสมัคร</router-link>
                </div>
                <q-btn flat no-caps color="primary" icon="arrow_back" label="กลับไปเลือกช่าง"
                    class="home-link" to="/" />

                <!-- Loading overlay -->
                <q-inner-loading :showing="isLoading">
                    <q-spinner-dots size="40px" color="primary" />
                </q-inner-loading>
            </section>
        </div>

        <!-- Large, low-contrast tool illustrations around the page -->
        <div class="background-tools" aria-hidden="true">
            <q-icon name="build" class="bg-tool bg-wrench-left" />
            <q-icon name="key" class="bg-tool bg-key-left" />
            <q-icon name="lock" class="bg-tool bg-lock-bottom" />
            <q-icon name="handyman" class="bg-tool bg-hammer-right" />
            <q-icon name="construction" class="bg-tool bg-drill-right" />
            <q-icon name="build" class="bg-tool bg-wrench-right" />
            <q-icon name="home_repair_service" class="bg-tool bg-toolbox-right" />
        </div>
    </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '../boot/axios'
import { useAuthStore } from '@/stores/authStore'
import { useBookingStore } from '@/stores/bookingStore'
import { getActiveTrackingOrder, isTechnicianAccepted } from '@/services/activeTracking'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()
const isLoading = ref(false)
const hasTechnicianTracking = ref(
    Boolean(localStorage.getItem('technician_registration_tracking_token')),
)

const GOOGLE_CLIENT_ID = '962916103340-o0feqcu45fit8sespvcvvd37pgqv2jkn.apps.googleusercontent.com'

const getGoogleProfilePicture = (credential) => {
    try {
        const encodedPayload = credential.split('.')[1]
        if (!encodedPayload) return ''

        const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
        const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
        const bytes = Uint8Array.from(atob(paddedBase64), character => character.charCodeAt(0))
        const claims = JSON.parse(new TextDecoder().decode(bytes))
        return typeof claims.picture === 'string' ? claims.picture : ''
    } catch (error) {
        console.warn('ไม่สามารถอ่านรูปโปรไฟล์จาก Google ID Token ได้:', error)
        return ''
    }
}

const handleGoogleCallback = async (response) => {
    isLoading.value = true
    try {
        const res = await api.post('/auth/google', {
            credential: response.credential
        })

        const authData = res.data?.data || res.data
        const accessToken = authData?.access_token || authData?.accessToken || authData?.token
        const authenticatedUser = authData?.user || res.data?.user

        if (!accessToken) {
            throw new Error('เข้าสู่ระบบไม่สำเร็จ: ไม่พบ access token จากระบบ')
        }

        const profilePicture = authenticatedUser?.avatar
            || authenticatedUser?.avatarUrl
            || authenticatedUser?.avatar_url
            || authenticatedUser?.picture
            || getGoogleProfilePicture(response.credential)
        authStore.setAuth(
            authenticatedUser ? { ...authenticatedUser, avatar: profilePicture } : null,
            accessToken,
        )

        // ส่งสัญญาณอัปเดต Topbar / Navbar
        window.dispatchEvent(new Event('auth-changed'))

        const userRole = String(authenticatedUser?.role || authData?.role || res.data?.role || 'customer')
            .trim()
            .toLowerCase()

        $q.notify({
            type: 'positive',
            message: `เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ${authenticatedUser?.fullName || ''}`,
            icon: 'check_circle',
            timeout: 1500
        })

        // 🟢 เปลี่ยนเส้นทางตาม Role
        const activeOrderId = getActiveTrackingOrder()
        const destination = activeOrderId
            ? {
                name: isTechnicianAccepted(activeOrderId) ? 'tracking' : 'booking-waiting',
                params: { orderId: activeOrderId },
            }
            : userRole === 'technician'
                ? { name: 'tech-job-board' }
                : userRole === 'admin'
                    ? { name: 'admin-dashboard' }
                    : { name: 'diagnostic' }

        await router.replace(destination)
    } catch (error) {
        console.error('Google Login Error:', error)
        $q.notify({
            type: 'negative',
            message: error.response?.data?.detail || error.message || 'การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง',
            icon: 'error',
            timeout: 2500
        })
    } finally {
        isLoading.value = false
    }
}

const initializeGoogleSignIn = () => {
    if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback
        })

        window.google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with',
                shape: 'pill',
                locale: 'th'
            }
        )
    } else {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback
            })
            window.google.accounts.id.renderButton(
                document.getElementById('googleSignInBtn'),
                {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'signin_with',
                    shape: 'pill',
                    locale: 'th'
                }
            )
        }
        document.head.appendChild(script)
    }
}

onMounted(() => {
    initializeGoogleSignIn()
})
</script>

<style scoped>
.login-page {
    --blue: #287fc0;
    --blue-dark: #17649f;
    --ink: #20252d;
    --muted: #777f89;
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    width: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 18px 34px;
    background:
        radial-gradient(ellipse at 50% 8%, rgba(255, 255, 255, 0.98) 0 20%, transparent 50%),
        linear-gradient(180deg, #f9fafb 0%, #eef0f4 39%, #e8ebf0 100%);
    font-family: "Noto Sans Thai", "Sarabun", Arial, sans-serif;
    color: var(--ink);
}

.login-page::before {
    content: "";
    position: absolute;
    z-index: -2;
    left: -12%;
    right: -12%;
    top: 23%;
    height: 100%;
    border-radius: 48% 48% 0 0 / 7% 7% 0 0;
    background: linear-gradient(180deg, rgba(226, 230, 237, 0.72), rgba(238, 240, 244, 0.94));
    border-top: 1px solid rgba(255, 255, 255, 0.9);
}

.login-page::after {
    content: "";
    position: absolute;
    z-index: -1;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(#b9c1cc 0.8px, transparent 0.8px);
    background-size: 22px 22px;
    opacity: 0.08;
}

.login-shell {
    position: relative;
    z-index: 2;
    width: min(100%, 360px);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.brand-scene {
    width: 100%;
    height: 112px;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 0;
    overflow: hidden;
}

.brand-house {
    position: relative;
    width: 104px;
    height: 78px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    margin-bottom: 0;
}

.house-roof {
    position: absolute;
    top: 9px;
    left: 14px;
    width: 76px;
    height: 54px;
    border-top: 3px solid #7d8794;
    border-left: 3px solid #7d8794;
    transform: rotate(45deg) scale(0.72);
    border-radius: 2px;
    background: rgba(218, 226, 235, 0.35);
}

.house-body {
    position: relative;
    z-index: 1;
    width: 72px;
    height: 49px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #dcecf8, #f9fcff);
    border: 2px solid #a8b5c4;
    border-top: 0;
    border-radius: 2px 2px 0 0;
    box-shadow: 0 3px 8px rgba(63, 82, 105, 0.08);
}

.brand-toolbox {
    font-size: 35px;
    color: #287fc0;
    filter: drop-shadow(0 2px 1px rgba(0, 0, 0, 0.12));
}

.house-icon {
    position: absolute;
    top: -3px;
    left: -5px;
    z-index: 2;
    font-size: 27px;
    color: #9bb5cc;
    opacity: 0.9;
}

.brand-name {
    position: absolute;
    bottom: 6px;
    z-index: 3;
    padding: 2px 10px;
    background: rgba(248, 250, 252, 0.92);
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: #303844;
}

.brand-name span {
    color: #e2a43b;
}

.floating-tool {
    position: absolute;
    color: #7d8fa3;
    font-size: 25px;
    filter: drop-shadow(0 2px 1px rgba(50, 60, 70, 0.12));
}

.floating-tool .q-icon {
    font-size: inherit;
}

.floating-hammer {
    top: 17px;
    right: 43px;
    color: #d7a14b;
    transform: rotate(-18deg);
}

.floating-wrench {
    top: 55px;
    left: 38px;
    transform: rotate(-12deg);
}

.floating-screw {
    top: 55px;
    right: 39px;
    color: #4e8bb5;
    transform: rotate(20deg);
}

.brand-dots {
    position: absolute;
    top: 18px;
    width: 40px;
    height: 40px;
    border: 2px dashed rgba(151, 163, 178, 0.42);
    border-color: rgba(151, 163, 178, 0.42) transparent transparent rgba(151, 163, 178, 0.42);
    border-radius: 50%;
}

.dots-left {
    left: 62px;
    transform: rotate(20deg);
}

.dots-right {
    right: 62px;
    transform: rotate(190deg);
}

.login-card {
    position: relative;
    width: 100%;
    padding: 24px 22px 22px;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(222, 226, 232, 0.85);
    border-radius: 17px;
    box-shadow: 0 7px 18px rgba(34, 45, 58, 0.12), 0 1px 3px rgba(34, 45, 58, 0.06);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.header-section {
    text-align: center;
}

.app-title {
    margin: 0;
    color: #17191d;
    font-size: 21px;
    font-weight: 750;
    line-height: 1.4;
    letter-spacing: -0.35px;
}

.app-subtitle {
    margin: 4px 0 0;
    color: #777b82;
    font-size: 12px;
    line-height: 1.6;
}

/* 🟢 Style สำหรับกล่องคำแนะนำช่างเทคนิค */
.tech-notice-box {
    display: flex;
    align-items: flex-start;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 0.625rem 0.75rem;
    border-radius: 0.75rem;
}

.tech-notice-text {
    font-size: 0.6875rem;
    color: #0369a1;
    line-height: 1.4;
}

.booking-login-notice {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #a7f3d0;
    border-radius: 0.75rem;
    color: #047857;
    background: #ecfdf5;
    font-size: 0.75rem;
    line-height: 1.5;
}

.booking-login-notice .q-icon {
    flex: 0 0 auto;
}

.google-login-container {
    display: flex;
    justify-content: center;
    width: 100%;
}

.google-btn-wrapper {
    width: 100%;
}

.register-footer {
    margin-top: 2px;
    text-align: center;
    color: #555b63;
    font-size: 11.5px;
    line-height: 1.6;
}

.register-link {
    margin-left: 3px;
    color: #397da8;
    font-weight: 700;
    text-decoration: none;
}

.register-link:hover {
    color: #175f92;
    text-decoration: underline;
}

.background-tools {
    position: absolute;
    z-index: 0;
    inset: 0;
    pointer-events: none;
    color: #9ba6b2;
}

.bg-tool {
    position: absolute;
    opacity: 0.78;
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.6));
}

.bg-wrench-left {
    left: 3%;
    bottom: 7%;
    font-size: 82px;
    transform: rotate(-30deg);
    color: #8f9ba8;
}

.bg-key-left {
    left: 23%;
    top: 42%;
    font-size: 58px;
    transform: rotate(-25deg);
    color: #a3adb9;
}

.bg-lock-bottom {
    left: 21%;
    bottom: 4%;
    font-size: 56px;
    color: #c0a46e;
}

.bg-hammer-right {
    right: 4%;
    bottom: 9%;
    font-size: 74px;
    transform: rotate(28deg);
    color: #8b98a5;
}

.bg-drill-right {
    right: -1%;
    top: 41%;
    font-size: 92px;
    transform: rotate(-22deg);
    color: #d4a24f;
}

.bg-wrench-right {
    right: 14%;
    bottom: 4%;
    font-size: 68px;
    transform: rotate(25deg);
    color: #9ba6b2;
}

.bg-toolbox-right {
    right: 23%;
    bottom: 7%;
    font-size: 68px;
    color: #9ba6b2;
}

.scene {
    position: absolute;
    z-index: 0;
    pointer-events: none;
}

.scene-top {
    top: 0;
    left: 0;
    right: 0;
    height: 100px;
}

.tool {
    position: absolute;
    opacity: 0.7;
    font-size: 22px;
    filter: grayscale(0.25);
}

.tool-house {
    top: 10px;
    left: 25%;
    color: #8baac4;
}

.tool-hammer {
    top: 20px;
    left: 39%;
}

.tool-drill {
    top: 18px;
    right: 38%;
}

.tool-wrench {
    top: 58px;
    left: 29%;
}

.tool-screwdriver {
    top: 58px;
    right: 30%;
}

.tool-lock {
    top: 48px;
    left: 18%;
}

.tool-key {
    top: 54px;
    right: 18%;
}

@media (min-width: 900px) {
    .login-shell {
        width: 340px;
    }

    .brand-scene {
        height: 118px;
    }

    .login-card {
        padding: 22px 22px 20px;
        gap: 16px;
    }
}

@media (max-width: 600px) {
    .login-page {
        padding: 14px 16px 24px;
        min-height: 100svh;
    }

    .login-shell {
        width: min(100%, 350px);
    }

    .brand-scene {
        height: 104px;
    }

    .login-card {
        padding: 20px 18px 18px;
    }

    .app-title {
        font-size: 20px;
    }

    .bg-tool {
        opacity: 0.25;
    }

    .bg-key-left,
    .bg-lock-bottom {
        left: 2%;
    }

    .bg-toolbox-right,
    .bg-wrench-right {
        right: 1%;
    }
}
</style>
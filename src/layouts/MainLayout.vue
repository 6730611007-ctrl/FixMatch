<template>
  <q-layout view="lHh Lpr lFf" class="glass-layout-bg">
    <div class="floating-tools-bg" aria-hidden="true">
      <q-icon name="handyman" class="floating-tool tool-1" />
      <q-icon name="construction" class="floating-tool tool-2" />
      <q-icon name="build" class="floating-tool tool-3" />
      <q-icon name="hardware" class="floating-tool tool-4" />
      <q-icon name="plumbing" class="floating-tool tool-5" />
      <q-icon name="electrical_services" class="floating-tool tool-6" />
      <q-icon name="home_repair_service" class="floating-tool tool-7" />
      <q-icon name="settings" class="floating-tool tool-8" />
      <q-icon name="handyman" class="floating-tool tool-9" />
      <q-icon name="construction" class="floating-tool tool-10" />
    </div>
    <!-- 🟢 Header แบบกระจกใส สไตล์มินิมอล -->
    <q-header class="glass-header text-slate-800">
      <q-toolbar class="q-px-md">
        <!-- ปุ่มเมนูแบบมินิมอล (เปลี่ยนสีและเพิ่มความโค้งมนตอนกด) -->
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer"
          class="header-icon-btn q-mr-sm" />

        <!-- โลโก้หรือชื่อแบรนด์แบบสะอาดตา -->
        <q-toolbar-title class="header-brand-title">
          <img :src="fixMatchLogo" class="header-brand-mark" alt="" />
          <span class="header-brand-name">
            <span class="brand-fix">Fix</span><span class="brand-match">Match</span>
            <span class="brand-pro">Pro</span>
          </span>
        </q-toolbar-title>

        <!-- ส่วนแสดงผล Avatar มุมขวา พร้อมเอฟเฟกต์มินิมอล -->
        <div v-if="user" class="row items-center cursor-pointer avatar-container" @click="toggleLeftDrawer">
          <q-avatar size="34px" class="header-user-avatar">
            <BackendImage :src="userAvatar" alt="User Avatar" />
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <!-- เมนูด้านข้าง (Left Drawer) สไตล์โมเดิร์นคล้ายตัวอย่าง -->
    <q-drawer v-model="leftDrawerOpen" side="left" overlay elevated behavior="mobile" class="glass-drawer">
      <q-scroll-area class="fit">

        <!-- 🟢 ส่วนหัวโปรไฟล์ใน Drawer (จำลองแบบ Workspace/Profile Header ในตัวอย่าง) -->
        <div v-if="user" class="drawer-app-header">
          <div class="drawer-profile">
            <q-avatar size="48px" class="shadow-1 user-avatar-drawer">
              <BackendImage :src="userAvatar" alt="User Avatar" />
            </q-avatar>
            <div class="drawer-profile-copy">
              <div class="drawer-user-name">{{ user.fullName }}</div>
              <div class="drawer-user-email">{{ user.email }}</div>
            </div>
          </div>
          <div class="drawer-role-row">
            <q-badge color="primary" class="drawer-role-badge">{{ user.role }}</q-badge>
          </div>
        </div>

        <q-separator class="drawer-divider" />

        <!-- 🟢 รายการเมนูหลัก (จัดหมวดหมู่แบบคลีนๆ) -->
        <q-list padding class="menu-list-section">
          <div v-if="filteredMenuItems.length" class="drawer-section-label">เมนูหลัก</div>
          <template v-for="(item, index) in filteredMenuItems" :key="item.title">
            <!-- เพิ่มเส้นคั่นแยกกลุ่มเมนู (ถ้าต้องการแบ่งหมวดหมู่ย่อย) -->
            <q-separator v-if="index > 0 && item.isGroupDivider" class="drawer-divider q-my-sm" />

            <q-item clickable v-ripple :to="item.to" @click="item.action ? item.action() : null"
              active-class="menu-item-active" class="drawer-menu-item">
              <q-item-section avatar class="min-width-icon drawer-menu-icon">
                <q-icon :name="item.icon" size="22px" class="text-primary" />
              </q-item-section>
              <q-item-section class="drawer-menu-label">{{ item.title }}</q-item-section>
            </q-item>
          </template>

          <q-separator class="drawer-divider q-my-md" />

          <!-- ปุ่ม Logout / Login -->
          <q-item v-if="user" clickable v-ripple @click="requestLogout" class="drawer-menu-item drawer-logout-item">
            <q-item-section avatar class="min-width-icon drawer-menu-icon">
              <q-icon name="logout" size="22px" color="negative" />
            </q-item-section>
            <q-item-section class="drawer-menu-label">ออกจากระบบ</q-item-section>
          </q-item>

          <q-item v-else clickable v-ripple to="/login" class="drawer-menu-item drawer-login-item">
            <q-item-section avatar class="min-width-icon drawer-menu-icon">
              <q-icon name="login" size="22px" color="primary" />
            </q-item-section>
            <q-item-section class="drawer-menu-label">เข้าสู่ระบบ</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="isLogoutDialogOpen">
      <q-card class="logout-dialog">
        <q-card-section class="logout-dialog-header">
          <div class="logout-dialog-icon">
            <q-icon name="logout" size="21px" />
          </div>
          <div class="logout-dialog-copy">
            <div class="logout-dialog-eyebrow">FIXMATCH PRO</div>
            <div class="logout-dialog-title">ยืนยันออกจากระบบ</div>
            <div class="logout-dialog-message">คุณต้องการออกจากบัญชีนี้ใช่หรือไม่</div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="logout-dialog-actions">
          <q-btn flat no-caps label="อยู่ในระบบต่อ" class="logout-cancel-btn" v-close-popup />
          <q-btn unelevated no-caps label="ออกจากระบบ" icon="logout" class="logout-confirm-btn" @click="handleLogout" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 🟢 Modal หน้าต่างแชทสด -->
    <LiveChatSheet v-model="isChatOpen" :orderId="activeOrderNo" :technician="activeTechInfo"
      issueTitle="สนทนากับช่างผู้เชี่ยวชาญ" />
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/authStore'
import { getActiveTrackingOrder } from '@/services/activeTracking'
import { getBackendUploadUrl } from '@/services/technicianProfile'
import BackendImage from '@/components/BackendImage.vue'
import LiveChatSheet from '../components/chat/LiveChatSheet.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const DEFAULT_AVATAR = 'https://cdn.quasar.dev/img/avatar.png'
const fixMatchLogo = `${import.meta.env.BASE_URL}icons/favicon-128x128.png`
const user = computed(() => authStore.user)
const isLogoutDialogOpen = ref(false)

const isChatOpen = ref(false)
const activeOrderNo = ref('')
const activeTechInfo = ref({
  name: '',
  avatarUrl: DEFAULT_AVATAR,
  specialty: '',
  phone: ''
})

const navItems = [
  { title: 'เลือกช่างและจองบริการ', icon: 'handyman', to: '/', roles: ['customer', 'admin'] },
  { title: 'แจ้งซ่อม / วิเคราะห์ปัญหา', icon: 'build_circle', to: '/diagnostic', roles: ['customer', 'admin'], requiresAuth: true },
  { title: 'รายการจองและติดต่อช่าง', icon: 'history', to: '/my-bookings', roles: ['customer', 'admin'], requiresAuth: true },
  { title: 'บอร์ดรับงานซ่อม (สำหรับช่าง)', icon: 'assignment', to: '/tech-job-board', roles: ['technician', 'admin'] },
  { title: 'เสียงตอบรับจากลูกค้า', icon: 'rate_review', to: '/tech-reviews', roles: ['technician'] },
  { title: 'ประวัติชำระเงิน', icon: 'receipt_long', to: '/tech-payment-history', roles: ['technician'] }
]

const filteredMenuItems = computed(() => {
  const currentRole = user.value?.role || 'customer'
  return navItems.filter(item => item.roles.includes(currentRole) && (!item.requiresAuth || authStore.isLoggedIn))
})

const leftDrawerOpen = ref(false)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const requestLogout = () => {
  leftDrawerOpen.value = false
  isLogoutDialogOpen.value = true
}

const handleLogout = () => {
  if (getActiveTrackingOrder()) {
    isLogoutDialogOpen.value = false
    $q.notify({
      type: 'warning',
      message: 'ไม่สามารถออกจากระบบได้ขณะมีงานที่กำลังดำเนินการ กรุณาติดตามงานจนเสร็จหรือถูกยกเลิกก่อน',
      icon: 'warning',
    })
    leftDrawerOpen.value = false
    return
  }

  authStore.logout()
  isLogoutDialogOpen.value = false
  leftDrawerOpen.value = false

  window.dispatchEvent(new Event('auth-changed'))

  $q.notify({
    type: 'info',
    message: 'ออกจากระบบเรียบร้อยแล้ว',
    icon: 'logout'
  })

  router.push('/')
}

const loadUserData = () => {
  const storedUser = localStorage.getItem('user_info')
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      const avatar = parsedUser.avatar
        || parsedUser.avatarUrl
        || parsedUser.avatar_url
        || parsedUser.avatar_img
        || parsedUser.picture
        || ''
      if (avatar !== parsedUser.avatar || parsedUser.avatarUrl !== avatar) {
        authStore.setUser({ ...parsedUser, avatar, avatarUrl: avatar })
      }
    } catch {
      authStore.logout()
    }
  } else if (authStore.user) {
    authStore.logout()
  }
}

onMounted(() => {
  loadUserData()
  window.addEventListener('auth-changed', loadUserData)
})

onUnmounted(() => {
  window.removeEventListener('auth-changed', loadUserData)
})

watch(() => route.path, () => {
  loadUserData()
})

const userAvatar = computed(() => {
  const avatar = user.value?.avatar
    || user.value?.avatarUrl
    || user.value?.avatar_url
    || user.value?.avatar_img
    || user.value?.picture
  return getBackendUploadUrl(avatar, DEFAULT_AVATAR)
})

</script>

<style scoped>
/* =====================================
   GLOBAL FLOATING REPAIR TOOLS
===================================== */

/* ===== GLOBAL FLOATING TOOLS ===== */

.glass-layout-bg {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
}

/* ชั้นไอคอน */
.floating-tools-bg {
  position: fixed;
  inset: 62px 0 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

/* ไอคอน */
.floating-tool {
  position: absolute;
  color: #3196d2;
  opacity: 0.30;
  font-size: 85px;
  filter: drop-shadow(0 3px 5px rgba(35, 130, 190, 0.08));
  animation: toolFloat 8s ease-in-out infinite;
}

/* ตำแหน่ง */
.tool-1 {
  top: 10%;
  left: 4%;
}

.tool-2 {
  top: 15%;
  right: 6%;
}

.tool-3 {
  top: 38%;
  left: 8%;
}

.tool-4 {
  top: 48%;
  right: 5%;
}

.tool-5 {
  top: 72%;
  left: 5%;
}

.tool-6 {
  top: 75%;
  right: 8%;
}

.tool-7 {
  top: 25%;
  left: 24%;
}

.tool-8 {
  top: 62%;
  right: 25%;
}

.tool-9 {
  bottom: 5%;
  left: 30%;
}

.tool-10 {
  bottom: 8%;
  right: 32%;
}

.tool-2,
.tool-5,
.tool-8 {
  animation-delay: -3s;
}

.tool-3,
.tool-6,
.tool-9 {
  animation-delay: -5s;
}

@keyframes toolFloat {

  0%,
  100% {
    transform: translateY(0) rotate(-10deg);
  }

  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* ให้เนื้อหาหน้าอยู่เหนือไอคอนเมื่อจำเป็น */
.glass-layout-bg :deep(.q-page-container) {
  position: relative;
  z-index: 1;
}

/* Header และ Drawer ต้องอยู่บนสุด */
.glass-header {
  z-index: 10;
}

.glass-drawer {
  z-index: 20;
}

@media (max-width: 600px) {
  .floating-tools-bg {
    inset: 56px 0 0;
  }

  .floating-tool {
    font-size: 48px;
    opacity: 0.20;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-tool {
    animation: none;
  }
}

/* FixMatch Pro navigation skin — styling only; layout logic remains unchanged. */
.glass-layout-bg {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, .98) 0 22%, transparent 58%),
    linear-gradient(180deg, #f8fafc 0%, #eef1f5 56%, #f5f7f9 100%);
}

.glass-header {
  color: #263746 !important;
  background: rgba(255, 255, 255, .94) !important;
  border-bottom: 1px solid rgba(213, 224, 233, .9);
  box-shadow: 0 3px 14px rgba(42, 62, 78, .07) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.glass-header :deep(.q-toolbar) {
  min-height: 62px;
}

.header-brand-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  padding: 0;
}

.header-brand-mark {
  display: block;
  width: 2.375rem;
  height: 2.375rem;
  flex: 0 0 auto;
  object-fit: contain;
}

.header-brand-name {
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
  color: #145da0;
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  white-space: nowrap;
}

.brand-match {
  color: #2fb77a;
}

.brand-pro {
  margin-left: 0.25rem;
  color: #d89a2b;
  font-size: 0.75rem;
  letter-spacing: 0;
}

.header-icon-btn {
  color: #287fc0 !important;
}

.header-icon-btn:hover {
  background: #eaf4fb !important;
}

.avatar-container {
  padding: 3px;
  border-radius: 50%;
}

.header-user-avatar {
  overflow: hidden;
  background-color: #ffffff;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cbdce9, 0 2px 7px rgba(34, 45, 58, .12);
}

.header-user-avatar :deep(img),
.user-avatar-drawer :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  object-fit: cover;
}

.glass-drawer {
  width: 280px !important;
  color: #263746;
  background: #f8fafc !important;
  border-right: 1px solid #e0e7ed !important;
  box-shadow: 12px 0 36px rgba(15, 35, 54, .12);
}

.drawer-app-header {
  position: relative;
  overflow: hidden;
  padding: 1.5rem 1.125rem 1.125rem;
  background:
    radial-gradient(circle at 100% 0, rgba(125, 211, 252, .34), transparent 42%),
    linear-gradient(145deg, #eff8ff, #ffffff 76%);
  border-bottom: 1px solid #e4edf4;
}

.drawer-profile {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-width: 0;
}

.drawer-profile-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 0.2rem;
}

.drawer-user-name {
  overflow: hidden;
  color: #172b3c;
  font-size: 0.9375rem;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-user-email {
  overflow: hidden;
  color: #718096;
  font-size: 0.75rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-role-row {
  margin-top: 0.875rem;
}

.drawer-role-badge {
  padding: 0.3rem 0.65rem !important;
  border: 1px solid rgba(37, 127, 192, .14);
  border-radius: 999px;
  background: #e8f4fc !important;
  color: #17649f !important;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: .01em;
  text-transform: capitalize;
}

.drawer-divider {
  background: #e5ebf0;
  margin: 0;
}

.menu-list-section {
  padding: 1rem .75rem;
}

.drawer-section-label {
  padding: 0 0.75rem 0.625rem;
  color: #94a3b8;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.drawer-menu-item {
  min-height: 50px;
  margin-bottom: 6px;
  padding: 0 0.75rem;
  border: 1px solid transparent;
  border-radius: 14px;
  color: #405362;
  transition: background .18s ease, border-color .18s ease, color .18s ease, transform .18s ease;
}

.drawer-menu-item:hover {
  color: #236b9f;
  background: #ffffff;
  border-color: #e3edf5;
  transform: translateX(2px);
}

.menu-item-active {
  color: #145f91 !important;
  background: linear-gradient(110deg, #e5f3fc, #f1f8fd) !important;
  border-color: #d1e6f4 !important;
  font-weight: 700;
  box-shadow: inset 3px 0 0 #2786c2;
}

.menu-item-active :deep(.q-icon) {
  color: #287fc0 !important;
}

.drawer-menu-icon {
  min-width: 42px !important;
  color: #287fc0;
}

.drawer-menu-icon :deep(.q-icon) {
  font-size: 21px;
}

.drawer-menu-label {
  color: inherit;
  font-size: 0.875rem;
  font-weight: 650;
  line-height: 1.4;
}

.min-width-icon {
  min-width: 36px !important;
}

.drawer-logout-item {
  color: #b42332;
}

.drawer-logout-item:hover {
  color: #a21727;
  background: #fff1f2;
  border-color: #ffe0e4;
}

.drawer-login-item {
  color: #17649f;
  background: #edf7fd;
  border-color: #dceef9;
}

.user-avatar-drawer {
  flex: 0 0 auto;
  overflow: hidden;
  background-color: #ffffff;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px #cbdfea, 0 5px 14px rgba(34, 85, 118, .14);
}

.logout-dialog {
  width: min(100%, 25rem);
  overflow: hidden;
  border: 1px solid #e3edf5;
  border-radius: 1.5rem;
  background:
    radial-gradient(ellipse at 100% 0, rgba(224, 242, 254, .7), transparent 42%),
    #ffffff;
  box-shadow: 0 24px 64px rgba(23, 55, 78, .2);
}

.logout-dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
}

.logout-dialog-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #d5eafa;
  border-radius: 1rem;
  background: linear-gradient(145deg, #eaf6ff, #dff1fc);
  color: #287fc0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9);
}

.logout-dialog-copy {
  min-width: 0;
  padding-top: 0.05rem;
}

.logout-dialog-eyebrow {
  margin-bottom: 0.25rem;
  color: #287fc0;
  font-size: 0.625rem;
  font-weight: 800;
  letter-spacing: .12em;
}

.logout-dialog-title {
  color: #1d3447;
  font-size: 1.0625rem;
  font-weight: 800;
  line-height: 1.4;
}

.logout-dialog-message {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.logout-dialog-actions {
  display: flex;
  flex-wrap: nowrap;
  padding: 0.75rem 1.5rem 1.375rem;
  gap: 0.5rem;
}

.logout-cancel-btn,
.logout-confirm-btn {
  min-width: 0;
  min-height: 3rem;
  flex: 1 1 0;
  padding: 0 0.75rem !important;
  border-radius: 0.875rem !important;
  font-weight: 700 !important;
}

.logout-cancel-btn :deep(.q-btn__content),
.logout-confirm-btn :deep(.q-btn__content) {
  flex-wrap: nowrap;
  gap: 0.375rem;
  white-space: nowrap;
}

.logout-cancel-btn {
  color: #526779 !important;
  background: #f1f6fa !important;
}

.logout-cancel-btn:hover {
  background: #e8f0f6 !important;
}

.logout-confirm-btn {
  background: #d94350 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(217, 67, 80, .2) !important;
}

.logout-confirm-btn:hover {
  background: #c73543 !important;
}

@media (max-width: 600px) {
  .glass-header :deep(.q-toolbar) {
    min-height: 56px;
    padding-left: 10px;
    padding-right: 10px;
  }

  .glass-drawer {
    width: min(280px, 86vw) !important;
  }

  .logout-dialog {
    width: calc(100vw - 2rem);
    border-radius: 1.25rem;
  }

  .logout-dialog-header {
    padding: 1.25rem 1.25rem 0.875rem;
  }

  .logout-dialog-actions {
    padding: 0.5rem 1.25rem 1.25rem;
    gap: 0.625rem;
  }
}
</style>
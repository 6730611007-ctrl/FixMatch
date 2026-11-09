<template>
  <q-page class="customer-home-page">
    <div class="home-container">
      <header class="home-hero">
        <div class="hero-icon">
          <q-icon name="home_repair_service" />
        </div>
        <p class="hero-eyebrow">FIXMATCH · PHUKET</p>
        <h1>เลือกช่างที่ใช่<br />แล้วนัดหมายได้เลย</h1>
        <p class="hero-description">
          ดูโปรไฟล์และความเชี่ยวชาญของช่างก่อนเลือก เมื่อต้องการจอง
          ระบบจะให้เข้าสู่ระบบก่อนกรอกวันเวลาและสถานที่ให้บริการ
        </p>
        <div class="booking-steps" aria-label="ขั้นตอนการจอง">
          <div><span>1</span> เลือกช่าง</div>
          <q-icon name="chevron_right" />
          <div><span>2</span> เข้าสู่ระบบ</div>
          <q-icon name="chevron_right" />
          <div><span>3</span> นัดหมาย</div>
        </div>
      </header>

      <section class="technician-section">
        <TechSelectionList :auto-select-first="false" confirm-label="เลือกช่างและดำเนินการจอง"
          @confirm-booking="startBooking" />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import TechSelectionList from '@/components/tech/TechSelectionList.vue'
import { useAuthStore } from '@/stores/authStore'
import { useBookingStore } from '@/stores/bookingStore'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const bookingStore = useBookingStore()

const startBooking = async (technician) => {
  if (!technician) return

  const role = String(authStore.user?.role || '').toLowerCase()
  if (role && role !== 'customer' && role !== 'admin') {
    $q.notify({
      type: 'warning',
      message: 'บัญชีช่างไม่สามารถจองบริการในฐานะลูกค้าได้',
    })
    return
  }

  bookingStore.setSelectedTechnician(technician)
  bookingStore.setPendingTechnicianBooking(true)

  if (!authStore.token) {
    $q.notify({
      type: 'info',
      message: 'กรุณาเข้าสู่ระบบก่อน เพื่อดำเนินการนัดหมายช่างที่เลือก',
      timeout: 2500,
    })
    await router.push({ name: 'login' })
    return
  }

  await router.push({ name: 'diagnostic' })
}
</script>

<style scoped>
.customer-home-page {
  min-height: 100vh;
  padding: 1.5rem 0.875rem 3rem;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(186, 230, 253, 0.55), transparent 42%),
    #f8fafc;
}

.home-container {
  width: min(100%, 56rem);
  margin: 0 auto;
}

.home-hero {
  max-width: 42rem;
  margin: 0 auto 1.5rem;
  padding: 1.5rem 1rem 1.25rem;
  text-align: center;
}

.hero-icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 0.875rem;
  place-items: center;
  border-radius: 1.125rem;
  color: #ffffff;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  box-shadow: 0 8px 20px rgba(2, 132, 199, 0.2);
}

.hero-icon .q-icon {
  font-size: 1.75rem;
}

.hero-eyebrow {
  margin: 0 0 0.5rem;
  color: #0284c7;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.home-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.75rem, 7vw, 2.5rem);
  font-weight: 900;
  line-height: 1.2;
}

.hero-description {
  max-width: 36rem;
  margin: 0.875rem auto 0;
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.7;
}

.booking-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 1.125rem;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
}

.booking-steps div {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.booking-steps div span {
  display: grid;
  width: 1.375rem;
  height: 1.375rem;
  place-items: center;
  border-radius: 50%;
  color: #0369a1;
  background: #e0f2fe;
}

.booking-steps>.q-icon {
  color: #94a3b8;
}

.technician-section {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

@media (min-width: 640px) {
  .customer-home-page {
    padding: 2rem 1.25rem 4rem;
  }

  .home-hero {
    padding-top: 2rem;
  }

  .technician-section {
    padding: 1.5rem;
  }
}
</style>

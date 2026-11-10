<template>
  <div class="tech-selection-container">
    <!-- Component Header & Filter Info -->
    <div class="tech-list-header">
      <div class="header-text-group">
        <h3 class="header-title">ช่างเทคนิคที่แนะนำ</h3>
        <p class="header-subtitle">คะแนนจากรีวิวจริง และเวลาเดินทางคำนวณจากตำแหน่ง GPS ล่าสุด</p>
      </div>
      <q-chip v-if="hasLoadedTechnicians && !isLoadingTechnicians && !loadError" size="sm" class="tech-count-chip">
        พบ {{ filteredTechnicians.length }} ท่าน
      </q-chip>
    </div>

    <div class="technician-search">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        clearable
        aria-label="ค้นหาช่างตามชื่อหรือประเภทงาน"
        placeholder="ค้นหาช่าง เช่น ช่างแอร์, ช่างไฟ, ช่างประปา"
        class="search-input"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="category-shortcuts" aria-label="ค้นหาตามประเภทงาน">
        <q-chip
          v-for="category in skillCategories"
          :key="category.id"
          clickable
          outline
          color="primary"
          :selected="selectedCategoryId === category.id"
          @click="toggleCategorySearch(category)"
        >
          {{ category.title }}
        </q-chip>
      </div>
    </div>

    <q-select
      v-model="sortMode"
      :options="sortOptions"
      emit-value
      map-options
      outlined
      dense
      label="เรียงตาม"
      aria-label="เรียงลำดับรายชื่อช่าง"
      class="sort-select"
    />

    <div v-if="isLoadingTechnicians" class="text-center q-pa-lg">
      <q-spinner-dots color="primary" size="36px" />
      <div class="text-caption text-grey-7 q-mt-sm">กำลังโหลดรายชื่อช่างที่ลงทะเบียน...</div>
    </div>

    <div v-else-if="loadError" class="empty-technicians">
      <q-icon name="engineering" size="36px" />
      <div>{{ loadError }}</div>
      <q-btn flat no-caps color="primary" label="ลองโหลดรายชื่อช่างอีกครั้ง" @click="loadTechnicians" />
    </div>

    <template v-else>
      <!-- Technician Card List -->
      <div v-for="tech in filteredTechnicians" :key="tech.id" class="tech-card"
        :class="{
          'selected-card': selectedId === tech.id,
          'recommended-card': tech.isTopRecommended,
        }">
      <!-- Fast Arrival Badge for Top Match -->
      <div v-if="tech.isTopRecommended" class="recommended-badge">
        <q-icon name="bolt" size="12px" />
        <span>มาถึงเร็วที่สุด</span>
      </div>

      <div class="tech-card-body">
        <!-- Left: Profile & Detailed Info -->
        <div class="tech-profile-group">
          <q-avatar class="tech-avatar">
            <img :src="getAvatarUrl(tech?.avatarUrl || tech?.avatar)" @error="onAvatarError"
              :alt="tech?.name || 'รูปช่างเทคนิค'" />
          </q-avatar>

          <div class="tech-info">
            <!-- Name & Verified Badge -->
            <div class="tech-name-row">
              <h4 class="tech-name">{{ tech?.name || 'ไม่ระบุชื่อ' }}</h4>
              <q-icon v-if="tech?.isVerified" name="verified" size="16px" class="icon-verified" />
            </div>

            <q-chip v-if="!tech?.isOnline" dense size="sm" class="offline-status-chip">
              ไม่เปิดรับบริการชั่วคราว
            </q-chip>
            <p class="tech-specialty">{{ formatSpecialty(tech?.specialty) }}</p>

            <!-- Metrics: Rating, Completed Jobs, ETA -->
            <div class="tech-metrics">
              <button type="button" class="metric-badge metric-rating review-link"
                :aria-label="`ดูรีวิวของ ${tech.name || 'ช่าง'} ${tech.reviewCount || 0} รายการ`"
                @click.stop="openTechnicianReviews(tech)">
                <q-icon name="star" size="14px" />
                <span>{{ tech?.rating !== null && tech?.rating !== undefined
                  ? Number(tech.rating).toFixed(1) : 'ยังไม่มีคะแนน' }}</span>
                <span class="review-count">({{ tech?.reviewCount || 0 }} รีวิว)</span>
              </button>

              <div class="metric-badge metric-jobs">
                <q-icon name="task_alt" size="14px" />
                <span>ซ่อมสำเร็จ {{ tech?.completedJobs || 0 }} งาน</span>
              </div>

              <div class="metric-badge metric-eta">
                <q-icon name="schedule" size="14px" />
                <span>{{ Number.isFinite(tech?.etaMinutes)
                  ? `ประมาณ ${tech.etaMinutes} นาที` : 'ไม่มีข้อมูลตำแหน่งล่าสุด' }}</span>
              </div>
            </div>
            <div v-if="tech.serviceArea?.length" class="tech-service-area">
              <q-icon name="place" size="14px" />
              <span>พื้นที่รับงาน: {{ formatServiceArea(tech.serviceArea) }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Pricing & Select Action -->
        <div class="tech-action-group">
          <div class="price-box">
            <span class="price-label">ค่าตรวจเช็กเบื้องต้น</span>
            <div class="price-value">
              <template v-if="tech?.basePrice != null && Number.isFinite(Number(tech.basePrice))">
                ฿{{ Number(tech.basePrice).toLocaleString() }}
              </template>
              <template v-else>ยังไม่ระบุ</template>
            </div>
            <span class="price-note">ค่าซ่อมและอะไหล่ให้ช่างแจ้งก่อนดำเนินการ</span>
          </div>

          <q-btn unelevated no-caps class="btn-select-card"
            :disable="!tech?.isOnline"
            :class="[selectedId === tech.id ? 'btn-selected' : 'btn-unselected', { 'btn-offline': !tech?.isOnline }]"
            @click="handleSelect(tech)">
            {{ !tech?.isOnline ? 'ไม่เปิดรับบริการชั่วคราว' : selectedId === tech.id ? 'เลือกแล้ว' : 'เลือกช่างคนนี้' }}
          </q-btn>
        </div>
      </div>
      </div>

      <div v-if="selectedTechnician && !filteredTechnicians.some(tech => tech.id === selectedTechnician.id)"
        class="selected-technician-notice">
        <div>
          <strong>ช่างที่เลือก: {{ selectedTechnician.name }}</strong>
          <div class="text-caption">ช่างคนนี้ไม่ตรงกับตัวกรองปัจจุบัน แต่ยังเป็นช่างที่จะยืนยันการจอง</div>
        </div>
        <q-btn flat no-caps color="primary" label="เปลี่ยนช่าง" @click="clearTechnicianSelection" />
      </div>

      <div v-if="localTechnicians.length && !filteredTechnicians.length" class="empty-technicians">
        <q-icon name="search_off" size="32px" />
        <div>ไม่พบช่างที่ตรงกับ “{{ searchQuery }}”</div>
        <q-btn flat no-caps color="primary" label="ล้างคำค้นหา" @click="searchQuery = ''" />
      </div>
    </template>

    <!-- Confirm Booking Button -->
    <div class="confirm-action-container">
      <q-btn unelevated no-caps :disabled="!selectedTechnician" class="btn-confirm-booking"
        @click="$emit('confirm-booking', selectedTechnician)">
        {{ props.confirmLabel }}{{ selectedTechnician ? `: ${selectedTechnician.name}` : '' }}
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import fixmatchService from '@/services/fixmatchService'
import { useBookingStore } from '@/stores/bookingStore'
import { getBackendUploadUrl, normalizeTechnicianProfile } from '@/services/technicianProfile'
import { skillCategories } from '@/services/technicianSkills'

const bookingStore = useBookingStore()
const router = useRouter()
const props = defineProps({
  autoSelectFirst: { type: Boolean, default: true },
  confirmLabel: { type: String, default: 'ยืนยันการนัดหมายช่าง' },
})
const DEFAULT_AVATAR = 'https://cdn.quasar.dev/img/avatar.png'
const localTechnicians = ref([])
const isLoadingTechnicians = ref(false)
const hasLoadedTechnicians = ref(false)
const loadError = ref('')

const emit = defineEmits(['select-tech', 'select-technician', 'confirm-booking'])
const customerCoordinates = ref(null)
const hasRequestedCustomerCoordinates = ref(false)

const selectedId = ref(null)
const searchQuery = ref('')
const sortMode = ref('recommended')
const sortOptions = [
  { label: 'แนะนำ: รีวิวและคะแนน', value: 'recommended' },
  { label: 'คะแนนสูงสุด', value: 'rating' },
  { label: 'เดินทางเร็วที่สุด', value: 'eta' },
]
const selectedCategoryId = computed(() => findSearchCategory(searchQuery.value)?.id || null)

const normalizeSearchText = (value) => String(value || '')
  .toLocaleLowerCase('th-TH')
  .replace(/[\s&.,/_-]+/g, '')

const findSearchCategory = (query) => {
  const normalizedQuery = normalizeSearchText(query)
  if (normalizedQuery.length < 2) return null

  return skillCategories.find(category => [category.id, category.title, ...category.keywords]
    .some(term => {
      const normalizedTerm = normalizeSearchText(term)
      return normalizedQuery.includes(normalizedTerm) || normalizedTerm.includes(normalizedQuery)
    })) || null
}

const matchingTechnicians = computed(() => {
  const query = normalizeSearchText(searchQuery.value)
  if (!query) return localTechnicians.value

  const category = findSearchCategory(searchQuery.value)
  const matches = localTechnicians.value.filter(technician => {
    const specialtyValues = Array.isArray(technician.specialty)
      ? technician.specialty
      : [technician.specialty]
    const searchableText = normalizeSearchText([
      technician.name,
      ...specialtyValues,
      formatSpecialty(technician.specialty),
    ].join(' '))

    if (category) {
      const normalizedSkills = specialtyValues.map(normalizeSearchText)
      return normalizedSkills.some(skill =>
        skill === normalizeSearchText(category.id)
        || [category.title, ...category.keywords].some(term => skill.includes(normalizeSearchText(term))),
      )
    }

    return searchableText.includes(query)
  })

  return matches
})

const compareEta = (first, second) => {
  const firstEta = first.etaMinutes != null && Number.isFinite(Number(first.etaMinutes))
    ? Number(first.etaMinutes)
    : Infinity
  const secondEta = second.etaMinutes != null && Number.isFinite(Number(second.etaMinutes))
    ? Number(second.etaMinutes)
    : Infinity
  return firstEta - secondEta
}

const compareRating = (first, second) => {
  const firstRating = first.rating != null && Number.isFinite(Number(first.rating)) ? Number(first.rating) : -1
  const secondRating = second.rating != null && Number.isFinite(Number(second.rating)) ? Number(second.rating) : -1
  return secondRating - firstRating
}

const filteredTechnicians = computed(() => [...matchingTechnicians.value].sort((first, second) => {
  if (first.isOnline !== second.isOnline) {
    return Number(second.isOnline) - Number(first.isOnline)
  }
  if (sortMode.value === 'eta') {
    return compareEta(first, second) || compareRating(first, second)
  }
  if (sortMode.value === 'rating') {
    return compareRating(first, second)
      || Number(second.reviewCount || 0) - Number(first.reviewCount || 0)
      || compareEta(first, second)
  }

  return Number(second.reviewCount || 0) - Number(first.reviewCount || 0)
    || compareRating(first, second)
    || Number(second.completedJobs || 0) - Number(first.completedJobs || 0)
    || compareEta(first, second)
}))

const selectedTechnician = computed(() => {
  return localTechnicians.value.find(t => t.id === selectedId.value && t.isOnline)
})

let refreshTimer = null

const getAvatarUrl = (avatar) => {
  return getBackendUploadUrl(avatar, DEFAULT_AVATAR)
}

const onAvatarError = (e) => {
  e.target.src = DEFAULT_AVATAR
}

const formatSpecialty = (specialty) => {
  if (!specialty) return 'ช่างเทคนิคทั่วไป'
  if (Array.isArray(specialty)) return specialty.map(formatSkill).join(', ')
  if (typeof specialty === 'string') {
    try {
      const parsed = JSON.parse(specialty)
      if (Array.isArray(parsed)) return parsed.map(formatSkill).join(', ')
    } catch {
      // string
    }
    return formatSkill(specialty)
  }
  return 'ช่างเทคนิคทั่วไป'
}

const formatSkill = (skill) => {
  const category = skillCategories.find(item => item.id === skill)
  return category?.title || skill
}

const formatServiceArea = (areas) => Array.isArray(areas) ? areas.join(', ') : String(areas || '')

const openTechnicianReviews = (technician) => {
  if (!technician?.id) return
  router.push({ name: 'technician-reviews', params: { technicianId: technician.id } })
}

const handleSelect = (tech) => {
  if (!tech?.isOnline) return
  selectedId.value = tech.id
  bookingStore.setSelectedTechnician(tech)
  emit('select-tech', tech)
  emit('select-technician', tech)
}

const clearTechnicianSelection = () => {
  selectedId.value = null
  bookingStore.setSelectedTechnician(null)
}

const toggleCategorySearch = (category) => {
  searchQuery.value = selectedCategoryId.value === category.id ? '' : category.title
}

const getCustomerCoordinates = () => new Promise((resolve) => {
  if (!navigator.geolocation) {
    resolve(null)
    return
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) {
        resolve(null)
        return
      }
      resolve({ latitude: coords.latitude, longitude: coords.longitude })
    },
    (error) => {
      console.warn('ไม่สามารถระบุตำแหน่ง GPS ของลูกค้าเพื่อคำนวณเวลาเดินทางได้:', error)
      resolve(null)
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
  )
})

const loadTechnicians = async () => {
  if (isLoadingTechnicians.value) return
  isLoadingTechnicians.value = true
  loadError.value = ''
  try {
    if (!hasRequestedCustomerCoordinates.value) {
      customerCoordinates.value = await getCustomerCoordinates()
      hasRequestedCustomerCoordinates.value = true
    }
    const res = await fixmatchService.getRecommendedTechnicians(customerCoordinates.value || undefined)
    const responseData = res.data?.data ?? res.data
    const technicians = Array.isArray(responseData)
      ? responseData
      : responseData?.technicians
    if (!Array.isArray(technicians)) {
      throw new Error('ระบบส่งข้อมูลรายชื่อช่างในรูปแบบที่ไม่ถูกต้อง')
    }

    localTechnicians.value = technicians
      .map(normalizeTechnicianProfile)
      .filter(technician => technician?.id)

    if (localTechnicians.value.length > 0) {
      const savedSelection = localTechnicians.value.find(
        technician => String(technician.id) === String(bookingStore.selectedTechnician?.id),
      )
      const initialSelection = savedSelection?.isOnline
        ? savedSelection
        : (props.autoSelectFirst ? filteredTechnicians.value.find(technician => technician.isOnline) : null)
      selectedId.value = initialSelection?.id ?? null
      if (initialSelection) {
        bookingStore.setSelectedTechnician(initialSelection)
        emit('select-tech', initialSelection)
        emit('select-technician', initialSelection)
      } else if (bookingStore.selectedTechnician) {
        bookingStore.setSelectedTechnician(null)
      }
    } else {
      loadError.value = 'ยังไม่มีรายชื่อช่างที่รับงานนี้ได้'
    }
  } catch (error) {
    console.error('ไม่สามารถโหลดรายชื่อช่างที่ลงทะเบียนได้:', error)
    localTechnicians.value = []
    selectedId.value = null
    if (bookingStore.selectedTechnician) {
      bookingStore.setSelectedTechnician(null)
    }
    loadError.value = 'โหลดรายชื่อช่างไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'
  } finally {
    isLoadingTechnicians.value = false
    hasLoadedTechnicians.value = true
  }
}

onMounted(() => {
  loadTechnicians()
  refreshTimer = window.setInterval(loadTechnicians, 30000)
})

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<style scoped>
.tech-selection-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.empty-technicians {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  color: #64748b;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
}

.tech-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 0.125rem;
}

.header-text-group {
  display: flex;
  min-width: 0;
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
  max-width: 34rem;
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.25rem;
  margin-bottom: 0;
  line-height: 1.55;
}

.technician-search {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.sort-select {
  width: min(100%, 24rem);
}

.search-input {
  width: 100%;
}

.search-input :deep(.q-field__control),
.sort-select :deep(.q-field__control) {
  min-height: 3rem;
  border-radius: 0.75rem;
  background: #ffffff;
}

.search-input :deep(.q-field__native),
.sort-select :deep(.q-field__native),
.search-input :deep(.q-field__input) {
  color: #29465b;
  font-size: 0.875rem;
}

.search-input :deep(.q-field__prepend) {
  color: #658095;
}

.category-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.category-shortcuts :deep(.q-chip) {
  margin: 0;
  min-height: 1.875rem;
  padding: 0 0.625rem;
  border-color: #b7d9ee;
  border-radius: 999px;
  color: #287fc0;
  background: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  transition: background-color .18s ease, border-color .18s ease, color .18s ease;
}

.category-shortcuts :deep(.q-chip:hover),
.category-shortcuts :deep(.q-chip--selected) {
  border-color: #1687c2;
  background: #eaf6fd;
  color: #0876ad;
}

.tech-count-chip {
  min-height: 1.875rem;
  background-color: #f0f9ff !important;
  color: #0876ad !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  padding: 0.25rem 0.75rem !important;
  border-radius: 9999px !important;
  border: 1px solid #bae6fd !important;
  flex-shrink: 0;
}

.tech-card {
  position: relative;
  background-color: #ffffff;
  border-radius: 1.375rem;
  border: 1px solid #e5edf3;
  padding: 1.125rem;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 12px rgba(34, 73, 101, 0.045);
}

@media (min-width: 640px) {
  .tech-card {
    padding: 1.375rem;
  }
}

@media (min-width: 1024px) {
  .tech-card:hover {
    border-color: #cbd5e1;
    box-shadow: 0 6px 18px -4px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }
}

.tech-card.selected-card {
  border-color: #0284c7 !important;
  background: linear-gradient(145deg, #f3faff, #ffffff 78%) !important;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2), 0 8px 20px -4px rgba(2, 132, 199, 0.12) !important;
}

.tech-card.recommended-card {
  padding-top: 1.875rem;
}

.recommended-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.3rem 0.8rem;
  border-bottom-right-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.tech-card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.25rem;
}

@media (min-width: 640px) {
  .tech-card-body {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.tech-profile-group {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  width: 100%;
}

@media (min-width: 640px) {
  .tech-profile-group {
    align-items: center;
    gap: 1.125rem;
    width: auto;
  }
}

.tech-avatar {
  width: 3.25rem !important;
  height: 3.25rem !important;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border-radius: 1rem !important;
  overflow: hidden;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .tech-avatar {
    width: 3.75rem !important;
    height: 3.75rem !important;
  }
}

.tech-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-grow: 1;
}

.tech-name-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tech-name {
  font-size: 0.9375rem;
  font-weight: 800;
  color: #17364d;
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.3;
}

@media (min-width: 640px) {
  .tech-name {
    font-size: 1rem;
  }
}

.icon-verified {
  color: #0284c7;
  flex-shrink: 0;
}

.tech-specialty {
  font-size: 0.75rem;
  color: #647d90;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
}

.tech-metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  padding-top: 0.25rem;
}

@media (min-width: 640px) {
  .tech-metrics {
    gap: 0.5rem;
  }
}

.metric-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 1.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: 0.625rem;
  font-size: 0.6875rem;
  font-weight: 700;
}

@media (min-width: 640px) {
  .metric-badge {
    font-size: 0.75rem;
  }
}

.metric-rating {
  color: #d97706;
  background-color: rgba(254, 243, 199, 0.7);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.review-link {
  cursor: pointer;
  font-family: inherit;
  appearance: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.review-link:hover {
  background-color: #fff3cc;
  border-color: #f3c55f;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.12);
}

.review-link:focus-visible {
  outline: 2px solid #287fc0;
  outline-offset: 2px;
}

.review-count {
  color: #94a3b8;
  font-weight: 500;
}

.metric-jobs {
  color: #475569;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.metric-eta {
  color: #047857;
  background-color: rgba(209, 250, 229, 0.7);
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.tech-service-area,
.price-note {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.6875rem;
  line-height: 1.4;
}

.tech-service-area :deep(.q-icon) {
  flex: 0 0 auto;
}

.price-note {
  display: block;
  max-width: 14rem;
}

.selected-technician-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fffbeb;
  color: #78350f;
  border: 1px solid #fde68a;
  border-radius: 0.875rem;
}

.tech-action-group {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .tech-action-group {
    width: auto;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.625rem;
    padding-top: 0;
    border-top: none;
  }
}

.price-box {
  text-align: left;
}

@media (min-width: 640px) {
  .price-box {
    text-align: right;
  }
}

.price-label {
  display: block;
  font-size: 0.625rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.125rem;
}

.price-value {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.btn-select-card {
  min-height: 2.75rem;
  padding: 0.5rem 1.25rem !important;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  border-radius: 0.75rem !important;
  transition: all 0.2s ease !important;
}

.btn-selected {
  background-color: #0284c7 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25) !important;
}

.btn-unselected {
  background-color: #0284c7 !important;
  color: #ffffff !important;
  box-shadow: 0 3px 8px rgba(2, 132, 199, 0.2) !important;
}

.btn-unselected:hover {
  background-color: #0369a1 !important;
  box-shadow: 0 4px 10px rgba(3, 105, 161, 0.28) !important;
}

.btn-offline,
.btn-offline:hover {
  color: #64748b !important;
  background-color: #e2e8f0 !important;
  cursor: not-allowed !important;
  opacity: 0.8;
}

.offline-status-chip {
  color: #475569;
  background: #e2e8f0;
  font-size: 0.68rem;
  font-weight: 700;
  height: auto;
  max-width: 100%;
  margin: 0;
  white-space: normal;
}

.confirm-action-container {
  padding-top: 0.5rem;
}

.btn-confirm-booking {
  width: 100%;
  padding: 0.875rem 0 !important;
  background-color: #0284c7 !important;
  color: #ffffff !important;
  font-size: 0.9375rem !important;
  font-weight: 700 !important;
  border-radius: 0.875rem !important;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25) !important;
  transition: all 0.2s ease !important;
}

@media (min-width: 640px) {
  .btn-confirm-booking {
    font-size: 1rem !important;
  }
}

.btn-confirm-booking:hover:not(:disabled) {
  background-color: #0369a1 !important;
  box-shadow: 0 6px 16px rgba(2, 132, 199, 0.3) !important;
}

.btn-confirm-booking:disabled {
  opacity: 0.5 !important;
  box-shadow: none !important;
}

@media (max-width: 639px) {
  .tech-selection-container {
    gap: 0.875rem;
    padding: 1rem 0.875rem;
    border: 1px solid #e0ebf3;
    border-radius: 1.5rem;
    background: rgba(255, 255, 255, .96);
    box-shadow: 0 8px 26px rgba(34, 73, 101, .055);
  }

  .tech-list-header {
    align-items: flex-start;
    padding: 0;
  }

  .header-title {
    font-size: 1.125rem;
    line-height: 1.35;
  }

  .header-subtitle {
    font-size: 0.75rem;
    line-height: 1.55;
  }

  .tech-count-chip {
    align-self: center;
    padding: 0.2rem 0.625rem !important;
    font-size: 0.6875rem !important;
  }

  .technician-search {
    gap: 0.5rem;
  }

  .search-input :deep(.q-field__control),
  .sort-select :deep(.q-field__control) {
    min-height: 2.875rem;
  }

  .category-shortcuts {
    gap: 0.3rem;
  }

  .category-shortcuts :deep(.q-chip) {
    min-height: 1.75rem;
    padding: 0 0.55rem;
    font-size: 0.6875rem;
  }

  .sort-select {
    width: 100%;
  }

  .sort-select :deep(.q-field__label) {
    color: #71879a;
  }

  .tech-card {
    padding: 0.875rem;
    border-radius: 1.25rem;
  }

  .tech-card.recommended-card {
    padding-top: 1.875rem;
  }

  .tech-card-body {
    gap: 0.75rem;
    margin-top: 0;
  }

  .tech-profile-group {
    gap: 0.75rem;
  }

  .tech-avatar {
    width: 3.5rem !important;
    height: 3.5rem !important;
    border-radius: 0.875rem !important;
  }

  .tech-info {
    min-width: 0;
  }

  .tech-name-row {
    flex-wrap: wrap;
  }

  .tech-name {
    font-size: 0.9375rem;
    overflow-wrap: anywhere;
  }

  .tech-specialty {
    font-size: 0.75rem;
  }

  .tech-metrics {
    gap: 0.35rem;
  }

  .metric-badge {
    min-height: 1.625rem;
    padding: 0.2rem 0.45rem;
    font-size: 0.65625rem;
  }

  .tech-action-group {
    align-items: center;
    gap: 0.625rem;
    padding-top: 0.75rem;
    border-color: #edf2f6;
  }

  .price-box {
    min-width: 0;
  }

  .price-label {
    font-size: 0.625rem;
    letter-spacing: 0;
  }

  .price-value {
    font-size: 1.25rem;
    color: #17364d;
  }

  .price-note {
    max-width: 12rem;
    font-size: 0.625rem;
  }

  .btn-select-card {
    width: 7.5rem;
    flex: 0 0 auto;
    padding: 0.5rem 0.625rem !important;
    font-size: 0.75rem !important;
    line-height: 1.3;
  }

  .btn-select-card :deep(.q-btn__content) {
    white-space: normal;
  }

  .selected-technician-notice {
    align-items: flex-start;
    flex-direction: column;
  }

  .btn-confirm-booking {
    min-height: 3rem;
    padding: 0.75rem !important;
  }
}
</style>
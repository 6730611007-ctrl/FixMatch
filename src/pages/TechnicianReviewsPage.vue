<template>
  <q-page class="reviews-page">
    <main class="reviews-container">
      <q-btn v-if="isPublicTechnicianReviews" flat no-caps icon="arrow_back"
        label="กลับไปหน้ารายชื่อช่าง" class="back-to-technicians" @click="goBack" />

      <header class="page-header">
        <q-avatar v-if="isPublicTechnicianReviews" size="58px" class="page-technician-avatar">
          <BackendImage :src="technician.avatarUrl" :alt="technician.name" />
        </q-avatar>
        <div v-else class="page-heading-icon">
          <q-icon name="forum" size="25px" />
        </div>
        <div class="page-heading-copy">
          <p class="page-eyebrow">{{ isPublicTechnicianReviews ? 'FIXMATH PRO · ช่างผู้ให้บริการ' : 'FIXMATH PRO · สำหรับช่าง' }}</p>
          <h1 class="page-title">
            {{ isPublicTechnicianReviews ? `รีวิวของ ${technician.name || 'ช่าง'}` : 'รีวิวจากลูกค้า' }}
          </h1>
          <p class="page-subtitle">
            {{ isPublicTechnicianReviews
              ? formatSpecialty(technician.specialty)
              : 'ดูคะแนนและความคิดเห็นเพื่อพัฒนาบริการของคุณ' }}
          </p>
        </div>
      </header>

      <section class="summary-card" aria-label="สรุปคะแนนรีวิว">
        <div class="summary-main">
          <span class="summary-label">คะแนนเฉลี่ย</span>
          <div class="summary-rating">
            {{ reviewSummary.averageRating ?? '—' }}
            <q-icon name="star" />
          </div>
          <div class="summary-stars" aria-hidden="true">
            <q-icon v-for="star in 5" :key="star"
              :name="star <= Math.round(reviewSummary.averageRating || 0) ? 'star' : 'star_border'" />
          </div>
          <span class="summary-caption">จากลูกค้าที่ใช้บริการจริง</span>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-total">
          <span class="summary-label">รีวิวทั้งหมด</span>
          <strong>{{ reviewSummary.reviewCount }}</strong>
          <span class="summary-caption">ความคิดเห็น</span>
        </div>

        <div class="rating-breakdown">
          <div v-for="rating in ratingBreakdown" :key="rating.score" class="rating-row">
            <span>{{ rating.score }}</span>
            <q-icon name="star" size="14px" />
            <div class="rating-track">
              <span :style="{ width: `${rating.percentage}%` }"></span>
            </div>
            <span class="rating-count">{{ rating.count }}</span>
          </div>
        </div>
      </section>

      <section class="review-section">
        <div class="section-heading">
          <div>
            <h2>ความคิดเห็น</h2>
            <p>แสดงแบบไม่ระบุตัวตนเพื่อรักษาความเป็นส่วนตัวของลูกค้า</p>
          </div>
          <span class="review-count-pill">{{ reviewSummary.reviewCount }} รายการ</span>
        </div>

        <div v-if="isLoadingReviews" class="state-card">
          <q-spinner-dots color="primary" size="36px" />
          <span>กำลังโหลดเสียงตอบรับ...</span>
        </div>

        <div v-else-if="reviewsError" class="state-card error-state">
          <q-icon name="cloud_off" size="30px" />
          <strong>โหลดความคิดเห็นไม่สำเร็จ</strong>
          <span>{{ reviewsError }}</span>
          <q-btn unelevated no-caps color="primary" icon="refresh" label="ลองอีกครั้ง" :loading="isLoadingReviews"
            @click="fetchTechnicianReviews" />
        </div>

        <div v-else-if="reviewSummary.reviews.length === 0" class="state-card empty-state">
          <span class="empty-state-icon"><q-icon name="rate_review" size="26px" /></span>
          <strong>ยังไม่มีรีวิว</strong>
          <span>เมื่อมีลูกค้าส่งแบบประเมิน ความคิดเห็นจะปรากฏที่นี่</span>
        </div>

        <div v-else class="review-list">
          <article v-for="(review, index) in reviewSummary.reviews" :key="`${review.submittedAt || 'review'}-${index}`"
            class="review-card">
            <header class="review-card-header">
              <div class="anonymous-customer">
                <span class="anonymous-avatar"><q-icon name="person" size="19px" /></span>
                <div>
                  <strong>ลูกค้าผู้ใช้บริการ</strong>
                  <time v-if="formatReviewDate(review.submittedAt)">
                    {{ formatReviewDate(review.submittedAt) }}
                  </time>
                </div>
              </div>
              <span class="rating-pill">
                <q-icon name="star" size="16px" /> {{ Number(review.rating) }}/5
              </span>
            </header>

            <div class="review-card-stars" :aria-label="`คะแนน ${review.rating} จาก 5`">
              <q-icon v-for="star in 5" :key="star" :name="star <= Number(review.rating) ? 'star' : 'star_border'"
                :class="{ 'star-active': star <= Number(review.rating) }" />
            </div>

            <p class="review-comment">
              {{ review.comment?.trim() || 'ลูกค้าไม่ได้เขียนความคิดเห็นเพิ่มเติม' }}
            </p>

            <div v-if="review.tags?.length" class="review-tags">
              <span v-for="tag in review.tags" :key="tag" class="review-tag">
                <q-icon name="check_circle" size="14px" />
                {{ tag }}
              </span>
            </div>
          </article>
        </div>
      </section>
    </main>
  </q-page>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/boot/axios'
import { getTechnicianAvatarUrl } from '@/services/technicianProfile'
import BackendImage from '@/components/BackendImage.vue'

const route = useRoute()
const router = useRouter()
const DEFAULT_AVATAR = 'https://cdn.quasar.dev/img/avatar.png'
const isLoadingReviews = ref(false)
const reviewsError = ref('')
const technician = ref({
  name: '',
  avatarUrl: DEFAULT_AVATAR,
  specialty: [],
})
const reviewSummary = ref({
  averageRating: null,
  reviewCount: 0,
  ratingCounts: {},
  reviews: [],
})
const isPublicTechnicianReviews = computed(() => Boolean(route.params.technicianId))

const ratingBreakdown = computed(() => [5, 4, 3, 2, 1].map(score => {
  const count = reviewSummary.value.ratingCounts[score] != null
    ? Number(reviewSummary.value.ratingCounts[score])
    : reviewSummary.value.reviews.filter(review => Number(review.rating) === score).length
  return {
    score,
    count,
    percentage: reviewSummary.value.reviewCount
      ? (count / reviewSummary.value.reviewCount) * 100
      : 0,
  }
}))

const fetchTechnicianReviews = async () => {
  try {
    isLoadingReviews.value = true
    reviewsError.value = ''
    const endpoint = isPublicTechnicianReviews.value
      ? `/technicians/${route.params.technicianId}/reviews`
      : '/jobs/technician/reviews'
    const response = await api.get(endpoint)
    const data = response.data?.data || response.data
    const reviews = Array.isArray(data.reviews) ? data.reviews : []
    if (isPublicTechnicianReviews.value) {
      technician.value = {
        name: data.technician?.name || 'ช่างผู้ให้บริการ',
        avatarUrl: getTechnicianAvatarUrl(data.technician),
        specialty: data.technician?.specialty || [],
      }
    }
    reviewSummary.value = {
      averageRating: data.averageRating ?? null,
      reviewCount: Number(data.reviewCount) || reviews.length,
      ratingCounts: data.ratingCounts || {},
      reviews,
    }
  } catch (error) {
    console.error('ดึงความคิดเห็นจากลูกค้าไม่สำเร็จ:', error)
    reviewsError.value = error.response?.data?.detail || 'กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง'
  } finally {
    isLoadingReviews.value = false
  }
}

const formatSpecialty = (specialty) => {
  const values = Array.isArray(specialty) ? specialty : [specialty]
  return values.filter(Boolean).map(String).join(', ') || 'ช่างผู้เชี่ยวชาญประจำพื้นที่'
}

const goBack = () => {
  const returnTo = route.query.returnTo
  if (typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    router.push(returnTo)
    return
  }

  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}

const formatReviewDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

watch(
  () => [route.name, route.params.technicianId],
  fetchTechnicianReviews,
  { immediate: true },
)
</script>

<style scoped>
.reviews-page {
  min-height: 100vh;
  padding: 2rem 1rem 3.5rem;
  background:
    radial-gradient(ellipse at 50% 0, rgba(219, 241, 252, .9), transparent 34rem),
    #f4f8fb;
}

.reviews-container {
  display: flex;
  width: min(100%, 50rem);
  flex-direction: column;
  gap: 1.25rem;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.125rem;
  min-height: 6rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(208, 229, 243, .9);
  border-radius: 1.375rem;
  background:
    radial-gradient(ellipse at 100% 0, rgba(225, 244, 255, .9), transparent 55%),
    rgba(255, 255, 255, .94);
  box-shadow: 0 8px 26px rgba(34, 73, 101, .055);
}

.back-to-technicians {
  align-self: flex-start;
  min-height: 2.625rem;
  padding: 0 0.875rem !important;
  border: 1px solid #dceaf4;
  border-radius: 0.875rem !important;
  background: rgba(255, 255, 255, .82);
  color: #287fc0 !important;
  font-weight: 700 !important;
}

.back-to-technicians:hover {
  background: #eaf5fc !important;
}

.page-technician-avatar {
  flex: 0 0 auto;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 1px #d5e5ef, 0 6px 16px rgba(34, 85, 118, .14);
}

.page-technician-avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-heading-copy {
  min-width: 0;
}

.page-heading-icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #d5eafa;
  border-radius: 1.25rem;
  background: linear-gradient(145deg, #eaf6ff, #dff1fc);
  color: #087db8;
  box-shadow: 0 6px 16px rgba(40, 127, 192, .12);
}

.page-eyebrow {
  margin: 0 0 0.375rem;
  color: #287fc0;
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: .12em;
}

.page-title {
  margin: 0;
  color: #17364d;
  font-size: 1.5rem;
  font-weight: 850;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.page-subtitle {
  margin: 0.4rem 0 0;
  color: #718394;
  font-size: 0.875rem;
  line-height: 1.5;
}

.summary-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, .8fr) minmax(10rem, 1.2fr);
  align-items: center;
  gap: 1.375rem;
  padding: 1.5rem 1.625rem;
  border: 1px solid #dceaf4;
  border-radius: 1.375rem;
  background:
    radial-gradient(ellipse at 0 0, rgba(231, 246, 255, .95), transparent 60%),
    #ffffff;
  box-shadow: 0 8px 26px rgba(34, 73, 101, .055);
}

.summary-main,
.summary-total {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.summary-label {
  color: #718394;
  font-size: 0.75rem;
  font-weight: 650;
}

.summary-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  color: #1d3447;
  font-size: 2.25rem;
  font-weight: 850;
  line-height: 1.1;
}

.summary-rating .q-icon {
  color: #e7a329;
  font-size: 1.5rem;
}

.summary-stars {
  display: flex;
  gap: 0.1rem;
  margin-top: 0.35rem;
  color: #e7a329;
  font-size: 1rem;
}

.summary-caption {
  margin-top: 0.25rem;
  color: #8a9aa7;
  font-size: 0.6875rem;
}

.summary-divider {
  width: 1px;
  height: 4rem;
  background: #e5edf3;
}

.summary-total strong {
  margin-top: 0.2rem;
  color: #1d3447;
  font-size: 2.25rem;
  font-weight: 850;
  line-height: 1.2;
}

.rating-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.rating-row {
  display: grid;
  grid-template-columns: 0.75rem 0.875rem minmax(2rem, 1fr) 1.25rem;
  align-items: center;
  gap: 0.25rem;
  color: #728392;
  font-size: 0.6875rem;
}

.rating-row>.q-icon {
  color: #e7a329;
}

.rating-track {
  height: 0.35rem;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f6;
}

.rating-track>span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #f3c45f, #e7a329);
}

.rating-count {
  text-align: right;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
  padding: 1.375rem;
  border: 1px solid #e0ebf3;
  border-radius: 1.375rem;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 8px 26px rgba(34, 73, 101, .045);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-heading h2 {
  margin: 0;
  color: #1d3b52;
  font-size: 1.0625rem;
  font-weight: 800;
}

.section-heading p {
  margin: 0.25rem 0 0;
  color: #81919e;
  font-size: 0.75rem;
  line-height: 1.5;
}

.review-count-pill {
  flex: 0 0 auto;
  padding: 0.45rem 0.75rem;
  border: 1px solid #dceaf4;
  border-radius: 999px;
  background: #f5faff;
  color: #526e82;
  font-size: 0.6875rem;
  font-weight: 700;
}

.review-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem;
}

.review-card {
  min-width: 0;
  padding: 1.125rem;
  border: 1px solid #e3edf4;
  border-radius: 1.125rem;
  background: linear-gradient(155deg, #ffffff, #fbfdff);
  box-shadow: 0 4px 14px rgba(34, 73, 101, .04);
}

.review-card-header,
.anonymous-customer {
  display: flex;
  align-items: center;
}

.review-card-header {
  justify-content: space-between;
  gap: 0.5rem;
}

.anonymous-customer {
  min-width: 0;
  gap: 0.55rem;
}

.anonymous-avatar {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #edf5fa;
  color: #678398;
}

.anonymous-customer strong,
.anonymous-customer time {
  display: block;
}

.anonymous-customer strong {
  color: #395469;
  font-size: 0.75rem;
}

.anonymous-customer time {
  margin-top: 0.15rem;
  color: #95a3af;
  font-size: 0.625rem;
}

.rating-pill {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.2rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid #f5e6bf;
  border-radius: 999px;
  background: #fffaf0;
  color: #8a5b08;
  font-size: 0.6875rem;
  font-weight: 800;
}

.review-card-stars {
  display: flex;
  gap: 0.1rem;
  margin-top: 0.75rem;
  color: #d3dce3;
  font-size: 0.9375rem;
}

.review-card-stars .star-active {
  color: #e7a329;
}

.review-comment {
  margin: 0.55rem 0 0;
  color: #3e5669;
  font-size: 0.8125rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.review-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.review-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid #d9eee6;
  border-radius: 999px;
  background: #f0faf6;
  color: #28745b;
  font-size: 0.6875rem;
  line-height: 1.35;
}

.state-card {
  display: flex;
  min-height: 10rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 1.5rem;
  border: 1px dashed #d5e3ed;
  border-radius: 1.125rem;
  background: rgba(255, 255, 255, .8);
  color: #778a99;
  font-size: 0.8125rem;
  text-align: center;
}

.error-state {
  border-color: #fecaca;
  color: #b42332;
}

.error-state strong,
.empty-state strong {
  color: #395469;
  font-size: 0.875rem;
}

.empty-state-icon {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  border-radius: 1rem;
  background: #edf7fd;
  color: #287fc0;
}

@media (max-width: 640px) {
  .reviews-page {
    padding: 1rem 0.75rem 2rem;
  }

  .reviews-container {
    gap: 0.875rem;
  }

  .page-header {
    align-items: flex-start;
    gap: 0.75rem;
    min-height: unset;
    padding: 1rem;
    border-radius: 1.125rem;
  }

  .page-technician-avatar {
    width: 3.25rem;
    height: 3.25rem;
  }

  .page-heading-icon {
    width: 2.875rem;
    height: 2.875rem;
    border-radius: 1rem;
  }

  .page-title {
    font-size: 1.1875rem;
  }

  .page-eyebrow {
    font-size: 0.625rem;
  }

  .page-subtitle {
    font-size: 0.8125rem;
  }

  .summary-card {
    grid-template-columns: 1fr 1px 1fr;
    gap: 0.75rem;
    padding: 1rem 0.875rem;
    border-radius: 1.125rem;
  }

  .summary-rating,
  .summary-total strong {
    font-size: 1.75rem;
  }

  .summary-divider {
    grid-row: span 1;
    height: 3.5rem;
  }

  .rating-breakdown {
    grid-column: 1 / -1;
    padding-top: 0.75rem;
    border-top: 1px solid #e8eff4;
  }

  .section-heading {
    align-items: flex-start;
  }

  .section-heading p {
    max-width: 18rem;
  }

  .review-section {
    gap: 0.875rem;
    padding: 1rem 0.875rem;
    border-radius: 1.125rem;
  }

  .review-list {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .review-card {
    padding: 1rem;
    border-radius: 1rem;
  }

  .review-count-pill {
    padding: 0.375rem 0.625rem;
  }
}
</style>

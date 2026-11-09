<template>
  <!-- Guard Check: ป้องกัน Render กรณี analysis เป็น null/undefined -->
  <q-card v-if="analysis" flat class="ai-card" :class="cardStyleClass">
    <q-card-section class="card-section">
      <!-- Header & Severity Badge -->
      <div class="header-row">
        <div class="header-title-wrapper">
          <div class="ai-icon-wrapper" :class="isEmergency ? 'pulse-emergency' : 'pulse-normal'">
            <q-icon :name="isEmergency ? 'warning' : 'auto_awesome'" size="20px"
              :class="isEmergency ? 'icon-emergency' : 'icon-normal'" />
          </div>
          <span class="header-label">
            ผลการวิเคราะห์โดย AI <span class="category-tag">(หมวด: {{ analysis?.category || 'ทั่วไป' }})</span>
          </span>
        </div>

        <span class="severity-badge" :class="badgeStyleClass">
          <q-icon :name="isEmergency ? 'error_outline' : 'check_circle_outline'" size="14px" />
          <span>{{ isEmergency ? 'ฉุกเฉิน / ต้องแก้ไขทันที' : (analysis?.severity_level || 'ปกติ') }}</span>
        </span>
      </div>

      <!-- Problem Title & Details -->
      <div class="problem-details">
        <h3 class="issue-summary">
          {{ analysis?.issue_summary || 'ไม่ระบุหัวข้อปัญหา' }}
        </h3>
        <div class="safety-action-box">
          <q-icon name="gpp_maybe" size="18px" class="shield-icon" />
          <p class="safety-action">
            {{ analysis?.safety_action_for_user || 'ไม่มีคำแนะนำด้านความปลอดภัยเพิ่มเติม' }}
          </p>
        </div>
      </div>

      <!-- Required Technicians Meta -->
      <div v-if="analysis?.required_technician && analysis.required_technician.length > 0" class="technician-meta-box">
        <span class="meta-label">
          <q-icon name="engineering" size="16px" class="meta-icon" />
          ช่างที่จำเป็นต้องใช้บริการ
        </span>
        <div class="badges-wrapper">
          <span v-for="(techItem, index) in analysis.required_technician" :key="index" class="tech-chip">
            {{ techItem }}
          </span>
        </div>
      </div>

      <!-- Action Button -->
      <q-btn unelevated no-caps class="btn-select-tech" :class="isEmergency ? 'btn-emergency' : 'btn-normal'"
        @click="$emit('select-technician')">
        <span class="btn-content">
          <span>เลือกช่างเทคนิคเพื่อรับบริการ</span>
          <q-icon name="arrow_forward" size="18px" class="btn-arrow" />
        </span>
      </q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  analysis: {
    type: Object,
    default: () => null
  }
})

defineEmits(['select-technician'])

const isEmergency = computed(() => props.analysis?.is_emergency === true)

const cardStyleClass = computed(() => {
  return isEmergency.value ? 'card-emergency' : 'card-normal'
})

const badgeStyleClass = computed(() => {
  return isEmergency.value ? 'badge-emergency' : 'badge-normal'
})
</script>

<style scoped>
.ai-card {
  border-radius: 1.25rem !important;
  border-width: 1px;
  border-style: solid;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.card-section {
  padding: 1rem;
}

@media (min-width: 640px) {
  .card-section {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .card-section {
    padding: 1.75rem;
  }

  .ai-card:hover {
    transform: translateY(-2px);
  }
}

.card-emergency {
  background-color: #fef2f2;
  border-color: #fecaca;
  box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.15);
}

.pulse-emergency {
  background-color: #fee2e2;
  color: #ef4444;
}

.icon-emergency {
  color: #dc2626;
}

.badge-emergency {
  background-color: #ef4444;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
}

.btn-emergency {
  background-color: #dc2626 !important;
}

.btn-emergency:hover {
  background-color: #b91c1c !important;
}

.card-normal {
  background-color: #f0f9ff;
  border-color: #bae6fd;
  box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.1);
}

.pulse-normal {
  background-color: #e0f2fe;
  color: #0284c7;
}

.icon-normal {
  color: #0284c7;
}

.badge-normal {
  background-color: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.btn-normal {
  background-color: #0284c7 !important;
}

.btn-normal:hover {
  background-color: #0369a1 !important;
}

.header-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
}

.header-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.ai-icon-wrapper {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #475569;
}

.category-tag {
  color: #0f172a;
  font-weight: 800;
}

.severity-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  align-self: flex-start;
}

@media (min-width: 640px) {
  .severity-badge {
    align-self: center;
  }
}

.problem-details {
  margin-bottom: 1.25rem;
}

.issue-summary {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

@media (min-width: 640px) {
  .issue-summary {
    font-size: 1.25rem;
  }
}

@media (min-width: 1024px) {
  .issue-summary {
    font-size: 1.375rem;
  }
}

.safety-action-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.shield-icon {
  color: #64748b;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.safety-action {
  font-size: 0.8125rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
}

@media (min-width: 640px) {
  .safety-action {
    font-size: 0.875rem;
  }
}

.technician-meta-box {
  padding: 0.875rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 0.875rem;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.meta-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.meta-icon {
  color: #0284c7;
}

.badges-wrapper {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.tech-chip {
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #f1f5f9;
  color: #1e293b;
  border: 1px solid #e2e8f0;
}

.btn-select-tech {
  width: 100%;
  padding: 0.875rem 0 !important;
  font-size: 0.9375rem !important;
  font-weight: 700 !important;
  border-radius: 0.875rem !important;
  color: #ffffff !important;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

@media (min-width: 640px) {
  .btn-select-tech {
    font-size: 1rem !important;
  }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-arrow {
  transition: transform 0.2s ease;
}

.btn-select-tech:hover .btn-arrow {
  transform: translateX(4px);
}
</style>
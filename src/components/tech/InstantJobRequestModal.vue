<template>
    <q-dialog v-model="isOpen" persistent :position="$q.screen.lt.sm ? 'bottom' : 'standard'" transition-show="slide-up"
        transition-hide="slide-down">
        <q-card class="job-request-card">
            <!-- Mobile Drag Handle -->
            <div class="drag-handle-wrapper" v-if="$q.screen.lt.sm">
                <div class="drag-handle-bar"></div>
            </div>

            <!-- Countdown Bar & Live Header -->
            <div class="request-header">
                <div class="status-live-tag">
                    <span class="pulse-wrapper">
                        <span class="pulse-ring"></span>
                        <span class="pulse-core"></span>
                    </span>
                    <span class="tag-text">ลูกค้าเลือกคุณเป็นผู้ซ่อม!</span>
                </div>

                <div class="countdown-badge">
                    <q-icon name="timer" size="14px" />
                    <span>{{ countdown }}s</span>
                </div>
            </div>

            <!-- Job Title Section -->
            <div class="issue-title-section">
                <h3 class="issue-title">
                    {{ jobRequest?.issueTitle || 'ไม่ระบุหัวข้อปัญหา' }}
                </h3>
            </div>

            <!-- Job Request Summary Info Box -->
            <div class="info-details-box">
                <div class="info-row">
                    <span class="info-label">ผู้เรียกใช้บริการ:</span>
                    <span class="info-value text-dark">{{ jobRequest?.customerName || 'ไม่ระบุชื่อ' }}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">ระยะทางโดยประมาณ:</span>
                    <span class="info-value text-emerald">
                        ~{{ jobRequest?.distanceKm || 0 }} กม. (เดินทางประมาณ {{ jobRequest?.estimatedTimeMin || 0 }}
                        นาที)
                    </span>
                </div>

                <div class="address-row">
                    <q-icon name="location_on" size="16px" class="location-icon" />
                    <span class="address-text">{{ jobRequest?.address || 'ไม่ระบุสถานที่' }}</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="actions-group">
                <button type="button" @click="$emit('reject')" class="btn-reject">
                    <span>ปฏิเสธงาน</span>
                </button>

                <button type="button" @click="$emit('accept', jobRequest)" class="btn-accept">
                    <q-icon name="check_circle" size="18px" />
                    <span>กดรับงานนี้</span>
                </button>
            </div>

        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    jobRequest: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits(['update:modelValue', 'accept', 'reject'])

const isOpen = ref(props.modelValue)
const countdown = ref(30)
let timer = null

watch(() => props.modelValue, (val) => {
    isOpen.value = val
    if (val) startTimer()
    else stopTimer()
})

watch(isOpen, (val) => {
    emit('update:modelValue', val)
})

const startTimer = () => {
    countdown.value = 30
    stopTimer()
    timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            stopTimer()
            emit('reject') // ถ้านับถอยหลังหมดเวลา ถือว่าปฏิเสธอัตโนมัติ
        }
    }, 1000)
}

const stopTimer = () => {
    if (timer) clearInterval(timer)
}

onUnmounted(() => stopTimer())
</script>

<style scoped>
/* ==========================================================================
   1. Card Dialog Base Layout
   ========================================================================== */
.job-request-card {
    width: 100%;
    max-width: 30rem;
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
    background-color: #ffffff;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
    border-top: 4px solid #0284c7;
    overflow: hidden;
}

@media (min-width: 640px) {
    .job-request-card {
        border-radius: 1.5rem !important;
        padding: 1.5rem;
    }
}

/* Mobile Drag Handle Bar */
.drag-handle-wrapper {
    display: flex;
    justify-content: center;
    padding-bottom: 0.25rem;
}

.drag-handle-bar {
    width: 3rem;
    height: 0.375rem;
    background-color: #e2e8f0;
    border-radius: 9999px;
}

/* ==========================================================================
   2. Live Tag & Countdown Header
   ========================================================================== */
.request-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.status-live-tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pulse-wrapper {
    position: relative;
    display: flex;
    width: 0.75rem;
    height: 0.75rem;
}

.pulse-ring {
    position: absolute;
    display: inline-flex;
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    background-color: #34d399;
    opacity: 0.75;
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.pulse-core {
    position: relative;
    display: inline-flex;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    background-color: #10b981;
}

@keyframes ping {

    75%,
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

.tag-text {
    font-size: 0.75rem;
    font-weight: 800;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.countdown-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    background-color: #fff1f2;
    color: #e11d48;
    font-size: 0.75rem;
    font-weight: 800;
    font-family: monospace;
    border: 1px solid #fecdd3;
}

/* ==========================================================================
   3. Issue Title Section
   ========================================================================== */
.issue-title-section {
    padding: 0.25rem 0;
}

.issue-title {
    font-size: 1.125rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.4;
    letter-spacing: -0.01em;
}

@media (min-width: 640px) {
    .issue-title {
        font-size: 1.25rem;
    }
}

/* ==========================================================================
   4. Summary Info Box
   ========================================================================== */
.info-details-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
}

.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8125rem;
}

.info-label {
    color: #64748b;
    font-weight: 600;
}

.info-value.text-dark {
    font-weight: 800;
    color: #0f172a;
}

.info-value.text-emerald {
    font-weight: 700;
    color: #059669;
}

.address-row {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    padding-top: 0.5rem;
    margin-top: 0.25rem;
    border-top: 1px dashed #e2e8f0;
}

.location-icon {
    color: #f43f5e;
    flex-shrink: 0;
    margin-top: 0.125rem;
}

.address-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    line-height: 1.4;
}

/* ==========================================================================
   5. Action Buttons Group
   ========================================================================== */
.actions-group {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding-top: 0.25rem;
}

.btn-reject {
    padding: 0.875rem 1rem;
    border-radius: 0.875rem;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #475569;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-reject:hover {
    background-color: #f8fafc;
    color: #0f172a;
    border-color: #94a3b8;
}

.btn-accept {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.875rem 1rem;
    border-radius: 0.875rem;
    border: none;
    background-color: #0284c7;
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
    transition: all 0.2s ease;
}

.btn-accept:hover {
    background-color: #0369a1;
    box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
}

.btn-reject:active,
.btn-accept:active {
    transform: scale(0.98);
}
</style>
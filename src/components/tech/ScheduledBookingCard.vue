<template>
    <q-card flat class="booking-card">
        <!-- Card Header: Status Badge & Order Number -->
        <div class="card-header">
            <div class="status-pill">
                <q-icon name="event_available" size="14px" />
                <span>งานนัดหมายล่วงหน้า</span>
            </div>
            <span class="order-number">#{{ job?.orderNo || job?.order_no || 'FM-20261009-01' }}</span>
        </div>

        <!-- Appointment Schedule Highlight Box -->
        <div class="schedule-box">
            <div class="calendar-icon-wrapper">
                <q-icon name="calendar_today" size="20px" />
            </div>
            <div class="schedule-text-group">
                <span class="schedule-label">วันเวลาที่ลูกค้านัดหมาย</span>
                <span class="schedule-datetime">
                    {{ job?.appointmentDate || '10 ต.ค. 2026' }} | เวลา
                    {{ job?.appointmentTime || '10:30' }} น.
                </span>
            </div>
        </div>

        <!-- Detail Items Container -->
        <div class="details-container">
            <!-- Customer Info -->
            <div class="detail-row">
                <div class="detail-icon-box bg-slate-soft">
                    <q-icon name="person" size="18px" class="icon-slate" />
                </div>
                <div class="detail-content">
                    <span class="customer-name">{{ job?.customerName || 'ไม่ระบุชื่อลูกค้า' }}</span>
                    <span class="customer-phone" v-if="job?.customerPhone">({{ job.customerPhone }})</span>
                </div>
            </div>

            <!-- Address & Landmark Note -->
            <div class="detail-row items-start">
                <div class="detail-icon-box bg-rose-soft">
                    <q-icon name="location_on" size="18px" class="icon-rose" />
                </div>
                <div class="detail-content">
                    <p class="address-text">{{ job?.address || 'ไม่ระบุที่อยู่' }}</p>
                    <div v-if="job?.addressNote" class="landmark-box">
                        <q-icon name="explore" size="14px" class="icon-amber" />
                        <span>จุดสังเกต: {{ job.addressNote }}</span>
                    </div>
                </div>
            </div>

            <!-- Issue Description -->
            <div class="detail-row items-start">
                <div class="detail-icon-box bg-sky-soft">
                    <q-icon name="build" size="18px" class="icon-sky" />
                </div>
                <div class="detail-content">
                    <span class="issue-label">อาการเสีย: </span>
                    <span class="issue-text">{{ job?.issueDescription || 'ไม่ระบุอาการเสีย' }}</span>
                </div>
            </div>
        </div>

        <!-- Actions Footer: Call, GPS Navigation & Accept Job -->
        <div class="actions-footer">
            <a :href="`tel:${job?.customerPhone || ''}`" class="btn-call">
                <q-icon name="call" size="18px" />
                <span>โทร</span>
            </a>

            <button type="button" class="btn-gps" @click="$emit('open-gps', job?.latitude, job?.longitude)">
                <q-icon name="near_me" size="18px" />
                <span>นำทาง GPS</span>
            </button>
        </div>

        <div class="accept-action-wrapper">
            <q-btn outline no-caps color="negative" class="btn-reject-job"
                :loading="loading" :disable="loading" @click="$emit('reject-job', job)">
                <q-icon name="cancel" size="18px" class="mr-1" />
                <span>ปฏิเสธงาน</span>
            </q-btn>
            <q-btn unelevated no-caps class="btn-accept-job" :loading="loading" :disable="loading"
                @click="$emit('accept-job', job)">
                <q-icon name="check_circle_outline" size="18px" class="mr-1" />
                <span>กดรับงานนี้ (เริ่มปฏิบัติงาน)</span>
            </q-btn>
        </div>
    </q-card>
</template>

<script setup>
defineProps({
    job: {
        type: Object,
        default: () => ({}),
    },
    loading: {
        type: Boolean,
        default: false,
    },
})

// 🟢 ประกาศรับอีเวนต์รับงาน
defineEmits(['open-gps', 'accept-job', 'reject-job'])
</script>

<style scoped>
/* ==========================================================================
   1. Base Card Container
   ========================================================================== */
.booking-card {
    background-color: #ffffff;
    border-radius: 1.25rem !important;
    border: 1px solid #e2e8f0;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 640px) {
    .booking-card {
        padding: 1.5rem;
    }
}

/* ==========================================================================
   2. Card Header
   ========================================================================== */
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    background-color: #f0f9ff;
    color: #0284c7;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid #bae6fd;
}

.order-number {
    min-width: 0;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    overflow-wrap: anywhere;
    text-align: right;
}

/* ==========================================================================
   3. Schedule Highlight Box
   ========================================================================== */
.schedule-box {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
}

.calendar-icon-wrapper {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background-color: #e0f2fe;
    color: #0284c7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.schedule-text-group {
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.schedule-label {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
}

.schedule-datetime {
    font-size: 0.875rem;
    font-weight: 800;
    color: #0f172a;
    margin-top: 0.125rem;
    overflow-wrap: anywhere;
}

@media (min-width: 640px) {
    .schedule-datetime {
        font-size: 0.9375rem;
    }
}

/* ==========================================================================
   4. Details Content List
   ========================================================================== */
.details-container {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.detail-row.items-start {
    align-items: flex-start;
}

.detail-icon-box {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.625rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.bg-slate-soft {
    background-color: #f1f5f9;
}

.icon-slate {
    color: #64748b;
}

.bg-rose-soft {
    background-color: #ffe4e6;
}

.icon-rose {
    color: #f43f5e;
}

.bg-sky-soft {
    background-color: #e0f2fe;
}

.icon-sky {
    color: #0284c7;
}

.icon-amber {
    color: #d97706;
}

.detail-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex-grow: 1;
}

.customer-name {
    font-size: 0.875rem;
    font-weight: 800;
    color: #1e293b;
}

.customer-phone {
    font-size: 0.8125rem;
    color: #64748b;
    font-weight: 500;
}

.address-text {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.45;
    margin: 0;
    overflow-wrap: anywhere;
}

.landmark-box {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.375rem;
    padding: 0.25rem 0.625rem;
    background-color: #fffbeb;
    border: 1px solid #fef3c7;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #92400e;
    max-width: 100%;
    overflow-wrap: anywhere;
}

.issue-label {
    font-size: 0.8125rem;
    font-weight: 800;
    color: #0f172a;
}

.issue-text {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #334155;
    line-height: 1.45;
    overflow-wrap: anywhere;
}

/* ==========================================================================
   5. Actions Footer (Buttons)
   ========================================================================== */
.actions-footer {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem;
    padding-top: 0.875rem;
    border-top: 1px solid #f1f5f9;
}

.btn-call {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #334155;
    font-size: 0.8125rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
}

.btn-call:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
    color: #0f172a;
}

.btn-gps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: none;
    background-color: #0284c7;
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(2, 132, 199, 0.22);
    transition: all 0.2s ease;
}

.btn-gps:hover {
    background-color: #0369a1;
}

/* 🟢 ปุ่มกดรับงานสไตล์เด่นชัด */
.accept-action-wrapper {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 0.75rem;
    padding-top: 0.25rem;
}

.btn-reject-job {
    min-height: 3rem;
    border-radius: 0.75rem;
    font-weight: 700;
}

.btn-accept-job {
    width: 100%;
    padding: 0.75rem 0 !important;
    background-color: #10b981 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.875rem !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25) !important;
    transition: all 0.2s ease !important;
}

.btn-accept-job:hover {
    background-color: #059669 !important;
}

.mr-1 {
    margin-right: 0.375rem;
}

@media (max-width: 599px) {
    .booking-card {
        padding: 1rem;
        gap: 1rem;
        border-radius: 1.125rem !important;
    }

    .card-header {
        align-items: stretch;
        flex-direction: column;
        gap: 0.625rem;
    }

    .status-pill {
        align-self: flex-start;
    }

    .order-number {
        width: 100%;
        padding: 0.5rem 0.625rem;
        border-radius: 0.625rem;
        background: #f8fafc;
        line-height: 1.55;
        text-align: left;
    }

    .schedule-box {
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
    }

    .schedule-datetime {
        line-height: 1.55;
    }

    .detail-row {
        align-items: flex-start;
    }

    .customer-name,
    .customer-phone {
        overflow-wrap: anywhere;
    }

    .landmark-box {
        display: flex;
        align-items: flex-start;
        line-height: 1.5;
    }

    .landmark-box .q-icon {
        flex: 0 0 auto;
        margin-top: 0.125rem;
    }

    .accept-action-wrapper {
        grid-template-columns: minmax(0, 1fr);
        gap: 0.5rem;
    }

    .btn-accept-job {
        grid-row: 1;
        min-height: 3.25rem;
        padding: 0.75rem 0.875rem !important;
        line-height: 1.5;
    }

    .btn-reject-job {
        grid-row: 2;
    }

    .btn-accept-job :deep(.q-btn__content),
    .btn-reject-job :deep(.q-btn__content) {
        white-space: normal;
        text-align: center;
    }
}
</style>
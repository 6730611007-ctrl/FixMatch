<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="completion-card">
      <q-card-section class="row items-center q-pb-sm">
        <div>
          <div class="text-h6 text-weight-bold">สรุปงานและออกบิล</div>
          <div class="text-caption text-grey-7">งาน #{{ job?.orderNo || job?.order_no || job?.id }}</div>
        </div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="loading || isGenerating" @click="isOpen = false" />
      </q-card-section>

      <q-separator />

      <q-form @submit.prevent="submitCompletion">
        <q-card-section class="completion-content">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">รายการงานและค่าใช้จ่าย</div>

          <div v-for="(item, index) in items" :key="index" class="invoice-item-row">
            <q-input v-model.trim="item.description" outlined dense label="รายละเอียดงาน / อะไหล่"
              :rules="[value => !!value || 'กรุณาระบุรายการ']" />
            <q-input v-model.number="item.amount" outlined dense type="number" min="0" step="0.01"
              label="ราคา (บาท)" class="amount-input" :rules="[value => Number.isFinite(value) && value >= 0 || 'กรุณาระบุราคา']" />
            <q-btn v-if="items.length > 1" icon="delete_outline" color="negative" flat round dense
              aria-label="ลบรายการ" @click="removeItem(index)" />
          </div>

          <q-btn v-if="items.length < maxItems" type="button" flat no-caps color="primary" icon="add"
            label="เพิ่มรายการ" @click="addItem" />

          <q-separator class="q-my-md" />
          <div class="row justify-between text-subtitle1 text-weight-bold">
            <span>ยอดรวม</span>
            <span>฿{{ total.toLocaleString('th-TH', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="text-caption text-grey-7 q-mt-sm">
            ระบบจะสร้างใบสรุปเป็น PDF และส่งให้ลูกค้าผ่านแชทของงานนี้
          </div>
        </q-card-section>

        <q-separator />
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="ยกเลิก" :disable="loading || isGenerating" @click="isOpen = false" />
          <q-btn unelevated no-caps color="positive" icon="task_alt" label="ยืนยันปิดงานและส่งบิล"
            type="submit" :loading="loading || isGenerating" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { createInvoicePdf } from '@/services/invoicePdf'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  job: { type: Object, default: null },
  technicianName: { type: String, default: 'ช่าง FixMatch' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'complete'])
const $q = useQuasar()
const maxItems = 12
const isOpen = ref(props.modelValue)
const isGenerating = ref(false)
const items = ref([{ description: '', amount: 0 }])
const total = computed(() => Math.round(
  items.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) * 100,
) / 100)

watch(() => props.modelValue, value => {
  isOpen.value = value
  if (value) items.value = [{ description: '', amount: 0 }]
})

watch(isOpen, value => {
  emit('update:modelValue', value)
})

const addItem = () => {
  if (items.value.length < maxItems) {
    items.value.push({ description: '', amount: 0 })
  }
}

const removeItem = (index) => {
  items.value.splice(index, 1)
}

const submitCompletion = async () => {
  const normalizedItems = items.value.map(item => ({
    description: item.description.trim(),
    amount: Number(item.amount),
  }))

  if (normalizedItems.some(item => !item.description || !Number.isFinite(item.amount) || item.amount < 0)) {
    $q.notify({ type: 'warning', message: 'กรุณากรอกรายการและราคาทุกช่องให้ถูกต้อง' })
    return
  }

  if (total.value <= 0) {
    $q.notify({ type: 'warning', message: 'ยอดรวมต้องมากกว่า 0 บาท' })
    return
  }

  const orderNo = props.job?.orderNo || props.job?.order_no || props.job?.id
  if (!orderNo) {
    $q.notify({ type: 'negative', message: 'ไม่พบหมายเลขงานสำหรับออกบิล' })
    return
  }

  isGenerating.value = true
  try {
    const invoiceFile = await createInvoicePdf({
      orderNo,
      job: props.job,
      technicianName: props.technicianName,
      items: normalizedItems,
      total: total.value,
    })

    emit('complete', {
      items: normalizedItems,
      total: total.value,
      ...invoiceFile,
    })
  } catch (error) {
    console.error('สร้างใบสรุป PDF ไม่สำเร็จ:', error)
    $q.notify({ type: 'negative', message: 'สร้างไฟล์ PDF ไม่สำเร็จ กรุณาลองอีกครั้ง' })
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
.completion-card {
  width: min(100%, 620px);
  max-height: 90vh;
  border-radius: 16px;
}

.completion-content {
  max-height: 65vh;
  overflow-y: auto;
}

.invoice-item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px auto;
  align-items: start;
  gap: 8px;
  margin-bottom: 8px;
}

@media (max-width: 520px) {
  .invoice-item-row {
    grid-template-columns: minmax(0, 1fr) 112px auto;
  }
}
</style>

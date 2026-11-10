<template>
  <img :src="displaySrc" :alt="alt" />
</template>

<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { api, SERVER_URL } from '@/boot/axios'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  fallback: { type: String, default: 'https://cdn.quasar.dev/img/avatar.png' },
})

const displaySrc = ref(props.fallback)
let objectUrl = ''
let requestId = 0

watch(() => props.src, async (source, _, onCleanup) => {
  const currentRequestId = ++requestId
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }

  displaySrc.value = props.fallback
  if (!source) return

  let sourceUrl
  try {
    sourceUrl = new URL(source)
  } catch {
    displaySrc.value = source
    return
  }

  if (sourceUrl.origin !== new URL(SERVER_URL).origin) {
    displaySrc.value = source
    return
  }

  try {
    const response = await api.get(source, {
      responseType: 'blob',
      signal: controller.signal,
    })
    const contentType = response.headers['content-type'] || response.data.type
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Backend returned ${contentType || 'an unknown content type'} instead of an image`)
    }

    const nextObjectUrl = URL.createObjectURL(response.data)
    if (currentRequestId !== requestId) {
      URL.revokeObjectURL(nextObjectUrl)
      return
    }

    objectUrl = nextObjectUrl
    displaySrc.value = objectUrl
  } catch (error) {
    if (controller.signal.aborted) return
    console.error('โหลดรูปจาก backend ไม่สำเร็จ:', error)
    displaySrc.value = props.fallback
  }
}, { immediate: true })

onUnmounted(() => {
  requestId += 1
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>

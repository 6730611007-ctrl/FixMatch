import { SERVER_URL } from '@/boot/axios'

export const DEFAULT_TECHNICIAN_AVATAR = 'https://cdn.quasar.dev/img/avatar.png'

export const getBackendUploadUrl = (imagePath, fallback = DEFAULT_TECHNICIAN_AVATAR) => {
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
    return fallback
  }

  const path = String(imagePath).trim()
  if (!path) return fallback

  const baseUrl = SERVER_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  const localBackendUrl = path.match(
    /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(\/.*)?$/i,
  )

  if (localBackendUrl) {
    return `${baseUrl}${localBackendUrl[1] || '/'}`
  }

  if (/^(https?:|data:|blob:)/i.test(path)) return path

  const filename = path.replace(/^\/?(uploads\/)?/, '')
  return `${baseUrl}/uploads/${filename}`
}

export const getTechnicianAvatarUrl = (technician) => {
  const avatar = technician?.avatarUrl
    || technician?.avatar_url
    || technician?.avatar
    || technician?.profileImage
    || technician?.profile_image

  if (!avatar || avatar === 'null' || avatar === 'undefined') {
    return DEFAULT_TECHNICIAN_AVATAR
  }

  return getBackendUploadUrl(avatar)
}

export const normalizeTechnicianProfile = (technician) => {
  if (!technician || typeof technician !== 'object') return null

  return {
    ...technician,
    id: technician.id ?? technician.technician_id ?? technician.technicianId ?? null,
    name: technician.name
      || technician.fullName
      || technician.full_name
      || technician.technician_name
      || 'ไม่ระบุชื่อช่าง',
    avatarUrl: getTechnicianAvatarUrl(technician),
    specialty: technician.specialty
      || technician.skills
      || technician.selectedSkills
      || technician.selected_skills
      || 'ช่างผู้เชี่ยวชาญ',
  }
}

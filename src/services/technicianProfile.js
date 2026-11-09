import { SERVER_URL } from '@/boot/axios'

export const DEFAULT_TECHNICIAN_AVATAR = 'https://cdn.quasar.dev/img/avatar.png'

export const getTechnicianAvatarUrl = (technician) => {
  const avatar = technician?.avatarUrl
    || technician?.avatar_url
    || technician?.avatar
    || technician?.profileImage
    || technician?.profile_image

  if (!avatar || avatar === 'null' || avatar === 'undefined') {
    return DEFAULT_TECHNICIAN_AVATAR
  }

  const imagePath = String(avatar)
  if (/^(https?:|data:|blob:)/i.test(imagePath)) return imagePath

  const baseUrl = SERVER_URL ? SERVER_URL.replace(/\/api\/?$/, '') : ''
  return `${baseUrl}/uploads/${imagePath.replace(/^\/?(uploads\/)?/, '')}`
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

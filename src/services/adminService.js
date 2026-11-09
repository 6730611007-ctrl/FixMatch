import { api } from '../boot/axios' // หรือ import axios จาก 'axios'

export const adminService = {
  // ดึงรายการช่างที่รอการอนุมัติ (KYC Pending)
  getPendingTechnicians() {
    return api.get('/admin/technicians/pending')
  },

  // อนุมัติช่าง
  approveTechnician(techId) {
    return api.patch(`/admin/technicians/${techId}/approve`)
  },

  // ปฏิเสธช่าง
  rejectTechnician(techId, reason = '') {
    return api.patch(`/admin/technicians/${techId}/reject`, { reason })
  },

  // ดึงภาพรวมสถิติ Metrics (งานวันนี้, รายได้รวม)
  getAdminMetrics() {
    return api.get('/admin/metrics')
  },

  // ดึงรายการออเดอร์งานซ่อมทั้งหมด (Real-time Monitor)
  getAllJobs(status = 'ALL') {
    return api.get('/admin/jobs', { params: { status } })
  },
}

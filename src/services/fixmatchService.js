import { api } from '../boot/axios'

export const fixmatchService = {
  // 1. ส่งข้อมูลแจ้งปัญหาให้ AI วิเคราะห์
  analyzeIssue(payload) {
    return api.post('/diagnose/', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

  async registerTechnician(formData) {
    const response = await api.post('/technicians/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // ดึงข้อมูลโปรไฟล์ของช่างที่ล็อกอินอยู่
  getMyProfile() {
    return api.get('/technicians/me')
  },

  getTechnicianRegistrationStatus(trackingToken) {
    return api.get('/technicians/registration-status', {
      params: { tracking_token: trackingToken },
    })
  },

  // 3. ดึงรายชื่อช่างที่แนะนำตามพิกัดและประเภทปัญหา
  getRecommendedTechnicians(params) {
    return api.get('/technicians/recommend', { params })
  },

  // 4. ยืนยันการจองคิวช่าง (ส่งไปที่ /jobs/create)
  createBooking(bookingData) {
    const customerName = String(bookingData.contactName || '').trim()
    const customerPhone = String(bookingData.contactPhone || '').trim()
    const phoneDigits = customerPhone.replace(/\D/g, '')
    if (!customerName) throw new Error('กรุณาระบุชื่อผู้ติดต่อ')
    if (phoneDigits.length !== 10) throw new Error('กรุณากรอกเบอร์โทรศัพท์ที่ติดต่อได้ 10 หลัก')

    const payload = {
      technician_id: bookingData.technicianId ?? null,
      appointment_date: String(bookingData.scheduleDate || ''),
      appointment_time: String(bookingData.scheduleTime || ''),
      address: String(bookingData.address || 'เขตภูเก็ต'),
      address_note: String(bookingData.addressNote || ''),
      latitude: bookingData.latitude ?? null,
      longitude: bookingData.longitude ?? null,
      customer_name: customerName,
      customer_phone: customerPhone,
      issue_description: String(bookingData.issueDescription || 'แจ้งบริการซ่อมแซมบ้าน'),
    }
    return api.post('/jobs/create', payload)
  },

  // 5. 🟢 ดึงข้อมูลสถานะและพิกัดจริงของช่างจากตาราง jobs
  getTrackingStatus(orderId) {
    return api.get(`/jobs/tracking/${orderId}`)
  },

  // 6. ส่งข้อมูลการชำระเงิน
  submitPayment(orderId, paymentData) {
    return api.post(`/jobs/${orderId}/payment`, paymentData)
  },

  // 7. ส่งรีวิวและคะแนนความพึงพอใจ
  submitReview(orderId, reviewData) {
    return api.post(`/jobs/${orderId}/review`, reviewData)
  },
}

export default fixmatchService

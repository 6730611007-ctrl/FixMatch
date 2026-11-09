import { defineStore } from 'pinia'

export const useBookingStore = defineStore('booking', {
  state: () => ({
    // รหัสออเดอร์เมื่อเริ่มสร้างเคส
    orderId: '',

    // 1. ข้อมูลการแจ้งปัญหา (Diagnose / Issue)
    issueData: {
      category: '',
      title: '',
      description: '',
      images: [],
    },

    // 2. ข้อมูลช่างที่เลือก (Selected Technician)
    selectedTechnician: null,
    pendingTechnicianBooking: false,

    // 3. ข้อมูลวัน เวลา และสถานที่จอง (Booking Form)
    bookingDetails: {
      scheduleDate: '',
      scheduleTime: '',
      address: '',
      addressNote: '',
      contactName: '',
      contactPhone: '',
    },

    // 4. ข้อมูลการชำระเงินและสรุปยอด (Payment / Summary)
    paymentData: {
      subtotal: 0,
      discount: 0,
      totalAmount: 0,
      paymentMethod: 'cash',
      slipImageUrl: '',
      isPaid: false,
    },
  }),

  actions: {
    setOrderId(id) {
      this.orderId = id
    },
    setIssue(data) {
      this.issueData = { ...this.issueData, ...data }
    },
    setSelectedTechnician(tech) {
      this.selectedTechnician = tech
    },
    setPendingTechnicianBooking(isPending) {
      this.pendingTechnicianBooking = isPending
    },
    setBookingDetails(details) {
      this.bookingDetails = { ...this.bookingDetails, ...details }
    },
    setPaymentData(payment) {
      this.paymentData = { ...this.paymentData, ...payment }
    },
    // 🟢 ล้างข้อมูลทั้งหมดเมื่อชำระเงินเสร็จสิ้น หรือกดยกเลิก
    resetBooking() {
      this.orderId = ''
      this.issueData = { category: '', title: '', description: '', images: [] }
      this.selectedTechnician = null
      this.pendingTechnicianBooking = false
      this.bookingDetails = {
        scheduleDate: '',
        scheduleTime: '',
        address: '',
        addressNote: '',
        contactName: '',
        contactPhone: '',
      }
      this.paymentData = {
        subtotal: 0,
        discount: 0,
        totalAmount: 0,
        paymentMethod: 'cash',
        slipImageUrl: '',
        isPaid: false,
      }
    },
  },

  // 🟢 บังคับให้ Pinia บันทึกข้อมูลทั้งหมดลง localStorage
  persist: {
    key: 'fixmatch_active_booking',
    storage: localStorage,
  },
})

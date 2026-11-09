const ACTIVE_TRACKING_KEY = 'fixmatch_active_tracking_order'
const ACCEPTED_TRACKING_KEY = 'fixmatch_accepted_tracking_order'

export const getActiveTrackingOrder = () => localStorage.getItem(ACTIVE_TRACKING_KEY) || ''
export const isTechnicianAccepted = (orderId) => (
  Boolean(orderId) && localStorage.getItem(ACCEPTED_TRACKING_KEY) === String(orderId)
)

export const setActiveTrackingOrder = (orderId) => {
  if (!orderId) throw new Error('ไม่สามารถบันทึกสถานะติดตามได้โดยไม่มีหมายเลขงาน')
  if (getActiveTrackingOrder() !== String(orderId)) {
    localStorage.removeItem(ACCEPTED_TRACKING_KEY)
  }
  localStorage.setItem(ACTIVE_TRACKING_KEY, String(orderId))
}

export const markTechnicianAccepted = (orderId) => {
  if (!orderId) throw new Error('ไม่สามารถยืนยันการรับงานได้โดยไม่มีหมายเลขงาน')
  localStorage.setItem(ACCEPTED_TRACKING_KEY, String(orderId))
}

export const clearActiveTrackingOrder = (orderId) => {
  if (!orderId || getActiveTrackingOrder() === String(orderId)) {
    localStorage.removeItem(ACTIVE_TRACKING_KEY)
    localStorage.removeItem(ACCEPTED_TRACKING_KEY)
  }
}

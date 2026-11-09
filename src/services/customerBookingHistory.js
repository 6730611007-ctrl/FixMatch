const getStorageKey = (user) => {
  const savedUser = user || JSON.parse(localStorage.getItem('user_info') || 'null')
  const identity = savedUser?.id || savedUser?.user_id || savedUser?.email || savedUser?.phone
  if (!identity) return null

  return `fixmatch_customer_bookings_${encodeURIComponent(String(identity).trim().toLowerCase())}`
}

export const getCustomerBookingHistory = (user) => {
  const key = getStorageKey(user)
  if (!key) return []

  const storedBookings = localStorage.getItem(key)
  if (!storedBookings) return []

  const bookings = JSON.parse(storedBookings)
  if (!Array.isArray(bookings)) {
    throw new Error('ข้อมูลประวัติการจองที่บันทึกไว้ไม่ถูกต้อง')
  }

  return bookings
}

export const saveCustomerBooking = (user, booking) => {
  const key = getStorageKey(user)
  if (!key) return false

  const bookings = getCustomerBookingHistory(user)
  const orderId = booking.orderNo || booking.order_no
  const updatedBookings = [
    booking,
    ...bookings.filter((item) => (item.orderNo || item.order_no) !== orderId),
  ]

  localStorage.setItem(key, JSON.stringify(updatedBookings))
  return true
}

export const mergeCustomerBookingHistory = (serverBookings, savedBookings) => {
  const mergedBookings = new Map()

  for (const booking of [...savedBookings, ...serverBookings]) {
    const orderId = booking.orderNo || booking.order_no || booking.orderId || booking.id
    if (!orderId) continue

    const key = String(orderId)
    const previous = mergedBookings.get(key)
    mergedBookings.set(key, {
      ...previous,
      ...booking,
      technician: {
        ...previous?.technician,
        ...booking.technician,
      },
    })
  }

  return [...mergedBookings.values()]
}

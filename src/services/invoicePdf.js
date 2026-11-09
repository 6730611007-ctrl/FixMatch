import { jsPDF } from 'jspdf'

const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount)

const wrapText = (context, text, maxWidth) => {
  const words = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(text)].map(({ segment }) => segment)
    : [...text]
  const lines = []
  let line = ''

  for (const word of words) {
    const candidate = line + word
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word.trimStart()
    } else {
      line = candidate
    }
  }

  if (line) lines.push(line)
  return lines
}

export const createInvoicePdf = async ({
  orderNo,
  job,
  technicianName,
  items,
  total,
  title = 'ใบสรุปรายการซ่อมและค่าบริการ',
  fileSuffix = 'invoice',
  paymentMethod,
  paidAt,
}) => {
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = 1240
  canvas.height = 1754
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('เบราว์เซอร์ไม่สามารถสร้างไฟล์ใบแจ้งค่าบริการได้')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.font = '34px Tahoma, "Noto Sans Thai", sans-serif'
  context.fillStyle = '#0f172a'
  context.fillText(title, 80, 130)
  context.font = '24px Tahoma, "Noto Sans Thai", sans-serif'
  context.fillStyle = '#475569'
  context.fillText(`หมายเลขงาน: ${orderNo}`, 80, 190)
  context.fillText(`ลูกค้า: ${job.customerName || 'ลูกค้า FixMatch'}`, 80, 240)
  context.fillText(`ช่างผู้ให้บริการ: ${technicianName}`, 80, 290)
  context.fillText(`วันที่ออกเอกสาร: ${new Date().toLocaleDateString('th-TH')}`, 80, 340)
  context.fillText(`รายละเอียดปัญหา: ${job.issueDescription || 'งานซ่อมแซมทั่วไป'}`, 80, 390)

  context.fillStyle = '#f1f5f9'
  context.fillRect(70, 450, 1100, 70)
  context.font = 'bold 24px Tahoma, "Noto Sans Thai", sans-serif'
  context.fillStyle = '#334155'
  context.fillText('รายการงาน / อะไหล่', 95, 495)
  context.fillText('จำนวนเงิน (บาท)', 900, 495)

  context.font = '23px Tahoma, "Noto Sans Thai", sans-serif'
  let y = 565
  for (const [index, item] of items.entries()) {
    const lines = wrapText(context, `${index + 1}. ${item.description}`, 730)
    context.fillStyle = '#1e293b'
    lines.forEach((line, lineIndex) => context.fillText(line, 95, y + lineIndex * 32))
    context.textAlign = 'right'
    context.fillText(formatCurrency(item.amount), 1125, y)
    context.textAlign = 'left'
    y += Math.max(70, lines.length * 34 + 28)
    context.strokeStyle = '#e2e8f0'
    context.beginPath()
    context.moveTo(90, y - 18)
    context.lineTo(1150, y - 18)
    context.stroke()
  }

  const totalY = Math.min(Math.max(y + 45, 700), 1550)
  context.font = 'bold 30px Tahoma, "Noto Sans Thai", sans-serif'
  context.fillStyle = '#0f172a'
  context.fillText('ยอดรวมทั้งสิ้น', 95, totalY)
  context.textAlign = 'right'
  context.fillText(`${formatCurrency(total)} บาท`, 1125, totalY)
  context.textAlign = 'left'
  if (paymentMethod) {
    context.font = 'bold 24px Tahoma, "Noto Sans Thai", sans-serif'
    context.fillStyle = '#047857'
    context.fillText(`สถานะ: ชำระแล้ว (${paymentMethod})`, 95, totalY + 60)
    context.font = '21px Tahoma, "Noto Sans Thai", sans-serif'
    context.fillText(`วันที่ชำระ: ${paidAt || new Date().toLocaleString('th-TH')}`, 95, totalY + 105)
  }
  context.font = '20px Tahoma, "Noto Sans Thai", sans-serif'
  context.fillStyle = paymentMethod ? '#047857' : '#64748b'
  context.fillText(
    paymentMethod ? 'เอกสารยืนยันการรับชำระเงินสด' : 'เอกสารสรุปรายการงานและค่าใช้จ่ายจากผู้ให้บริการ',
    80,
    1650,
  )

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297)

  const dataUri = pdf.output('datauristring')
  return {
    fileName: `FixMatch-${orderNo}-${fileSuffix}.pdf`,
    pdfBase64: dataUri.substring(dataUri.indexOf(',') + 1),
  }
}

export const createPaymentReceiptPdf = (payment) => createInvoicePdf({
  ...payment,
  title: 'ใบยืนยันการชำระเงิน',
  fileSuffix: 'receipt',
  paymentMethod: 'เงินสด',
})

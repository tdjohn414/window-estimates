'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { generateTestData } from '@/data/testData'

interface LineItem {
  id: string
  room: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Hardcoded company information
const COMPANY = {
  name: 'SUNNY STATE GLASS',
  tagline: 'Bringing Sunshine Through Every Pane',
  phone: '623-498-1939',
  license: 'ROC#325171',
  website: 'https://www.sunnystateglass.com/',
  logoUrl: 'https://res.cloudinary.com/dqvolqe3u/image/upload/v1769019618/Image_nklqur.png',
}

interface QuoteInfo {
  projectName: string
  quoteNumber: string
  quoteDate: string
  validUntil: string
  useCustomValidUntil: boolean

  clientName: string
  clientPhone: string
  clientEmail: string

  laborInstallation: number

  notes: string
  installationWeeks: number
}

// Add 15 business days to a date (like the example: 1/9 to 1/31 is ~15 business days)
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++
    }
  }
  return result
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}

// Format phone number as user types: 623-523-7357
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

const DEFAULT_NOTES = `- Installation to be completed within {weeks} week.
- All materials and labor included.
- Any additional work will be quoted separately.`

function getDefaultNotes(weeks: number): string {
  return DEFAULT_NOTES.replace('{weeks}', weeks.toString())
}

export default function HomePage() {
  const { theme, toggleTheme } = useTheme()

  const [info, setInfo] = useState<QuoteInfo>({
    projectName: '',
    quoteNumber: '01',
    quoteDate: formatDate(new Date()),
    validUntil: formatDate(addBusinessDays(new Date(), 30)),
    useCustomValidUntil: false,

    clientName: '',
    clientPhone: '',
    clientEmail: '',

    laborInstallation: 0,

    notes: '',
    installationWeeks: 1,
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), room: '', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ])

  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [formWidth, setFormWidth] = useState(70) // percentage
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [testLineItemCount, setTestLineItemCount] = useState(3)

  // Fill form with test data
  const fillTestData = () => {
    const testData = generateTestData(testLineItemCount)
    setInfo(prev => ({
      ...prev,
      projectName: testData.projectName,
      quoteNumber: testData.quoteNumber,
      clientName: testData.clientName,
      clientPhone: testData.clientPhone,
      clientEmail: testData.clientEmail,
      laborInstallation: testData.laborInstallation,
    }))
    setLineItems(testData.lineItems)
  }

  // Handle resize drag
  const handleMouseDown = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      // Clamp between 30% and 80%
      setFormWidth(Math.min(80, Math.max(30, newWidth)))
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const addLineItem = () => {
    const newId = crypto.randomUUID()
    setLineItems([
      ...lineItems,
      { id: newId, room: '', description: '', quantity: 1, unitPrice: 0, total: 0 }
    ])
    // Focus the new row's description field after render
    setTimeout(() => {
      const newInput = document.querySelector(`[data-item-id="${newId}"]`) as HTMLInputElement
      newInput?.focus()
    }, 0)
  }

  const handleLineItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addLineItem()
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id !== id) return item

        const updated = { ...item, [field]: value }

        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice)
        }

        return updated
      })
    )
  }

  const deleteLineItem = (id: string) => {
    if (lineItems.length === 1) {
      setLineItems([{ id: crypto.randomUUID(), room: '', description: '', quantity: 1, unitPrice: 0, total: 0 }])
    } else {
      setLineItems(items => items.filter(item => item.id !== id))
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const totalAmount = subtotal + info.laborInstallation

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Core PDF generation logic - returns the doc for preview or saves for download
  const buildPDF = useCallback(async (mode: 'preview' | 'download') => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    const primaryBlack = [0, 0, 0] as [number, number, number]
    const headerBlack = [0, 0, 0] as [number, number, number]
    const blackText = [0, 0, 0] as [number, number, number]

    const margin = 12.7 // 0.5 inch margin (all sides)
    const bottomMargin = margin
    let y = margin

    // Company Logo - use fixed width, calculate height from aspect ratio
    const logoWidth = 80
    let logoHeight = 20 // fallback

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = COMPANY.logoUrl
      })
      const imgRatio = img.width / img.height
      logoHeight = logoWidth / imgRatio
      doc.addImage(img, 'PNG', margin, y, logoWidth, logoHeight)
    } catch (e) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...primaryBlack)
      doc.text(COMPANY.name, margin, y + 10)
    }

    // Project Name Quote title - vertically centered with logo
    // Handle long project names (>18 chars): try line break first, then reduce font size
    const projectTitle = info.projectName.toUpperCase().slice(0, 25) + ' QUOTE'
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...blackText)

    const titleX = pageWidth - margin
    const titleCenterY = y + (logoHeight / 2)

    if (info.projectName.length > 18) {
      // Try to split into two lines
      const words = projectTitle.split(' ')
      const quoteWord = words.pop() // Remove 'QUOTE'
      const projectWords = words

      // Find a good split point (roughly middle)
      let line1 = ''
      let line2 = ''
      let midPoint = Math.ceil(projectWords.length / 2)
      line1 = projectWords.slice(0, midPoint).join(' ')
      line2 = projectWords.slice(midPoint).join(' ') + ' ' + quoteWord

      // If line break works well, use smaller font with 2 lines
      if (line1.length <= 20 && line2.length <= 20) {
        doc.setFontSize(14)
        doc.text(line1, titleX, titleCenterY - 2, { align: 'right' })
        doc.text(line2, titleX, titleCenterY + 6, { align: 'right' })
      } else {
        // Use variable font size based on length
        const fontSize = Math.max(12, 18 - (info.projectName.length - 18) * 0.8)
        doc.setFontSize(fontSize)
        doc.text(projectTitle, titleX, titleCenterY + 3, { align: 'right' })
      }
    } else {
      doc.setFontSize(18)
      doc.text(projectTitle, titleX, titleCenterY + 3, { align: 'right' })
    }

    // Line right after logo (10px gap below image)
    y += logoHeight + 4
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)

    y += 8

    // Client info section
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('CLIENT', margin, y + 2)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...blackText)
    doc.text(info.clientName || '', margin, y + 10)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    if (info.clientPhone) doc.text(info.clientPhone, margin, y + 17)
    if (info.clientEmail) doc.text(info.clientEmail, margin, y + 24)

    // Quote details on the right
    const rightX = pageWidth - margin
    const labelX = pageWidth - 75

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('QUOTE #', labelX, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...blackText)
    doc.text(info.quoteNumber, rightX, y + 2, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('DATE', labelX, y + 11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...blackText)
    doc.text(info.quoteDate, rightX, y + 11, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('VALID UNTIL', labelX, y + 20)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...blackText)
    doc.text(info.validUntil, rightX, y + 20, { align: 'right' })

    y += 32 + 8

    const filteredItems = lineItems.filter(item => item.description.trim() !== '')
    const hasAnyRoom = filteredItems.some(item => item.room.trim() !== '')

    // Calculate proper column widths to fit within margins
    const colWidth = pageWidth - (margin * 2)

    let tableHead: string[][]
    let tableData: string[][]
    let columnStyles: any

    if (hasAnyRoom) {
      const roomWidth = colWidth * 0.20
      const descWidth = colWidth * 0.35
      const qtyWidth = colWidth * 0.08
      const priceWidth = colWidth * 0.18
      const totalWidth = colWidth * 0.19

      tableHead = [['ROOM', 'DESCRIPTION', 'QTY', 'PRICE', 'TOTAL']]
      tableData = filteredItems.map(item => [
        item.room || '',
        item.description,
        item.quantity.toString(),
        '$' + formatCurrency(item.unitPrice),
        '$' + formatCurrency(item.total)
      ])
      columnStyles = {
        0: { cellWidth: roomWidth, halign: 'left' },
        1: { cellWidth: descWidth, halign: 'left' },
        2: { cellWidth: qtyWidth, halign: 'center' },
        3: { cellWidth: priceWidth, halign: 'right' },
        4: { cellWidth: totalWidth, halign: 'right', fontStyle: 'bold' },
      }
    } else {
      const descWidth = colWidth * 0.50
      const qtyWidth = colWidth * 0.12
      const priceWidth = colWidth * 0.19
      const totalWidth = colWidth * 0.19

      tableHead = [['DESCRIPTION', 'QTY', 'PRICE', 'TOTAL']]
      tableData = filteredItems.map(item => [
        item.description,
        item.quantity.toString(),
        '$' + formatCurrency(item.unitPrice),
        '$' + formatCurrency(item.total)
      ])
      columnStyles = {
        0: { cellWidth: descWidth, halign: 'left' },
        1: { cellWidth: qtyWidth, halign: 'center' },
        2: { cellWidth: priceWidth, halign: 'right' },
        3: { cellWidth: totalWidth, halign: 'right', fontStyle: 'bold' },
      }
    }

    autoTable(doc, {
      startY: y,
      head: tableHead,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: headerBlack,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 3,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles,
      margin: { left: margin, right: margin },
      tableLineWidth: 0,
      tableLineColor: [255, 255, 255],
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
    })

    let finalY = (doc as any).lastAutoTable.finalY + 10

    // Totals on the right
    const totalsX = pageWidth - margin
    const labelsX = pageWidth - 90

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...blackText)
    doc.text('SUBTOTAL:', labelsX, finalY)
    doc.setFont('helvetica', 'normal')
    doc.text('$' + formatCurrency(subtotal), totalsX, finalY, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.text('LABOR & INSTALLATION:', labelsX, finalY + 8)
    doc.setFont('helvetica', 'normal')
    doc.text('$' + formatCurrency(info.laborInstallation), totalsX, finalY + 8, { align: 'right' })

    const totalBoxY = finalY + 18
    doc.setFillColor(...headerBlack)
    doc.roundedRect(labelsX - 5, totalBoxY - 4, totalsX - labelsX + 10, 14, 2, 2, 'F')

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL AMOUNT:', labelsX, totalBoxY + 5)
    doc.text('$' + formatCurrency(totalAmount), totalsX, totalBoxY + 5, { align: 'right' })

    // Notes on the left - aligned with TOTAL AMOUNT row
    const notesWidth = 90
    const notesStartY = totalBoxY - 14 // Moved up 10px
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...blackText)
    doc.text('NOTES:', margin, notesStartY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const notesText = info.notes || getDefaultNotes(info.installationWeeks)
    const splitNotes = doc.splitTextToSize(notesText, notesWidth)
    doc.text(splitNotes, margin, notesStartY + 6)

    // Footer section - bottom left, stacked format
    const footerX = margin
    const footerY = pageHeight - bottomMargin - 20

    // Company name - bold
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Sunny State Glass', footerX, footerY)

    // ROC
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text(COMPANY.license, footerX, footerY + 6)

    // Phone
    doc.text(COMPANY.phone, footerX, footerY + 12)

    // Website - blue link
    doc.setTextColor(0, 102, 204)
    doc.textWithLink(COMPANY.website.replace('https://', '').replace('http://', ''), footerX, footerY + 18, { url: COMPANY.website })

    if (mode === 'download') {
      const fileName = info.projectName
        ? `${info.projectName.replace(/\s+/g, '_')}_Quote_${info.quoteNumber}.pdf`
        : `Quote_${info.quoteNumber}.pdf`
      doc.save(fileName)
      return null
    } else {
      // Return blob URL for preview
      const blob = doc.output('blob')
      return URL.createObjectURL(blob)
    }
  }, [info, lineItems, subtotal, totalAmount])

  // Update preview when form changes
  useEffect(() => {
    // Clear previous timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    // Debounce preview generation
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        const url = await buildPDF('preview')
        if (url) {
          setPreviewUrl(oldUrl => {
            // Revoke old URL to prevent memory leaks
            if (oldUrl) {
              URL.revokeObjectURL(oldUrl)
            }
            return url
          })
        }
      } catch (error) {
        console.error('Error generating preview:', error)
      }
    }, 300)

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [info, lineItems, buildPDF])

  const generatePDF = async () => {
    setGenerating(true)
    try {
      await buildPDF('download')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
  }

  const getNotesValue = () => {
    return info.notes || getDefaultNotes(info.installationWeeks)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-50"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      <div className="flex" ref={containerRef}>
        {/* Left Column - Form */}
        <div style={{ width: `${formWidth}%` }} className="pr-4 overflow-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-black dark:text-white text-center flex-1">
              Sunny State Glass Quote Generator
            </h1>
            {/* Test Data Button */}
            <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-2 rounded-lg">
              <span className="text-sm text-yellow-800 dark:text-yellow-200">Test:</span>
              <select
                value={testLineItemCount}
                onChange={(e) => setTestLineItemCount(parseInt(e.target.value))}
                className="text-sm border border-yellow-300 dark:border-yellow-700 rounded px-2 py-1 bg-white dark:bg-gray-800"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} items</option>
                ))}
              </select>
              <button
                onClick={fillTestData}
                className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded font-medium transition-colors"
              >
                Fill
              </button>
            </div>
          </div>

          {/* Project & Quote Info */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project & Quote Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quote Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Desert Ridge"
                    className="input-field"
                    maxLength={25}
                    value={info.projectName}
                    onChange={(e) => setInfo({ ...info, projectName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quote #</label>
                    <input
                      type="text"
                      className="input-field"
                      value={info.quoteNumber}
                      onChange={(e) => setInfo({ ...info, quoteNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={new Date(info.quoteDate).toISOString().split('T')[0]}
                      onChange={(e) => setInfo({ ...info, quoteDate: formatDate(new Date(e.target.value)) })}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valid Until</label>
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={info.useCustomValidUntil}
                        onChange={(e) => setInfo({ ...info, useCustomValidUntil: e.target.checked })}
                        className="rounded border-gray-300 text-black focus:ring-black"
                      />
                      Custom date
                    </label>
                  </div>
                  {info.useCustomValidUntil ? (
                    <input
                      type="date"
                      className="input-field"
                      value={new Date(info.validUntil).toISOString().split('T')[0]}
                      onChange={(e) => setInfo({ ...info, validUntil: formatDate(new Date(e.target.value)) })}
                    />
                  ) : (
                    <div className="input-field bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {info.validUntil} <span className="text-xs">(+30 business days)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Information</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Client Name"
                  className="input-field"
                  value={info.clientName}
                  onChange={(e) => setInfo({ ...info, clientName: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Phone (e.g., 555-555-5555)"
                  className="input-field"
                  value={info.clientPhone}
                  onChange={(e) => setInfo({ ...info, clientPhone: formatPhoneNumber(e.target.value) })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="input-field"
                  value={info.clientEmail}
                  onChange={(e) => setInfo({ ...info, clientEmail: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
            <button onClick={addLineItem} className="btn-primary">
              + Add Item
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 px-2 bg-black text-white py-2 rounded-t">
            <div className="col-span-2">ROOM</div>
            <div className="col-span-4">DESCRIPTION</div>
            <div className="col-span-1 text-center">QTY</div>
            <div className="col-span-2 text-right">UNIT PRICE</div>
            <div className="col-span-2 text-right">TOTAL</div>
            <div className="col-span-1"></div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 p-2 rounded-lg ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'}`}
              >
                {/* Room */}
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Room</label>
                  <input
                    type="text"
                    placeholder="Room (optional)"
                    className="input-field"
                    value={item.room}
                    onChange={(e) => updateLineItem(item.id, 'room', e.target.value)}
                    onKeyDown={handleLineItemKeyDown}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-4">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Description</label>
                  <input
                    type="text"
                    placeholder="Description"
                    className="input-field"
                    data-item-id={item.id}
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    onKeyDown={handleLineItemKeyDown}
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-1">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    className="input-field text-center w-24 md:w-full"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    onKeyDown={handleLineItemKeyDown}
                  />
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Unit Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field pl-7 text-right"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      onKeyDown={handleLineItemKeyDown}
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="md:col-span-2 flex items-center justify-end">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mr-2">Total:</label>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${formatCurrency(item.total)}
                  </span>
                </div>

                {/* Delete Button */}
                <div className="md:col-span-1 flex items-center justify-end">
                  <button
                    onClick={() => deleteLineItem(item.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete line item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col items-end gap-2">
              {/* Subtotal */}
              <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                <span className="font-semibold">SUBTOTAL:</span>
                <span className="w-32 text-right">${formatCurrency(subtotal)}</span>
              </div>

              {/* Labor & Installation */}
              <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                <span className="font-semibold">LABOR & INSTALLATION:</span>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field pl-7 text-right"
                    value={info.laborInstallation || ''}
                    onChange={(e) => setInfo({ ...info, laborInstallation: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex items-center gap-4 bg-black text-white px-4 py-2 rounded-lg mt-2">
                <span className="font-bold">TOTAL AMOUNT:</span>
                <span className="text-xl font-bold w-32 text-right">${formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Installation weeks:</label>
              <input
                type="number"
                min="1"
                className="input-field w-16 text-center"
                value={info.installationWeeks}
                onChange={(e) => setInfo({ ...info, installationWeeks: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <textarea
            placeholder="Notes will use default verbiage if left empty..."
            className="input-field h-32 resize-none font-mono text-sm"
            value={info.notes}
            onChange={(e) => setInfo({ ...info, notes: e.target.value })}
          />
          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview (default if empty):</p>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{getNotesValue()}</pre>
          </div>
        </div>

        {/* Generate PDF Button */}
        <div className="flex justify-center">
          <button
            onClick={generatePDF}
            disabled={generating}
            className="btn-success text-lg px-8 py-3 disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </span>
            )}
          </button>
        </div>

        {/* Summary */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {lineItems.filter(i => i.description.trim()).length} item(s)
          </p>
        </div>

        {/* Draggable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 cursor-col-resize hover:bg-blue-500 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0 transition-colors"
          title="Drag to resize"
        />

        {/* Right Column - PDF Preview */}
        <div style={{ width: `${100 - formWidth}%` }} className="pl-4 sticky top-4 h-[calc(100vh-2rem)]">
          <div className="card h-full flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Live Preview</h2>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span>Loading preview...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

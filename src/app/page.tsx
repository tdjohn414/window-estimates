'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface SavedLogo {
  url: string
  name: string
  uploadedAt: number
}

interface QuoteInfo {
  companyName: string
  companyTagline: string
  companyPhone: string
  companyLicense: string
  companyWebsite: string
  companyLogoUrl: string

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

const SAVED_LOGOS_KEY = 'estimate-app-saved-logos'

export default function HomePage() {
  const { theme, toggleTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [info, setInfo] = useState<QuoteInfo>({
    companyName: 'SUNNY STATE GLASS',
    companyTagline: 'Bringing Sunshine Through Every Pane',
    companyPhone: '623-498-1939',
    companyLicense: 'ROC#325171',
    companyWebsite: 'https://www.sunnystateglass.com/',
    companyLogoUrl: '',

    projectName: '',
    quoteNumber: '01',
    quoteDate: formatDate(new Date()),
    validUntil: formatDate(addBusinessDays(new Date(), 15)),
    useCustomValidUntil: false,

    clientName: '',
    clientPhone: '',
    clientEmail: '',

    laborInstallation: 0,

    notes: '',
    installationWeeks: 1,
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }
  ])

  const [generating, setGenerating] = useState(false)
  const [showCompanySettings, setShowCompanySettings] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [savedLogos, setSavedLogos] = useState<SavedLogo[]>([])
  const [showSavedLogos, setShowSavedLogos] = useState(false)

  // Load saved logos from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_LOGOS_KEY)
    if (saved) {
      try {
        setSavedLogos(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved logos:', e)
      }
    }
  }, [])

  // Save logos to localStorage when they change
  const saveLogosToStorage = (logos: SavedLogo[]) => {
    localStorage.setItem(SAVED_LOGOS_KEY, JSON.stringify(logos))
    setSavedLogos(logos)
  }

  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      // Set the logo URL
      setInfo(prev => ({ ...prev, companyLogoUrl: data.url }))

      // Save to recent logos
      const newLogo: SavedLogo = {
        url: data.url,
        name: file.name,
        uploadedAt: Date.now(),
      }
      const updatedLogos = [newLogo, ...savedLogos.filter(l => l.url !== data.url)].slice(0, 10)
      saveLogosToStorage(updatedLogos)

    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload logo. Make sure Cloudinary is configured.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadLogo(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadLogo(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const selectSavedLogo = (logo: SavedLogo) => {
    setInfo(prev => ({ ...prev, companyLogoUrl: logo.url }))
    setShowSavedLogos(false)
  }

  const deleteSavedLogo = (url: string) => {
    const updatedLogos = savedLogos.filter(l => l.url !== url)
    saveLogosToStorage(updatedLogos)
    if (info.companyLogoUrl === url) {
      setInfo(prev => ({ ...prev, companyLogoUrl: '' }))
    }
  }

  const addLineItem = () => {
    const newId = crypto.randomUUID()
    setLineItems([
      ...lineItems,
      { id: newId, description: '', quantity: 1, unitPrice: 0, total: 0 }
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
      setLineItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, total: 0 }])
    } else {
      setLineItems(items => items.filter(item => item.id !== id))
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const totalAmount = subtotal + info.laborInstallation

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const generatePDF = async () => {
    setGenerating(true)

    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const primaryBlue = [0, 102, 204] as [number, number, number]
      const lightBlue = [0, 153, 255] as [number, number, number]
      const headerBlue = [51, 153, 255] as [number, number, number]
      const blackText = [0, 0, 0] as [number, number, number]

      let y = 15

      // Company Logo (if provided)
      if (info.companyLogoUrl) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = info.companyLogoUrl
          })
          // Calculate dimensions to maintain aspect ratio
          const maxWidth = 80
          const maxHeight = 30
          const imgRatio = img.width / img.height
          let imgWidth = maxWidth
          let imgHeight = imgWidth / imgRatio

          // If height exceeds max, scale down based on height instead
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = imgHeight * imgRatio
          }

          doc.addImage(img, 'PNG', 14, y, imgWidth, imgHeight)
        } catch (e) {
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...primaryBlue)
          doc.text(info.companyName, 14, y + 10)
        }
      } else {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...primaryBlue)
        doc.text(info.companyName, 14, y + 8)
      }

      // Project Name Quote title - lighter blue, clean font
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...lightBlue)
      doc.text(info.projectName.toUpperCase() + ' QUOTE', pageWidth - 14, y + 10, { align: 'right' })

      y += 14
      // Tagline in gray/black, not blue - closer to logo
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(100, 100, 100)
      doc.text(info.companyTagline, 14, y)

      y += 8
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(14, y, pageWidth - 14, y)

      y += 8

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...blackText)
      doc.text('Client:', 14, y)

      doc.setFont('helvetica', 'normal')
      doc.text(info.clientName || '', 14, y + 7)
      if (info.clientPhone) doc.text(info.clientPhone, 14, y + 14)
      if (info.clientEmail) doc.text(info.clientEmail, 14, y + 21)

      const rightX = pageWidth - 14
      doc.setFont('helvetica', 'bold')
      doc.text('QUOTE #:', rightX - 50, y)
      doc.setFont('helvetica', 'normal')
      doc.text(info.quoteNumber, rightX, y, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.text('DATE:', rightX - 50, y + 7)
      doc.setFont('helvetica', 'normal')
      doc.text(info.quoteDate, rightX, y + 7, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.text('VALID UNTIL:', rightX - 50, y + 14)
      doc.setFont('helvetica', 'normal')
      doc.text(info.validUntil, rightX, y + 14, { align: 'right' })

      y += 30

      const tableData = lineItems
        .filter(item => item.description.trim() !== '')
        .map(item => [
          item.description,
          item.quantity.toString(),
          '$' + formatCurrency(item.unitPrice),
          '$' + formatCurrency(item.total)
        ])

      // Calculate proper column widths to fit within margins
      const tableWidth = pageWidth - 28 // 14px margin each side
      const descWidth = tableWidth * 0.50
      const qtyWidth = tableWidth * 0.12
      const priceWidth = tableWidth * 0.19
      const totalWidth = tableWidth * 0.19

      autoTable(doc, {
        startY: y,
        head: [['DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: headerBlue,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 11,
          cellPadding: 6,
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 11,
          cellPadding: 6,
          lineColor: [230, 230, 230],
          lineWidth: 0.1,
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        columnStyles: {
          0: { cellWidth: descWidth, halign: 'left' },
          1: { cellWidth: qtyWidth, halign: 'center' },
          2: { cellWidth: priceWidth, halign: 'right' },
          3: { cellWidth: totalWidth, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
        tableLineWidth: 0,
        tableLineColor: [255, 255, 255],
        styles: {
          overflow: 'linebreak',
          cellWidth: 'wrap',
        },
      })

      let finalY = (doc as any).lastAutoTable.finalY + 5

      const totalsX = pageWidth - 14
      const labelsX = pageWidth - 90

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...blackText)
      doc.text('SUBTOTAL:', labelsX, finalY + 8)
      doc.setFont('helvetica', 'normal')
      doc.text('$' + formatCurrency(subtotal), totalsX, finalY + 8, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.text('LABOR & INSTALLATION:', labelsX, finalY + 16)
      doc.setFont('helvetica', 'normal')
      doc.text('$' + formatCurrency(info.laborInstallation), totalsX, finalY + 16, { align: 'right' })

      finalY += 26
      doc.setFillColor(...headerBlue)
      doc.rect(labelsX - 5, finalY - 4, totalsX - labelsX + 10, 14, 'F')

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('TOTAL AMOUNT:', labelsX, finalY + 5)
      doc.text('$' + formatCurrency(totalAmount), totalsX, finalY + 5, { align: 'right' })

      const bottomY = finalY + 45

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...blackText)
      doc.text('NOTES:', 14, bottomY)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const notesText = info.notes || getDefaultNotes(info.installationWeeks)
      const splitNotes = doc.splitTextToSize(notesText, pageWidth - 28)
      doc.text(splitNotes, 14, bottomY + 8)

      // Footer section with styled bar
      const footerY = pageHeight - 35

      // Footer divider line
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.line(14, footerY - 8, pageWidth - 14, footerY - 8)

      // Company info on left
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...blackText)
      doc.text(info.companyName, 14, footerY)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(info.companyTagline, 14, footerY + 5)

      // Contact info in middle
      const centerX = pageWidth / 2
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...blackText)
      doc.text(info.companyPhone, centerX, footerY, { align: 'center' })
      doc.text(info.companyLicense, centerX, footerY + 5, { align: 'center' })

      // Website on right
      doc.setTextColor(...primaryBlue)
      doc.textWithLink(info.companyWebsite.replace('https://', '').replace('http://', ''), pageWidth - 14, footerY, { url: info.companyWebsite, align: 'right' })

      const fileName = info.projectName
        ? `${info.projectName.replace(/\s+/g, '_')}_Quote_${info.quoteNumber}.pdf`
        : `Quote_${info.quoteNumber}.pdf`
      doc.save(fileName)

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

      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8 text-center">
          Quote Generator
        </h1>

        {/* Company Settings Accordion */}
        <details
          className="mb-6 group"
          open={showCompanySettings}
          onToggle={(e) => setShowCompanySettings((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-gray-800 dark:to-gray-800 hover:from-blue-100 dark:hover:from-gray-700 rounded-lg cursor-pointer list-none border border-gray-200 dark:border-gray-700 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-medium text-gray-700 dark:text-gray-200">Company Settings</span>
            </div>
            <svg className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div className="card mt-2 border-l-4 border-blue-500">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h2>

            {/* Logo Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo
              </label>

              {/* Current Logo Preview */}
              {info.companyLogoUrl && (
                <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center gap-4">
                  <img
                    src={info.companyLogoUrl}
                    alt="Company Logo"
                    className="h-12 object-contain"
                  />
                  <button
                    onClick={() => setInfo(prev => ({ ...prev, companyLogoUrl: '' }))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">
                      Drag & drop your logo here, or <span className="text-blue-500">click to browse</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>

              {/* Saved Logos */}
              {savedLogos.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowSavedLogos(!showSavedLogos)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <svg className={`w-3 h-3 transition-transform ${showSavedLogos ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Previously uploaded logos ({savedLogos.length})
                  </button>

                  {showSavedLogos && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {savedLogos.map((logo) => (
                        <div
                          key={logo.url}
                          className={`relative p-2 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                            info.companyLogoUrl === logo.url ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                          }`}
                          onClick={() => selectSavedLogo(logo)}
                        >
                          <img
                            src={logo.url}
                            alt={logo.name}
                            className="h-10 w-full object-contain"
                          />
                          <p className="text-xs text-gray-500 truncate mt-1">{logo.name}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSavedLogo(logo.url)
                            }}
                            className="absolute top-1 right-1 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={info.companyName}
                  onChange={(e) => setInfo({ ...info, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline</label>
                <input
                  type="text"
                  className="input-field"
                  value={info.companyTagline}
                  onChange={(e) => setInfo({ ...info, companyTagline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="text"
                  className="input-field"
                  value={info.companyPhone}
                  onChange={(e) => setInfo({ ...info, companyPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License #</label>
                <input
                  type="text"
                  className="input-field"
                  value={info.companyLicense}
                  onChange={(e) => setInfo({ ...info, companyLicense: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input
                  type="text"
                  className="input-field"
                  value={info.companyWebsite}
                  onChange={(e) => setInfo({ ...info, companyWebsite: e.target.value })}
                />
              </div>
            </div>
          </div>
        </details>

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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      {info.validUntil} <span className="text-xs">(+15 business days)</span>
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
          <div className="hidden md:grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 px-2 bg-blue-500 text-white py-2 rounded-t">
            <div className="col-span-6">DESCRIPTION</div>
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
                {/* Description */}
                <div className="md:col-span-6">
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
                    className="input-field text-center"
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
              <div className="flex items-center gap-4 bg-blue-500 text-white px-4 py-2 rounded-lg mt-2">
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
    </div>
  )
}

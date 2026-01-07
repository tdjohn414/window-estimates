'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'

interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  lineTotal: number
}

interface EstimateInfo {
  companyName: string
  companyAddress: string
  companyPhone: string
  customerName: string
  customerAddress: string
  customerPhone: string
  estimateNumber: string
  estimateDate: string
  notes: string
}

const UNITS = ['ea', 'sq ft', 'ln ft', 'hr', 'day', 'lot', 'sq', 'bundle']

export default function HomePage() {
  const { theme, toggleTheme } = useTheme()
  
  const [info, setInfo] = useState<EstimateInfo>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    estimateNumber: `EST-${Date.now().toString().slice(-6)}`,
    estimateDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'ea', unitPrice: 0, lineTotal: 0 }
  ])

  const [generating, setGenerating] = useState(false)

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit: 'ea', unitPrice: 0, lineTotal: 0 }
    ])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id !== id) return item
        
        const updated = { ...item, [field]: value }
        
        // Recalculate line total when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.lineTotal = Number(updated.quantity) * Number(updated.unitPrice)
        }
        
        return updated
      })
    )
  }

  const deleteLineItem = (id: string) => {
    if (lineItems.length === 1) {
      // Keep at least one line item, just clear it
      setLineItems([{ id: crypto.randomUUID(), description: '', quantity: 1, unit: 'ea', unitPrice: 0, lineTotal: 0 }])
    } else {
      setLineItems(items => items.filter(item => item.id !== id))
    }
  }

  const grandTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0)

  const generatePDF = async () => {
    setGenerating(true)
    
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 20

      // Header - Company Info
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(info.companyName || 'Your Company', 20, y)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      y += 8
      if (info.companyAddress) {
        doc.text(info.companyAddress, 20, y)
        y += 5
      }
      if (info.companyPhone) {
        doc.text(info.companyPhone, 20, y)
        y += 5
      }

      // Estimate title and number
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('ESTIMATE', pageWidth - 20, 25, { align: 'right' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`#${info.estimateNumber}`, pageWidth - 20, 33, { align: 'right' })
      doc.text(`Date: ${info.estimateDate}`, pageWidth - 20, 40, { align: 'right' })

      // Divider line
      y = 55
      doc.setDrawColor(200, 200, 200)
      doc.line(20, y, pageWidth - 20, y)
      y += 10

      // Bill To section
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('BILL TO:', 20, y)
      
      doc.setFont('helvetica', 'normal')
      y += 6
      if (info.customerName) {
        doc.text(info.customerName, 20, y)
        y += 5
      }
      if (info.customerAddress) {
        doc.text(info.customerAddress, 20, y)
        y += 5
      }
      if (info.customerPhone) {
        doc.text(info.customerPhone, 20, y)
        y += 5
      }

      y += 10

      // Line Items Table
      const tableData = lineItems
        .filter(item => item.description.trim() !== '')
        .map(item => [
          item.description,
          item.quantity.toString(),
          item.unit,
          `$${item.unitPrice.toFixed(2)}`,
          `$${item.lineTotal.toFixed(2)}`
        ])

      autoTable(doc, {
        startY: y,
        head: [['Description', 'Qty', 'Unit', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: 20, right: 20 },
      })

      // Grand Total
      const finalY = (doc as any).lastAutoTable.finalY + 10
      
      doc.setFillColor(240, 240, 240)
      doc.rect(pageWidth - 80, finalY, 60, 12, 'F')
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('GRAND TOTAL:', pageWidth - 78, finalY + 8)
      doc.text(`$${grandTotal.toFixed(2)}`, pageWidth - 22, finalY + 8, { align: 'right' })

      // Notes
      if (info.notes.trim()) {
        const notesY = finalY + 25
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text('Notes:', 20, notesY)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const splitNotes = doc.splitTextToSize(info.notes, pageWidth - 40)
        doc.text(splitNotes, 20, notesY + 6)
      }

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        'Thank you for your business!',
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      )

      // Save PDF
      doc.save(`Estimate_${info.estimateNumber}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF')
    } finally {
      setGenerating(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Estimate Generator
        </h1>

        {/* Company & Customer Info */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Company</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Company Name"
                  className="input-field"
                  value={info.companyName}
                  onChange={(e) => setInfo({ ...info, companyName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="input-field"
                  value={info.companyAddress}
                  onChange={(e) => setInfo({ ...info, companyAddress: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="input-field"
                  value={info.companyPhone}
                  onChange={(e) => setInfo({ ...info, companyPhone: e.target.value })}
                />
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="input-field"
                  value={info.customerName}
                  onChange={(e) => setInfo({ ...info, customerName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Address"
                  className="input-field"
                  value={info.customerAddress}
                  onChange={(e) => setInfo({ ...info, customerAddress: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="input-field"
                  value={info.customerPhone}
                  onChange={(e) => setInfo({ ...info, customerPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Estimate Number & Date */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimate #
              </label>
              <input
                type="text"
                className="input-field"
                value={info.estimateNumber}
                onChange={(e) => setInfo({ ...info, estimateNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                className="input-field"
                value={info.estimateDate}
                onChange={(e) => setInfo({ ...info, estimateDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h2>
            <button onClick={addLineItem} className="btn-primary">
              + Add Line Item
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400 px-2">
            <div className="col-span-5">Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-center">Unit</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                {/* Description */}
                <div className="md:col-span-5">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Description</label>
                  <input
                    type="text"
                    placeholder="Description"
                    className="input-field"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-1">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input-field text-center"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Unit */}
                <div className="md:col-span-2">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400">Unit</label>
                  <select
                    className="input-field text-center"
                    value={item.unit}
                    onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
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
                    />
                  </div>
                </div>

                {/* Line Total */}
                <div className="md:col-span-1 flex items-center justify-end">
                  <label className="md:hidden text-xs text-gray-500 dark:text-gray-400 mr-2">Total:</label>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${item.lineTotal.toFixed(2)}
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

          {/* Grand Total */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-end items-center gap-4">
              <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">Grand Total:</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notes</h2>
          <textarea
            placeholder="Add any notes or terms..."
            className="input-field h-24 resize-none"
            value={info.notes}
            onChange={(e) => setInfo({ ...info, notes: e.target.value })}
          />
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

        {/* Item Count */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          {lineItems.filter(i => i.description.trim()).length} item(s) • {lineItems.length} row(s)
        </p>
      </div>
    </div>
  )
}

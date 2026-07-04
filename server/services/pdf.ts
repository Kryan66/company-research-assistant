import { jsPDF } from 'jspdf'
import type { CompanyResearch } from '../types/index.js'

/**
 * Generate a professional PDF report from research data.
 * Uses jsPDF with clean typography, section headers, and dividers.
 */
export function generatePDFReport(research: CompanyResearch): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
    }
  }

  const drawDivider = () => {
    y += 4
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
  }

  // Header
  doc.setFillColor(30, 41, 59)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Company Research Report', margin, 18)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 28)
  y = 45

  doc.setTextColor(30, 41, 59)

  // Company Information section
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Company Information', margin, y)
  y += 10
  drawDivider()

  const addField = (label: string, value: string) => {
    addPageIfNeeded(12)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(value, contentWidth - 40)
    doc.text(lines, margin + 40, y)
    y += Math.max(lines.length * 5, 7)
  }

  addField('Name:', research.companyName)
  addField('Website:', research.website)
  if (research.phoneNumber) addField('Phone:', research.phoneNumber)
  if (research.address) addField('Address:', research.address)

  y += 4
  addPageIfNeeded(20)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const summaryLines = doc.splitTextToSize(research.summary, contentWidth)
  doc.text(summaryLines, margin, y)
  y += summaryLines.length * 5 + 8

  // Products & Services
  drawDivider()
  addPageIfNeeded(20)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Products & Services', margin, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  for (const item of research.productsServices) {
    addPageIfNeeded(8)
    doc.text(`• ${item}`, margin + 4, y)
    y += 6
  }
  y += 4

  // Pain Points
  drawDivider()
  addPageIfNeeded(20)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('AI-Identified Pain Points', margin, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  for (const point of research.painPoints) {
    addPageIfNeeded(12)
    const lines = doc.splitTextToSize(`• ${point}`, contentWidth - 4)
    doc.text(lines, margin + 4, y)
    y += lines.length * 5 + 2
  }
  y += 4

  // Competitors
  if (research.competitors.length > 0) {
    drawDivider()
    addPageIfNeeded(20)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Competitor Analysis', margin, y)
    y += 10

    for (const comp of research.competitors) {
      addPageIfNeeded(20)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(comp.name, margin, y)
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(37, 99, 235)
      doc.text(comp.website, margin + 4, y)
      doc.setTextColor(30, 41, 59)
      y += 6
      if (comp.reasoning) {
        const reasonLines = doc.splitTextToSize(comp.reasoning, contentWidth - 4)
        doc.text(reasonLines, margin + 4, y)
        y += reasonLines.length * 5 + 4
      }
      y += 4
    }
  }

  // Footer on last page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Company Research Assistant — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface TicketData {
  pnr: string
  trainNumber: string
  trainName: string
  from: string
  to: string
  fromStation: string
  toStation: string
  date: string
  departure: string
  arrival: string
  class: string
  passengers: Array<{
    name: string
    age: string
    gender: string
    seatNumber: string
  }>
  amount: number
  bookingDate: string
}

export const generateTicketPDF = async (ticketData: TicketData): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Colors
  const primaryColor = '#1e40af'
  const secondaryColor = '#3b82f6'
  const textColor = '#374151'
  const lightGray = '#f3f4f6'

  // Header
  pdf.setFillColor(primaryColor)
  pdf.rect(0, 0, pageWidth, 25, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('RailConnect', 15, 15)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Indian Railway E-Ticket', pageWidth - 15, 15, { align: 'right' })

  // PNR Section
  pdf.setFillColor(lightGray)
  pdf.rect(15, 35, pageWidth - 30, 20, 'F')
  
  pdf.setTextColor(textColor)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PNR: ' + ticketData.pnr, 20, 48)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Booking Date: ' + new Date(ticketData.bookingDate).toLocaleDateString(), pageWidth - 20, 48, { align: 'right' })

  // Train Details
  let yPos = 70
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Train Details', 15, yPos)
  
  yPos += 10
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`${ticketData.trainName} (${ticketData.trainNumber})`, 15, yPos)
  
  yPos += 8
  pdf.text(`From: ${ticketData.fromStation} (${ticketData.from})`, 15, yPos)
  pdf.text(`To: ${ticketData.toStation} (${ticketData.to})`, pageWidth / 2, yPos)
  
  yPos += 8
  pdf.text(`Date: ${new Date(ticketData.date).toLocaleDateString()}`, 15, yPos)
  pdf.text(`Class: ${ticketData.class}`, pageWidth / 2, yPos)
  
  yPos += 8
  pdf.text(`Departure: ${ticketData.departure}`, 15, yPos)
  pdf.text(`Arrival: ${ticketData.arrival}`, pageWidth / 2, yPos)

  // Passenger Details
  yPos += 20
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Passenger Details', 15, yPos)
  
  yPos += 10
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  
  // Table headers
  pdf.setFillColor(secondaryColor)
  pdf.rect(15, yPos - 5, pageWidth - 30, 8, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Name', 20, yPos)
  pdf.text('Age', 80, yPos)
  pdf.text('Gender', 100, yPos)
  pdf.text('Seat', 130, yPos)
  
  yPos += 8
  pdf.setTextColor(textColor)
  pdf.setFont('helvetica', 'normal')
  
  ticketData.passengers.forEach((passenger, index) => {
    if (yPos > pageHeight - 30) {
      pdf.addPage()
      yPos = 20
    }
    
    pdf.text(passenger.name, 20, yPos)
    pdf.text(passenger.age, 80, yPos)
    pdf.text(passenger.gender, 100, yPos)
    pdf.text(passenger.seatNumber || 'TBD', 130, yPos)
    yPos += 6
  })

  // Footer
  yPos = pageHeight - 30
  pdf.setDrawColor(primaryColor)
  pdf.line(15, yPos, pageWidth - 15, yPos)
  
  yPos += 10
  pdf.setFontSize(10)
  pdf.setTextColor(textColor)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Total Amount: ₹' + ticketData.amount, 15, yPos)
  pdf.text('Thank you for choosing RailConnect!', pageWidth - 15, yPos, { align: 'right' })

  // Save the PDF
  pdf.save(`ticket-${ticketData.pnr}.pdf`)
}

export const generateTicketHTML = (ticketData: TicketData): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white;">
      <!-- Header -->
      <div style="background: #1e40af; color: white; padding: 20px; text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">RailConnect</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Indian Railway E-Ticket</p>
      </div>

      <!-- PNR Section -->
      <div style="background: #f3f4f6; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; color: #1e40af; font-size: 18px;">PNR: ${ticketData.pnr}</h2>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Booking Date: ${new Date(ticketData.bookingDate).toLocaleDateString()}</p>
        </div>
      </div>

      <!-- Train Details -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af; margin-bottom: 10px;">Train Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p><strong>Train:</strong> ${ticketData.trainName} (${ticketData.trainNumber})</p>
            <p><strong>From:</strong> ${ticketData.fromStation} (${ticketData.from})</p>
            <p><strong>To:</strong> ${ticketData.toStation} (${ticketData.to})</p>
          </div>
          <div>
            <p><strong>Date:</strong> ${new Date(ticketData.date).toLocaleDateString()}</p>
            <p><strong>Class:</strong> ${ticketData.class}</p>
            <p><strong>Departure:</strong> ${ticketData.departure} | <strong>Arrival:</strong> ${ticketData.arrival}</p>
          </div>
        </div>
      </div>

      <!-- Passenger Details -->
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af; margin-bottom: 10px;">Passenger Details</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
          <thead>
            <tr style="background: #3b82f6; color: white;">
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Name</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Age</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Gender</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db;">Seat</th>
            </tr>
          </thead>
          <tbody>
            ${ticketData.passengers.map(passenger => `
              <tr>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${passenger.name}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${passenger.age}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${passenger.gender}</td>
                <td style="padding: 10px; border: 1px solid #d1d5db;">${passenger.seatNumber || 'TBD'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="border-top: 2px solid #1e40af; padding-top: 15px; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          <strong>Total Amount: ₹${ticketData.amount}</strong>
        </p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
          Thank you for choosing RailConnect!
        </p>
      </div>
    </div>
  `
}

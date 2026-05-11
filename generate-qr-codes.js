// QR Code Generator Script
// Save this as generate-qr-codes.js in the project root

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Create qr-codes directory if it doesn't exist
const qrDir = path.join(__dirname, 'qr-codes');
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir);
}

// Sample employees (replace with actual data)
const employees = [
  { employeeId: 'EMP001', name: 'John Doe' },
  { employeeId: 'EMP002', name: 'Jane Smith' },
  { employeeId: 'EMP003', name: 'Bob Johnson' },
  { employeeId: 'EMP004', name: 'Alice Williams' },
  { employeeId: 'EMP005', name: 'Charlie Brown' }
];

// Generate QR codes for each employee
async function generateQRCodes() {
  console.log('Generating QR codes...\n');

  for (const employee of employees) {
    try {
      // Generate QR code with employee ID
      const qrPath = path.join(qrDir, `${employee.employeeId}.png`);
      
      await QRCode.toFile(qrPath, employee.employeeId, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log(`✓ Generated QR code for ${employee.employeeId} (${employee.name})`);
    } catch (err) {
      console.error(`✗ Error generating QR for ${employee.employeeId}:`, err.message);
    }
  }

  console.log('\n✓ All QR codes generated successfully!');
  console.log(`Location: ${qrDir}`);
}

// Run
generateQRCodes().catch(console.error);

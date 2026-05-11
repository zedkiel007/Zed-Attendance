# Digital Attendance System 📋

A complete QR code-based attendance tracking system with real-time recording and reporting.

## Features ✨

- **QR Code Scanning**: Scan employee ID QR codes for quick attendance recording
- **Manual Entry**: Fall back to manual employee ID entry if needed
- **Time In/Out**: Automatic timestamp recording for clock-in and clock-out
- **Employee Management**: Register and manage employee information
- **Daily Summary**: View today's attendance at a glance
- **Attendance History**: Track attendance over date ranges
- **Export Reports**: Generate CSV reports for payroll and audit purposes
- **Auto-Recording**: Automatic database recording with timestamps
- **Responsive Design**: Works on desktop and mobile devices

## Installation 🚀

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Setup Steps

1. **Navigate to the project directory**:
   ```bash
   cd "c:\Zed Digital Attendance"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open in browser**:
   ```
   http://localhost:3000
   ```

## Usage Guide 📖

### 1. Register Employees
- Go to "Register Employee" tab
- Fill in Employee ID, Full Name, and Department
- Click "Register Employee"
- View all registered employees below

### 2. Record Attendance

**Option A: QR Code Scanning**
- Go to "QR Scanner" tab
- Click "Start Camera"
- Point camera at employee's QR code
- Attendance is automatically recorded
- Camera restarts after 3 seconds for next scan

**Option B: Manual Entry**
- Go to "QR Scanner" tab
- Enter Employee ID manually
- Select "Time In" or "Time Out"
- Click "Record Attendance"

### 3. View Daily Summary
- Go to "Daily Summary" tab
- Click "Refresh Summary"
- See all employees present/absent today
- Shows time in and time out for each employee

### 4. View Attendance History
- Go to "Attendance History" tab
- Select start and end dates
- Click "Filter"
- View attendance records for the selected period
- Click "Export Report" to download as CSV

## Data Storage 💾

All attendance data is automatically saved to `attendance-data.json`:
- Employee information
- Attendance records with timestamps
- Date tracking for daily summaries

## API Endpoints 🔌

### Employee Management
- `POST /api/employees` - Register new employee
- `GET /api/employees` - Get all employees

### Attendance Recording
- `POST /api/attendance` - Record time in/out
- `GET /api/attendance/today` - Get today's records
- `GET /api/attendance/range` - Get records by date range
- `GET /api/attendance/summary` - Get today's summary
- `GET /api/attendance/export` - Export as CSV

## QR Code Format 📲

Generate QR codes containing:

**Simple Format (Employee ID)**:
```
EMP001
```

**JSON Format**:
```json
{"employeeId": "EMP001"}
```

### Generating QR Codes
Use any QR code generator:
- Online: qr-code-generator.com
- Python: `pip install qrcode`
- Node.js: `npm install qrcode`

Example QR generation (Node.js):
```javascript
const QRCode = require('qrcode');
QRCode.toFile('./qr-code.png', 'EMP001', (err) => {
  if (err) throw err;
  console.log('QR code generated');
});
```

## File Structure 📁

```
Zed Digital Attendance/
├── server.js                    # Express server & API
├── package.json                 # Dependencies
├── attendance-data.json         # Data storage
└── public/
    ├── index.html               # Main interface
    ├── styles.css               # Styling
    └── script.js                # Frontend logic
```

## Browser Requirements 🌐

- Modern browser with webcam access
- Camera permissions enabled
- JavaScript enabled
- Recommended: Chrome, Firefox, Edge, Safari

## Tips & Tricks 💡

1. **Quick Setup**: Pre-register all employees before the workday starts
2. **QR Codes**: Print employee QR codes and place them at office entrances
3. **Mobile Friendly**: Works on phones - great for on-the-go attendance
4. **Backup**: Regular backup your `attendance-data.json` file
5. **Reports**: Export daily/weekly reports for payroll processing

## Troubleshooting 🔧

**Camera not starting?**
- Check browser permissions for camera access
- Ensure camera is not in use by another application
- Try refreshing the page

**QR Code not scanning?**
- Ensure good lighting
- Keep QR code at center of frame
- Try manual entry option

**Data not saving?**
- Check that server is running
- Verify network connectivity
- Check file permissions for `attendance-data.json`

## Default Behavior ⚙️

- Records are auto-saved to JSON file
- Timestamps are in local timezone
- Daily summary resets at midnight
- Camera auto-restarts after each scan

## Security Notes 🔒

- This is a local system - not for public internet
- Keep `attendance-data.json` backed up regularly
- Consider adding authentication for production use
- Restrict access to admin functions as needed

## Support & Updates 📧

For updates and improvements, maintain regular backups of:
- `attendance-data.json`
- Employee QR codes

---

**Version**: 1.0.0  
**Last Updated**: April 29, 2026  
**License**: ISC

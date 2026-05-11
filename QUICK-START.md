# Quick Start Guide 🚀

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd "c:\Zed Digital Attendance"
npm install
```

### Step 2: Start the Server
```bash
npm start
```

You should see:
```
Digital Attendance System running on http://localhost:3000
Scan QR codes to record attendance
```

### Step 3: Open in Browser
```
http://localhost:3000
```

---

## Basic Workflow

### Day 1: Employee Registration

1. **Open the application** → Go to "Register Employee" tab
2. **Register employees**:
   - Employee ID: `EMP001`
   - Name: `John Doe`
   - Department: `IT`
   - Click "Register Employee"
3. **Repeat** for all employees

### Day 2: Create QR Codes (Optional)

If you want to use QR code scanning:

```bash
npm install qrcode
node generate-qr-codes.js
```

This creates QR codes in `qr-codes` folder (one per employee).

Print the QR codes and place them at office entrance or employee desks.

### Day 3+: Daily Operation

**Morning - Time In:**
1. Go to "QR Scanner" tab
2. Click "Start Camera"
3. Employees scan their QR code or manually enter ID
4. System records time automatically ✓

**Evening - Time Out:**
1. Go to "QR Scanner" tab
2. Click "Start Camera"
3. Employees scan QR code or enter ID
4. Select "Time Out"
5. System records time automatically ✓

**View Daily Report:**
1. Go to "Daily Summary" tab
2. Click "Refresh Summary"
3. See all employees and their status

---

## Manual Entry Option (No QR Codes Needed)

If you don't want to use QR codes:

1. Go to "QR Scanner" tab
2. Scroll to "Or Enter Manually"
3. Type Employee ID (e.g., `EMP001`)
4. Select "Time In" or "Time Out"
5. Click "Record Attendance"

---

## Features at a Glance

| Feature | Tab | Description |
|---------|-----|-------------|
| **QR Scanning** | QR Scanner | Scan QR codes for instant recording |
| **Manual Entry** | QR Scanner | Type Employee ID manually |
| **Registration** | Register Employee | Add new employees |
| **Daily View** | Daily Summary | See who's in/out today |
| **History** | Attendance History | View past records |
| **Export** | Attendance History | Download CSV reports |

---

## Sample Employee IDs to Start

You can use these for testing:
- EMP001
- EMP002
- EMP003
- EMP004
- EMP005

---

## Common Tasks

### Export Today's Report
1. Go to "Daily Summary" tab
2. Click "Export Today's Report"
3. CSV file downloads automatically

### Find Attendance for a Date Range
1. Go to "Attendance History" tab
2. Select start date and end date
3. Click "Filter"
4. Results appear in table
5. Click "Export Report" to download

### Delete an Employee Record
Currently, records are auto-saved to `attendance-data.json`. To delete:
1. Stop the server
2. Edit `attendance-data.json`
3. Find and remove the employee record
4. Restart the server

---

## Keyboard Shortcuts

- **Tab**: Navigate between input fields
- **Enter**: Submit forms
- **Esc**: Close notifications (if added)

---

## Tips for Success

✅ **Do:**
- Register all employees first
- Test QR scanner before first use
- Export reports daily for backup
- Keep camera clean for better scanning
- Use good lighting for QR scanning

❌ **Don't:**
- Leave server running without supervision
- Manually edit JSON file while server runs
- Delete `attendance-data.json` accidentally
- Use outdated QR codes

---

## Troubleshooting Quick Fixes

**Problem**: "Camera access denied"
- **Fix**: Check browser permissions and refresh page

**Problem**: "Employee not found"
- **Fix**: Register the employee first in Register tab

**Problem**: "QR code won't scan"
- **Fix**: Check lighting, hold steady, try manual entry

**Problem**: "Data not saved"
- **Fix**: Ensure server is running, check network

---

## Getting Help

1. Check README.md for full documentation
2. Verify server is running on port 3000
3. Try refreshing the browser
4. Check browser console for errors (F12)
5. Restart the server

---

## Next Steps

- 📱 Set up QR codes for employees
- 📋 Create employee database
- 🖨️ Print QR code labels
- 📊 Set up daily export routine
- 🔒 Consider adding password protection

---

**Ready to go!** Start registering employees and scanning QR codes! 🎉

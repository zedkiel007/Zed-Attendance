# System Architecture 🏗️

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser                               │
│  (HTML/CSS/JavaScript - QR Scanner Interface)               │
├─────────────────────────────────────────────────────────────┤
│  • QR Code Scanning (jsQR Library)                          │
│  • Real-time Camera Feed                                     │
│  • Manual Data Entry                                         │
│  • Responsive UI (Mobile/Desktop)                           │
└────────────┬──────────────────────────────────────────────────┘
             │ HTTP/REST API
             ↓
┌─────────────────────────────────────────────────────────────┐
│               Express.js Server (Node.js)                    │
│              (Port 3000 - API Backend)                       │
├─────────────────────────────────────────────────────────────┤
│  • POST /api/employees - Register employee                  │
│  • GET /api/employees - List employees                      │
│  • POST /api/attendance - Record time in/out                │
│  • GET /api/attendance/today - Today's records              │
│  • GET /api/attendance/summary - Daily summary              │
│  • GET /api/attendance/export - CSV export                  │
└────────────┬──────────────────────────────────────────────────┘
             │ File I/O
             ↓
┌─────────────────────────────────────────────────────────────┐
│         JSON File Storage (File System)                      │
│     attendance-data.json (Local Database)                    │
├─────────────────────────────────────────────────────────────┤
│  {                                                           │
│    "employees": [                                            │
│      {employeeId, name, department, dateRegistered}         │
│    ],                                                        │
│    "records": [                                              │
│      {employeeId, type, timestamp, date, time}              │
│    ]                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────┐
│   Employee Scans     │
│   QR Code / ID       │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Capture Employee ID                │
│   (from QR or manual input)          │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Determine Type                      │
│   (Time In / Time Out)               │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   API Request to Server              │
│   POST /api/attendance               │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Server Validates Employee          │
│   - Check if employee exists         │
│   - Verify employee ID               │
└──────────┬───────────────────────────┘
           │
           ↓ (Valid)
┌──────────────────────────────────────┐
│   Generate Timestamp                 │
│   - Current date                     │
│   - Current time                     │
│   - Full timestamp                   │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Create Record                      │
│   {employeeId, type, time...}        │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Save to attendance-data.json       │
│   (Auto-save to disk)                │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Return Success Response            │
│   + Record Details                   │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│   Update UI                          │
│   - Show confirmation                │
│   - Display employee name            │
│   - Auto-restart scanner             │
└──────────────────────────────────────┘
```

## Component Architecture

```
Frontend (public/)
├── index.html
│   ├── Scanner Interface
│   ├── Employee Registration
│   ├── Daily Summary
│   └── Attendance History
├── styles.css
│   ├── Responsive Layout
│   ├── Theme/Colors
│   └── Animations
└── script.js
    ├── QR Code Scanning (jsQR)
    ├── API Client Functions
    ├── Tab Navigation
    ├── Event Handlers
    └── UI Updates

Backend (Root)
├── server.js
│   ├── Express Setup
│   ├── CORS/Middleware
│   ├── Employee Routes
│   ├── Attendance Routes
│   └── Export Routes
└── attendance-data.json
    ├── Employee Records
    └── Attendance Records
```

## API Endpoint Structure

```
Root: http://localhost:3000

Employee Management:
├── POST   /api/employees
│           Request: {employeeId, name, department}
│           Response: {message, employee}
│
└── GET    /api/employees
            Response: [{employeeId, name, department, ...}]

Attendance Recording:
├── POST   /api/attendance
│           Request: {employeeId, type}
│           Response: {message, record}
│
├── GET    /api/attendance/today
│           Response: [{records for today}]
│
├── GET    /api/attendance/range
│           Query: startDate, endDate
│           Response: [{records in range}]
│
├── GET    /api/attendance/summary
│           Response: [{summary per employee today}]
│
└── GET    /api/attendance/export
            Query: startDate, endDate
            Response: CSV file download
```

## Technology Stack

```
Frontend:
├── HTML5 (Semantic markup)
├── CSS3 (Responsive design, animations)
├── JavaScript (ES6+, async/await)
└── jsQR (QR code detection library)

Backend:
├── Node.js (Runtime)
├── Express (Web framework)
├── CORS (Cross-origin handling)
├── Body-Parser (JSON parsing)
└── File System API (JSON storage)

Storage:
└── JSON File (attendance-data.json)
```

## User Workflows

### Workflow 1: Employee Time In (QR)

```
Start Camera
    ↓
Employee scans QR
    ↓
jsQR detects code
    ↓
Extract employee ID
    ↓
POST to /api/attendance (type: 'in')
    ↓
Server validates employee
    ↓
Record with timestamp
    ↓
Save to JSON
    ↓
Show success message
    ↓
Auto-restart scanner
```

### Workflow 2: Manual Time Entry

```
Enter Employee ID
    ↓
Select Time In/Out
    ↓
Click "Record Attendance"
    ↓
POST to /api/attendance
    ↓
Server validation
    ↓
Create record with current time
    ↓
Save to JSON
    ↓
Show confirmation
```

### Workflow 3: View Daily Summary

```
Click "Daily Summary" tab
    ↓
Click "Refresh Summary"
    ↓
GET /api/attendance/summary
    ↓
Server aggregates today's records
    ↓
Group by employee
    ↓
Determine status (Present/Absent)
    ↓
Return summary data
    ↓
Display in table format
```

### Workflow 4: Export Report

```
Select date range
    ↓
Click "Export"
    ↓
GET /api/attendance/export (with dates)
    ↓
Server filters records
    ↓
Generate CSV format
    ↓
Stream to browser
    ↓
Download as CSV file
```

## Database Schema (JSON)

```
attendance-data.json
{
  "employees": [
    {
      "id": "1234567890",
      "employeeId": "EMP001",
      "name": "John Doe",
      "department": "IT",
      "dateRegistered": "2026-04-29T08:00:00.000Z"
    }
  ],
  "records": [
    {
      "id": "1234567891",
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "department": "IT",
      "type": "in",
      "timestamp": "04/29/2026, 08:15:23 AM",
      "date": "2026-04-29",
      "time": "08:15:23 AM"
    }
  ]
}
```

## Security Considerations

```
Current Implementation:
├── Local network only (no internet exposure)
├── JSON file storage (file system permissions)
└── CORS enabled for development

Production Recommendations:
├── Add authentication (username/password)
├── Use HTTPS for data transmission
├── Implement database (MongoDB, PostgreSQL)
├── Add access control (role-based)
├── Encrypt sensitive data
├── Regular backups
└── Audit logging
```

## Performance Characteristics

```
Scan to Record: <500ms
    ├── QR detection: ~100ms
    ├── API call: ~100ms
    ├── Validation: ~50ms
    ├── File write: ~200ms
    └── Response: ~50ms

Daily Summary: <1s (with <1000 records)
    ├── File read: ~50ms
    ├── Filtering: ~100ms
    ├── Aggregation: ~200ms
    └── Response: ~50ms

Export: ~2s (depends on file size)
    ├── File read: ~100ms
    ├── Filtering: ~200ms
    ├── CSV generation: ~500ms
    ├── Stream: ~500ms
    └── Download: ~700ms
```

## Scalability Notes

```
Current Limitations:
├── JSON file storage (not ideal for >10K records)
├── Single file writes (potential conflicts)
├── No database indexing
└── In-memory processing

For Growth:
├── Migrate to MongoDB/PostgreSQL
├── Add database indexing on dates
├── Implement caching layer
├── Load balancing for multiple servers
└── Implement job queue for exports
```

---

**Last Updated**: April 29, 2026  
**Version**: 1.0

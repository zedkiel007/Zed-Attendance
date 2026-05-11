const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Attendance data file
const attendanceFile = path.join(__dirname, 'attendance-data.json');

// Initialize attendance data if file doesn't exist
if (!fs.existsSync(attendanceFile)) {
  fs.writeFileSync(attendanceFile, JSON.stringify({ records: [], employees: [] }, null, 2));
}

// Helper function to read attendance data
function readAttendanceData() {
  const data = fs.readFileSync(attendanceFile, 'utf-8');
  return JSON.parse(data);
}

// Helper function to write attendance data
function writeAttendanceData(data) {
  fs.writeFileSync(attendanceFile, JSON.stringify(data, null, 2));
}

function parseRecordDate(record) {
  if (!record) return new Date();
  if (record.isoTimestamp) {
    const parsed = new Date(record.isoTimestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (record.timestamp) {
    const parsed = new Date(record.timestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const fallback = new Date(`${record.date} ${record.time}`);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

// Helper function to format time
function getCurrentTimestamp() {
  return new Date().toLocaleString('en-US', { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// API: Register Employee
app.post('/api/employees', (req, res) => {
  const { employeeId, name, department } = req.body;

  if (!employeeId || !name) {
    return res.status(400).json({ error: 'Employee ID and name are required' });
  }

  const data = readAttendanceData();
  
  // Check if employee already exists
  if (data.employees.find(emp => emp.employeeId === employeeId)) {
    return res.status(400).json({ error: 'Employee already registered' });
  }

  const employee = {
    id: Date.now().toString(),
    employeeId,
    name,
    department: department || 'General',
    status: 'Active',
    dateRegistered: new Date().toISOString()
  };

  data.employees.push(employee);
  writeAttendanceData(data);

  res.status(201).json({ 
    message: 'Employee registered successfully',
    employee 
  });
});

// API: Get all employees
app.get('/api/employees', (req, res) => {
  const data = readAttendanceData();
  res.json(data.employees);
});

// API: Update employee details
app.patch('/api/employees/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const { employeeId: newEmployeeId, name, department, status } = req.body;
  const data = readAttendanceData();
  const employee = data.employees.find(emp => emp.employeeId === employeeId);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const previousStatus = employee.status;
  const now = new Date();
  const firedRecord = {
    id: Date.now().toString(),
    employeeId: employee.employeeId,
    employeeName: employee.name,
    department: employee.department,
    type: 'fired',
    timestamp: getCurrentTimestamp(),
    isoTimestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    note: 'Employee fired'
  };

  if (newEmployeeId && newEmployeeId !== employeeId) {
    if (data.employees.find(emp => emp.employeeId === newEmployeeId)) {
      return res.status(400).json({ error: 'New employee ID already in use' });
    }
    data.records.forEach(record => {
      if (record.employeeId === employeeId) {
        record.employeeId = newEmployeeId;
      }
    });
    employee.employeeId = newEmployeeId;
  }

  if (name) {
    data.records.forEach(record => {
      if (record.employeeId === employee.employeeId) {
        record.employeeName = name;
      }
    });
    employee.name = name;
  }

  if (department) {
    data.records.forEach(record => {
      if (record.employeeId === employee.employeeId) {
        record.department = department;
      }
    });
    employee.department = department;
  }

  if (status) employee.status = status;

  if (status === 'Fired' && previousStatus !== 'Fired') {
    data.records.push(firedRecord);
  }

  writeAttendanceData(data);
  res.json({ message: 'Employee updated successfully', employee });
});

// API: Delete employee
app.delete('/api/employees/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const data = readAttendanceData();
  const index = data.employees.findIndex(emp => emp.employeeId === employeeId);

  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  data.employees.splice(index, 1);
  writeAttendanceData(data);

  res.json({ message: 'Employee deleted successfully' });
});

// API: Record Time In/Out
app.post('/api/attendance', (req, res) => {
  const { employeeId, type } = req.body; // type: 'in' or 'out'

  if (!employeeId || !type) {
    return res.status(400).json({ error: 'Employee ID and type (in/out) are required' });
  }

  if (!['in', 'out'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "in" or "out"' });
  }

  const data = readAttendanceData();
  
  // Find employee
  const employee = data.employees.find(emp => emp.employeeId === employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  // Create attendance record
  const now = new Date();
  const record = {
    id: Date.now().toString(),
    employeeId,
    employeeName: employee.name,
    department: employee.department,
    type,
    timestamp: getCurrentTimestamp(),
    isoTimestamp: now.toISOString(),
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  data.records.push(record);
  writeAttendanceData(data);

  res.status(201).json({ 
    message: `Time ${type} recorded successfully`,
    record 
  });
});

// API: Get today's attendance
app.get('/api/attendance/today', (req, res) => {
  const data = readAttendanceData();
  const today = new Date().toISOString().split('T')[0];
  
  const todayRecords = data.records.filter(record => record.date === today);
  res.json(todayRecords);
});

// API: Get attendance by date range (grouped daily records)
app.get('/api/attendance/range', (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  const data = readAttendanceData();
  const filtered = data.records.filter(record => {
    return record.date >= startDate && record.date <= endDate;
  });

  const dailyMap = {};

  filtered.forEach(record => {
    const key = `${record.employeeId}:${record.date}`;
    if (!dailyMap[key]) {
      dailyMap[key] = {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        department: record.department,
        date: record.date,
        timeIn: null,
        timeOut: null,
        timeInId: null,
        timeOutId: null
      };
    }

    const entry = dailyMap[key];
    const recordDate = parseRecordDate(record);

    if (record.type === 'in') {
      if (!entry.timeInId || recordDate < parseRecordDate(data.records.find(r => r.id === entry.timeInId))) {
        entry.timeIn = record.time;
        entry.timeInId = record.id;
      }
    } else if (record.type === 'out') {
      if (!entry.timeOutId || recordDate > parseRecordDate(data.records.find(r => r.id === entry.timeOutId))) {
        entry.timeOut = record.time;
        entry.timeOutId = record.id;
      }
    }
  });

  const grouped = Object.values(dailyMap).map(entry => {
    const inRecord = data.records.find(r => r.id === entry.timeInId);
    const outRecord = data.records.find(r => r.id === entry.timeOutId);
    const start = inRecord ? parseRecordDate(inRecord) : null;
    const end = outRecord ? parseRecordDate(outRecord) : null;
    let duration = '-';

    if (start) {
      const finish = end || new Date();
      const durationHours = Math.max(0, (finish - start) / (1000 * 60 * 60));
      duration = `${Math.round(durationHours * 100) / 100}h`;
    }

    const ids = [];
    if (entry.timeInId) ids.push(entry.timeInId);
    if (entry.timeOutId && !ids.includes(entry.timeOutId)) ids.push(entry.timeOutId);

    return {
      ...entry,
      timeIn: entry.timeIn || '-',
      timeOut: entry.timeOut || '-',
      duration,
      ids
    };
  });

  res.json(grouped);
});

// API: Delete attendance records
app.delete('/api/attendance', (req, res) => {
  const { ids, startDate, endDate, date, employeeId } = req.query;
  const data = readAttendanceData();

  let deletedCount = 0;
  let filteredRecords = data.records;

  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    filteredRecords = filteredRecords.filter(record => {
      if (idList.includes(record.id)) {
        deletedCount += 1;
        return false;
      }
      return true;
    });
  } else if (startDate && endDate) {
    filteredRecords = filteredRecords.filter(record => {
      if (record.date >= startDate && record.date <= endDate) {
        deletedCount += 1;
        return false;
      }
      return true;
    });
  } else if (date) {
    filteredRecords = filteredRecords.filter(record => {
      if (record.date === date && (!employeeId || record.employeeId === employeeId)) {
        deletedCount += 1;
        return false;
      }
      return true;
    });
  } else {
    return res.status(400).json({ error: 'Please provide ids, date, or startDate and endDate to delete attendance records' });
  }

  data.records = filteredRecords;
  writeAttendanceData(data);

  res.json({ message: `${deletedCount} attendance record${deletedCount === 1 ? '' : 's'} deleted`, deletedCount });
});

// API: Delete single attendance record by ID
app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  const data = readAttendanceData();
  const originalLength = data.records.length;
  data.records = data.records.filter(record => record.id !== id);

  if (data.records.length === originalLength) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }

  writeAttendanceData(data);
  res.json({ message: 'Attendance record deleted successfully' });
});

// API: Get attendance summary
app.get('/api/attendance/summary', (req, res) => {
  const data = readAttendanceData();
  const today = new Date().toISOString().split('T')[0];

  const summary = {};

  const parseRecordDate = (record) => {
    if (!record) return new Date();
    if (record.isoTimestamp) {
      const parsed = new Date(record.isoTimestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (record.timestamp) {
      const parsed = new Date(record.timestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    const fallback = new Date(`${record.date} ${record.time}`);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  };
  
  data.records.forEach(record => {
    if (record.date !== today) return;

    if (!summary[record.employeeId]) {
      summary[record.employeeId] = {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        department: record.department,
        timeIn: null,
        timeOut: null,
        timeInId: null,
        timeOutId: null,
        duration: null,
        overtime: 0,
        status: 'Absent',
        statusClass: 'absent'
      };
    }

    const entry = summary[record.employeeId];
    const recordDate = parseRecordDate(record);

    if (record.type === 'in') {
      if (!entry.timeInId) {
        entry.timeIn = record.time;
        entry.timeInId = record.id;
      } else {
        const existingIn = data.records.find(r => r.id === entry.timeInId);
        if (existingIn && recordDate < parseRecordDate(existingIn)) {
          entry.timeIn = record.time;
          entry.timeInId = record.id;
        }
      }
    } else if (record.type === 'out') {
      if (!entry.timeOutId) {
        entry.timeOut = record.time;
        entry.timeOutId = record.id;
      } else {
        const existingOut = data.records.find(r => r.id === entry.timeOutId);
        if (existingOut && recordDate > parseRecordDate(existingOut)) {
          entry.timeOut = record.time;
          entry.timeOutId = record.id;
        }
      }
    } else if (record.type === 'fired') {
      entry.fired = true;
      entry.firedDate = record.date;
      entry.firedTime = record.time;
    }
  });

  Object.values(summary).forEach(entry => {
    if (!entry.timeIn && !entry.fired) return;

    if (entry.fired) {
      entry.duration = '-';
      entry.overtime = 0;
      entry.status = 'Fired';
      entry.statusClass = 'fired';
      if (!entry.timeIn && !entry.timeOut) {
        entry.timeIn = entry.firedTime;
      }
      return;
    }

    const inRecord = data.records.find(r => r.id === entry.timeInId);
    const outRecord = data.records.find(r => r.id === entry.timeOutId);
    const start = parseRecordDate(inRecord);
    const end = outRecord ? parseRecordDate(outRecord) : new Date();
    const durationHours = Math.max(0, (end - start) / (1000 * 60 * 60));
    const roundedHours = Math.round(durationHours * 100) / 100;

    entry.duration = `${roundedHours.toFixed(2)}h`;
    entry.overtime = roundedHours > 8 ? Math.round((roundedHours - 8) * 100) / 100 : 0;

    if (roundedHours < 4) {
      entry.status = 'Half Day';
      entry.statusClass = 'half-day';
    } else if (roundedHours < 8) {
      entry.status = 'Present';
      entry.statusClass = 'present';
    } else {
      entry.status = 'Overtime';
      entry.statusClass = 'overtime';
    }
  });

  res.json(Object.values(summary));
});

// API: Salary report by date range
app.get('/api/attendance/salary-report', (req, res) => {
  const { startDate, endDate, employeeId, dailyRate = 0, otRate = 0 } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start date and end date are required' });
  }

  const ratePerDay = Number(dailyRate) || 0;
  const rateOt = Number(otRate) || 0;
  const data = readAttendanceData();

  const filtered = data.records.filter(record => {
    return record.date >= startDate && record.date <= endDate;
  }).filter(record => {
    return !employeeId || employeeId === 'all' || record.employeeId === employeeId;
  });

  const parseRecordDate = (record) => {
    if (!record) return new Date();
    if (record.isoTimestamp) {
      const parsed = new Date(record.isoTimestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    if (record.timestamp) {
      const parsed = new Date(record.timestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    const fallback = new Date(`${record.date} ${record.time}`);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  };

  const employeeMap = {};

  filtered.forEach(record => {
    const key = `${record.employeeId}:${record.date}`;
    if (!employeeMap[key]) {
      employeeMap[key] = {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        department: record.department,
        date: record.date,
        timeIn: null,
        timeOut: null,
        timeInId: null,
        timeOutId: null
      };
    }

    const dayEntry = employeeMap[key];
    const recordDate = parseRecordDate(record);

    if (record.type === 'in') {
      if (!dayEntry.timeInId || recordDate < parseRecordDate(data.records.find(r => r.id === dayEntry.timeInId))) {
        dayEntry.timeIn = record.time;
        dayEntry.timeInId = record.id;
      }
    } else if (record.type === 'out') {
      if (!dayEntry.timeOutId || recordDate > parseRecordDate(data.records.find(r => r.id === dayEntry.timeOutId))) {
        dayEntry.timeOut = record.time;
        dayEntry.timeOutId = record.id;
      }
    }
  });

  const employeeTotals = {};

  Object.values(employeeMap).forEach(dayEntry => {
    const employeeKey = dayEntry.employeeId;
    if (!employeeTotals[employeeKey]) {
      employeeTotals[employeeKey] = {
        employeeId: dayEntry.employeeId,
        employeeName: dayEntry.employeeName,
        department: dayEntry.department,
        daysPresent: 0,
        totalHours: 0,
        totalOvertime: 0,
        totalSalary: 0
      };
    }

    const totals = employeeTotals[employeeKey];
    if (!dayEntry.timeIn) return;

    const inRecord = data.records.find(r => r.id === dayEntry.timeInId);
    const outRecord = data.records.find(r => r.id === dayEntry.timeOutId);
    const start = parseRecordDate(inRecord);
    const end = outRecord ? parseRecordDate(outRecord) : new Date(`${dayEntry.date} 17:00:00`);
    const durationHours = Math.max(0, (end - start) / (1000 * 60 * 60));
    const roundedHours = Math.round(durationHours * 100) / 100;

    totals.daysPresent += 1;
    totals.totalHours += roundedHours;
    if (roundedHours > 8) {
      totals.totalOvertime += Math.round((roundedHours - 8) * 100) / 100;
    }
  });

  const report = Object.values(employeeTotals).map(totals => {
    const salaryDays = ratePerDay * totals.daysPresent;
    const salaryOt = rateOt * totals.totalOvertime;
    return {
      ...totals,
      totalHours: Math.round(totals.totalHours * 100) / 100,
      totalOvertime: Math.round(totals.totalOvertime * 100) / 100,
      dailyRate: ratePerDay,
      otRate: rateOt,
      totalSalary: Math.round((salaryDays + salaryOt) * 100) / 100
    };
  });

  res.json(report);
});

// API: Export attendance report (CSV format)
app.get('/api/attendance/export', (req, res) => {
  const data = readAttendanceData();
  const { startDate, endDate } = req.query;

  let records = data.records;
  
  if (startDate && endDate) {
    records = records.filter(r => r.date >= startDate && r.date <= endDate);
  }

  let csv = 'Employee ID,Employee Name,Department,Type,Date,Time,Timestamp\n';
  
  records.forEach(record => {
    csv += `${record.employeeId},${record.employeeName},${record.department},${record.type},${record.date},${record.time},${record.timestamp}\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename="attendance_report.csv"');
  res.send(csv);
});


// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(port = PORT) {
  app.listen(port, () => {
    console.log(`Digital Attendance System running on http://localhost:${port}`);
    console.log('Scan QR codes to record attendance');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};

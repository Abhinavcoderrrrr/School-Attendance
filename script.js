/**
 * School Attendance System - Utility Functions
 */

// Generate a unique ID for students
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Format a date to display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

// Show a message that disappears after a specific time
function showTemporaryMessage(element, message, type, duration = 5000) {
  element.textContent = message;
  element.className = type === 'error' ? 'error-message' : 'file-info';
  element.classList.remove('hidden');
  
  setTimeout(() => {
    element.classList.add('hidden');
  }, duration);
}

// Export data to a file
function exportToFile(data, filename) {
  // Convert data to JSON string
  const dataStr = JSON.stringify(data);
  
  // Create file for download
  const blob = new Blob([dataStr], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  // Create a link and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
}

// Calculate attendance statistics
function calculateAttendanceStats(records) {
  // Count present and absent days
  const presentDays = records.filter(record => record.status === 'present').length;
  const absentDays = records.filter(record => record.status === 'absent').length;
  const totalDays = presentDays + absentDays;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  
  return {
    presentDays,
    absentDays,
    totalDays,
    attendanceRate
  };
}

// Determine attendance status from rate
function getAttendanceStatus(attendanceRate) {
  if (attendanceRate >= 90) {
    return {
      status: 'Excellent',
      class: 'text-success',
      description: 'Excellent attendance record'
    };
  } else if (attendanceRate >= 75) {
    return {
      status: 'Good',
      class: 'text-success',
      description: 'Good attendance record'
    };
  } else if (attendanceRate >= 60) {
    return {
      status: 'Average',
      class: '',
      description: 'Attendance needs improvement'
    };
  } else if (attendanceRate > 0) {
    return {
      status: 'Poor',
      class: 'text-danger',
      description: 'Attendance is critically low'
    };
  } else {
    return {
      status: 'No Data',
      class: '',
      description: 'No attendance data available'
    };
  }
} 
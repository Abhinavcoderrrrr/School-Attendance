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
  
  // Clear existing classes
  element.classList.remove('alert-success', 'alert-danger', 'alert-warning', 'alert-info', 'd-none');
  
  // Add appropriate class
  if (type === 'error') {
    element.classList.add('alert-danger');
  } else if (type === 'success') {
    element.classList.add('alert-success');
  } else if (type === 'warning') {
    element.classList.add('alert-warning');
  } else {
    element.classList.add('alert-info');
  }
  
  setTimeout(() => {
    element.classList.add('d-none');
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

// DOM content loaded event - Will initialize the app functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize empty students array or get from localStorage
  let students = JSON.parse(localStorage.getItem('students')) || [];
  
  // Add student form handling
  const addStudentForm = document.getElementById('add-student-form');
  const addStudentMessage = document.getElementById('add-student-message');
  
  if (addStudentForm) {
    addStudentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const name = document.getElementById('studentName').value;
      const roll = document.getElementById('studentRoll').value;
      const className = document.getElementById('studentClass').value;
      const email = document.getElementById('studentEmail').value;
      const phone = document.getElementById('studentPhone').value;
      const address = document.getElementById('studentAddress').value;
      
      // Check if roll number already exists
      if (students.some(student => student.roll === roll)) {
        showTemporaryMessage(addStudentMessage, 'Roll number already exists!', 'error');
        return;
      }
      
      // Show loading message
      addStudentMessage.innerHTML = `
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <strong>Adding student...</strong>
      `;
      addStudentMessage.classList.remove('d-none', 'alert-success', 'alert-danger');
      addStudentMessage.classList.add('alert-info');
      
      // Disable submit button
      const submitBtn = addStudentForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...`;
      
      // Create new student object
      const newStudent = {
        id: generateUniqueId(),
        name,
        roll,
        class: className,
        email,
        phone,
        address,
        attendance: []
      };
      
      // Simulate loading time (3 seconds)
      setTimeout(() => {
        // Add to array and save to localStorage
        students.push(newStudent);
        localStorage.setItem('students', JSON.stringify(students));
        
        // Display success message
        showTemporaryMessage(addStudentMessage, 'Student added successfully!', 'success');
        
        // Reset form
        addStudentForm.reset();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        
        // Update student list if visible
        if (document.getElementById('students-list')) {
          populateStudentsList();
        }
      }, 3000);
    });
  }
  
  // Export students data
  const exportDataBtn = document.getElementById('export-data-btn');
  const fileMessage = document.getElementById('file-message');
  
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', function() {
      if (students.length === 0) {
        showTemporaryMessage(fileMessage, 'No students data to export!', 'error');
        return;
      }
      
      // Export to file
      if (exportToFile(students, 'students_data.txt')) {
        showTemporaryMessage(fileMessage, 'Students data exported successfully!', 'success');
      } else {
        showTemporaryMessage(fileMessage, 'Failed to export students data!', 'error');
      }
    });
  }
  
  // Import students data
  const importDataInput = document.getElementById('import-data');
  
  if (importDataInput) {
    importDataInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      
      if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            // Parse the file content
            const importedData = JSON.parse(e.target.result);
            
            // Validate the imported data (basic check)
            if (Array.isArray(importedData) && importedData.length > 0) {
              // Update students array and save to localStorage
              students = importedData;
              localStorage.setItem('students', JSON.stringify(students));
              
              // Display success message
              showTemporaryMessage(fileMessage, `${importedData.length} students imported successfully!`, 'success');
              
              // Update student list if visible
              if (document.getElementById('students-list')) {
                populateStudentsList();
              }
            } else {
              throw new Error('Invalid data format');
            }
          } catch (error) {
            showTemporaryMessage(fileMessage, 'Failed to import data: Invalid file format!', 'error');
          }
        };
        
        reader.readAsText(file);
      }
    });
  }
  
  // Load students list
  function populateStudentsList() {
    const studentsList = document.getElementById('students-list');
    const studentsContainer = document.getElementById('students-container');
    const studentsLoading = document.getElementById('students-loading');
    const noStudents = document.getElementById('no-students');
    
    // Show loading
    if (studentsLoading) studentsLoading.classList.remove('d-none');
    if (studentsContainer) studentsContainer.classList.add('d-none');
    
    // Simulate loading (for demonstration)
    setTimeout(() => {
      if (studentsLoading) studentsLoading.classList.add('d-none');
      if (studentsContainer) studentsContainer.classList.remove('d-none');
      
      if (studentsList) {
        // Clear existing list
        studentsList.innerHTML = '';
        
        if (students.length === 0) {
          if (noStudents) noStudents.classList.remove('d-none');
          return;
        }
        
        if (noStudents) noStudents.classList.add('d-none');
        
        // Populate with students
        students.forEach((student, index) => {
          const row = document.createElement('tr');
          
          // Calculate attendance stats for this student
          const stats = calculateAttendanceStats(student.attendance);
          const statusInfo = getAttendanceStatus(stats.attendanceRate);
          
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.roll}</td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${student.email}</td>
            <td>
              <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-sm btn-info view-student" data-id="${student.id}">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary edit-student" data-id="${student.id}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-success attendance-record" data-id="${student.id}">
                  <i class="fas fa-calendar-check"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-student" data-id="${student.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          `;
          
          studentsList.appendChild(row);
        });
        
        // Add event listeners to buttons
        addButtonEventListeners();
      }
    }, 500);
  }
  
  // Add event listeners to student action buttons
  function addButtonEventListeners() {
    // View student details
    const viewButtons = document.querySelectorAll('.view-student');
    viewButtons.forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.dataset.id;
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          const studentDetailsContent = document.getElementById('student-details-content');
          
          // Calculate attendance stats
          const stats = calculateAttendanceStats(student.attendance);
          const statusInfo = getAttendanceStatus(stats.attendanceRate);
          
          studentDetailsContent.innerHTML = `
            <div class="text-center mb-4">
              <div class="avatar-container mx-auto mb-3">
                <i class="fas fa-user-graduate fa-3x text-primary"></i>
              </div>
              <h3 class="h4">${student.name}</h3>
              <p class="badge bg-primary mb-2">${student.class}</p>
              <p class="text-muted mb-0">Roll Number: ${student.roll}</p>
            </div>
            
            <div class="student-details mt-4">
              <div class="row mb-2">
                <div class="col-sm-4 fw-medium">Email:</div>
                <div class="col-sm-8">${student.email}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-4 fw-medium">Phone:</div>
                <div class="col-sm-8">${student.phone || 'Not provided'}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-4 fw-medium">Address:</div>
                <div class="col-sm-8">${student.address || 'Not provided'}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-4 fw-medium">Attendance Rate:</div>
                <div class="col-sm-8">
                  <span class="badge ${stats.attendanceRate >= 75 ? 'bg-success' : stats.attendanceRate >= 60 ? 'bg-warning' : 'bg-danger'}">
                    ${stats.attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          `;
          
          // Show modal
          const studentDetailsModal = new bootstrap.Modal(document.getElementById('studentDetailsModal'));
          studentDetailsModal.show();
        }
      });
    });
    
    // Edit student
    const editButtons = document.querySelectorAll('.edit-student');
    editButtons.forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.dataset.id;
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          // Fill form with student data
          document.getElementById('edit-student-id').value = student.id;
          document.getElementById('edit-studentName').value = student.name;
          document.getElementById('edit-studentRoll').value = student.roll;
          document.getElementById('edit-studentClass').value = student.class;
          document.getElementById('edit-studentEmail').value = student.email;
          document.getElementById('edit-studentPhone').value = student.phone || '';
          document.getElementById('edit-studentAddress').value = student.address || '';
          
          // Show modal
          const editStudentModal = new bootstrap.Modal(document.getElementById('editStudentModal'));
          editStudentModal.show();
        }
      });
    });
    
    // View attendance record
    const attendanceButtons = document.querySelectorAll('.attendance-record');
    attendanceButtons.forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.dataset.id;
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          // Update modal title
          document.getElementById('attendanceRecordModalLabel').textContent = `Attendance Record: ${student.name}`;
          
          // Calculate attendance stats
          const stats = calculateAttendanceStats(student.attendance);
          const statusInfo = getAttendanceStatus(stats.attendanceRate);
          
          // Show attendance statistics
          const attendanceStats = document.getElementById('attendance-stats');
          attendanceStats.innerHTML = `
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Present</h5>
                  <p class="card-text text-success h4">${stats.presentDays}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Absent</h5>
                  <p class="card-text text-danger h4">${stats.absentDays}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Total</h5>
                  <p class="card-text h4">${stats.totalDays}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title">Rate</h5>
                  <p class="card-text ${statusInfo.class} h4">${stats.attendanceRate}%</p>
                </div>
              </div>
            </div>
          `;
          
          // Show attendance history
          const attendanceHistory = document.getElementById('attendance-history');
          const noAttendanceRecord = document.getElementById('no-attendance-record');
          
          if (student.attendance.length === 0) {
            attendanceHistory.innerHTML = '';
            noAttendanceRecord.classList.remove('d-none');
          } else {
            noAttendanceRecord.classList.add('d-none');
            
            // Sort attendance by date (newest first)
            const sortedAttendance = [...student.attendance].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            attendanceHistory.innerHTML = sortedAttendance.map(record => `
              <tr>
                <td>${formatDate(record.date)}</td>
                <td>
                  <span class="badge ${record.status === 'present' ? 'bg-success' : 'bg-danger'}">
                    ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-danger delete-attendance" data-student-id="${student.id}" data-date="${record.date}">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('');
            
            // Add event listeners to delete attendance buttons
            addDeleteAttendanceListeners();
          }
          
          // Show modal
          const attendanceRecordModal = new bootstrap.Modal(document.getElementById('attendanceRecordModal'));
          attendanceRecordModal.show();
        }
      });
    });
    
    // Delete student
    const deleteButtons = document.querySelectorAll('.delete-student');
    deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.dataset.id;
        const student = students.find(s => s.id === studentId);
        
        if (student) {
          // Set student ID in modal
          document.getElementById('delete-student-id').value = student.id;
          
          // Show modal
          const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
          confirmDeleteModal.show();
        }
      });
    });
  }
  
  // Add event listener to delete attendance records
  function addDeleteAttendanceListeners() {
    const deleteAttendanceButtons = document.querySelectorAll('.delete-attendance');
    deleteAttendanceButtons.forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.dataset.studentId;
        const date = this.dataset.date;
        
        // Find student
        const studentIndex = students.findIndex(s => s.id === studentId);
        
        if (studentIndex !== -1) {
          // Find attendance record
          const attendanceIndex = students[studentIndex].attendance.findIndex(a => a.date === date);
          
          if (attendanceIndex !== -1) {
            // Remove the attendance record
            students[studentIndex].attendance.splice(attendanceIndex, 1);
            
            // Save to localStorage
            localStorage.setItem('students', JSON.stringify(students));
            
            // Update the attendance record view
            const studentDetailsModal = bootstrap.Modal.getInstance(document.getElementById('attendanceRecordModal'));
            studentDetailsModal.hide();
            
            // Reopen the modal with updated data
            const attendanceButton = document.querySelector(`.attendance-record[data-id="${studentId}"]`);
            if (attendanceButton) {
              attendanceButton.click();
            }
          }
        }
      });
    });
  }
  
  // Initialize confirm delete button
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function() {
      const studentId = document.getElementById('delete-student-id').value;
      
      // Remove student from array
      students = students.filter(student => student.id !== studentId);
      
      // Save to localStorage
      localStorage.setItem('students', JSON.stringify(students));
      
      // Close modal
      const confirmDeleteModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
      confirmDeleteModal.hide();
      
      // Update student list
      populateStudentsList();
    });
  }
  
  // Initialize save edit student button
  const saveEditStudentBtn = document.getElementById('save-edit-student');
  if (saveEditStudentBtn) {
    saveEditStudentBtn.addEventListener('click', function() {
      const studentId = document.getElementById('edit-student-id').value;
      const name = document.getElementById('edit-studentName').value;
      const roll = document.getElementById('edit-studentRoll').value;
      const className = document.getElementById('edit-studentClass').value;
      const email = document.getElementById('edit-studentEmail').value;
      const phone = document.getElementById('edit-studentPhone').value;
      const address = document.getElementById('edit-studentAddress').value;
      
      // Find student index
      const studentIndex = students.findIndex(s => s.id === studentId);
      
      if (studentIndex !== -1) {
        // Check if roll number exists and it's not the current student
        const rollExists = students.some(s => s.roll === roll && s.id !== studentId);
        
        if (rollExists) {
          alert('Roll number already exists!');
          return;
        }
        
        // Update student data
        students[studentIndex].name = name;
        students[studentIndex].roll = roll;
        students[studentIndex].class = className;
        students[studentIndex].email = email;
        students[studentIndex].phone = phone;
        students[studentIndex].address = address;
        
        // Save to localStorage
        localStorage.setItem('students', JSON.stringify(students));
        
        // Close modal
        const editStudentModal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
        editStudentModal.hide();
        
        // Update student list
        populateStudentsList();
      }
    });
  }
  
  // Mark attendance functionality
  const searchStudentsBtn = document.getElementById('search-students-btn');
  const attendanceDate = document.getElementById('attendance-date');
  const studentSearch = document.getElementById('student-search');
  const foundStudentsList = document.getElementById('found-students-list');
  const noFoundStudents = document.getElementById('no-found-students');
  const attendanceContainer = document.getElementById('attendance-container');
  const markAttendanceBtn = document.getElementById('mark-attendance-btn');
  
  // Search for students - now with real-time search
  if (studentSearch) {
    // Initialize by showing all students first
    setTimeout(() => {
      if (searchStudentsBtn) {
        searchStudentsBtn.click();
      }
    }, 300);
    
    // Add input event listener for real-time filtering
    studentSearch.addEventListener('input', function() {
      // Use debounce to prevent too many searches while typing
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        const searchQuery = this.value.toLowerCase();
        const date = attendanceDate.value;
        
        // Always keep all students visible in the DOM
        const allStudentItems = document.querySelectorAll('.attendance-item');
        
        if (searchQuery.trim() === '') {
          // If search is empty, show all students
          allStudentItems.forEach(item => {
            item.classList.remove('d-none');
          });
          noFoundStudents.classList.add('d-none');
          return;
        }
        
        // Filter visible students based on search
        let foundMatch = false;
        
        allStudentItems.forEach(item => {
          const studentName = item.querySelector('.col-md-4 span:last-child').textContent.toLowerCase();
          const studentRoll = item.querySelector('.col-md-2 span').textContent.toLowerCase();
          const studentClass = item.querySelector('.col-md-2:nth-child(4)').textContent.toLowerCase();
          
          if (studentName.includes(searchQuery) || 
              studentRoll.includes(searchQuery) || 
              studentClass.includes(searchQuery)) {
            item.classList.remove('d-none');
            foundMatch = true;
          } else {
            item.classList.add('d-none');
          }
        });
        
        // Show/hide no results message
        if (!foundMatch) {
          noFoundStudents.classList.remove('d-none');
        } else {
          noFoundStudents.classList.add('d-none');
        }
      }, 300); // Debounce 300ms
    });
  }
  
  // Load all students initially for the attendance page
  function loadAllStudents() {
    const date = attendanceDate.value;
    
    // Show loading
    attendanceContainer.classList.remove('d-none');
    document.getElementById('attendance-loading').classList.remove('d-none');
    document.getElementById('found-students-list').innerHTML = '';
    
    // Simulate loading (brief for better UX)
    setTimeout(() => {
      document.getElementById('attendance-loading').classList.add('d-none');
      
      if (students.length === 0) {
        noFoundStudents.classList.remove('d-none');
        return;
      }
      
      noFoundStudents.classList.add('d-none');
      
      // Display all students
      students.forEach((student, index) => {
        // Check if attendance already marked for this date
        const attendanceRecord = student.attendance.find(a => a.date === date);
        const isPresent = attendanceRecord ? attendanceRecord.status === 'present' : null;
        
        const studentItem = document.createElement('div');
        studentItem.className = 'attendance-item';
        studentItem.innerHTML = `
          <div class="row align-items-center">
            <div class="col-md-1">
              <span class="fw-medium">${index + 1}</span>
            </div>
            <div class="col-md-2">
              <div class="d-flex align-items-center">
                <div class="form-check me-3 d-none">
                  <input class="form-check-input attendance-checkbox" type="checkbox" data-student-id="${student.id}" id="student-${student.id}" ${isPresent === true ? 'checked' : isPresent === false ? '' : ''}>
                  <label class="form-check-label" for="student-${student.id}"></label>
                </div>
                <span>${student.roll}</span>
              </div>
            </div>
            <div class="col-md-4">
              <div class="d-flex align-items-center">
                <span class="badge ${isPresent === true ? 'bg-success' : isPresent === false ? 'bg-danger' : 'bg-secondary'} me-2">${isPresent === true ? 'Present' : isPresent === false ? 'Absent' : 'Not Marked'}</span>
                <span>${student.name}</span>
              </div>
            </div>
            <div class="col-md-2">${student.class}</div>
            <div class="col-md-3">
              <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-sm ${isPresent === true ? 'btn-success' : 'btn-outline-success'} mark-present-btn" data-student-id="${student.id}">
                  <i class="fas fa-check-circle"></i>
                </button>
                <button class="btn btn-sm ${isPresent === false ? 'btn-danger' : 'btn-outline-danger'} mark-absent-btn" data-student-id="${student.id}">
                  <i class="fas fa-times-circle"></i>
                </button>
                <button class="btn btn-sm btn-info send-message-btn ${isPresent === true ? 'd-none' : ''}" data-student-id="${student.id}" data-student-email="${student.email}">
                  <i class="fas fa-envelope me-1"></i>Message
                </button>
              </div>
            </div>
          </div>
        `;
        
        foundStudentsList.appendChild(studentItem);
      });
      
      // Add event listeners to the attendance action buttons
      addAttendanceButtonListeners();
      
      // Update button styles
      updateAttendanceButtonStyles();
    }, 300);
  }
  
  // Set today's date by default for the mark attendance date input
  if (attendanceDate) {
    attendanceDate.value = getTodayDate();
    attendanceDate.classList.add('d-none'); // Hide the date input
    
    // Add a display element to show today's date
    const dateDisplayElem = document.createElement('div');
    dateDisplayElem.className = 'fw-medium mb-2';
    dateDisplayElem.innerHTML = `<i class="fas fa-calendar-day me-1"></i> Today: ${formatDate(getTodayDate())}`;
    attendanceDate.parentNode.insertBefore(dateDisplayElem, attendanceDate);
    
    // Automatically load all students when the page loads
    setTimeout(() => {
      loadAllStudents();
    }, 300);
  }
  
  // Helper function to add event listeners to attendance buttons
  function addAttendanceButtonListeners() {
    document.querySelectorAll('.mark-present-btn').forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.getAttribute('data-student-id');
        const checkbox = document.querySelector(`.attendance-checkbox[data-student-id="${studentId}"]`);
        const statusBadge = this.closest('.attendance-item').querySelector('.badge');
        const messageBtn = this.parentElement.querySelector('.send-message-btn');
        
        // Update checkbox (which is now hidden)
        checkbox.checked = true;
        checkbox.setAttribute('data-status-set', 'true');
        
        // Update status badge
        statusBadge.className = 'badge bg-success me-2';
        statusBadge.textContent = 'Present';
        
        // Hide message button when student is marked present
        messageBtn.classList.add('d-none');
        
        // Update visual indicators - change button appearances
        this.classList.remove('btn-outline-success');
        this.classList.add('btn-success');
        
        const absentBtn = button.parentElement.querySelector('.mark-absent-btn');
        absentBtn.classList.remove('btn-danger');
        absentBtn.classList.add('btn-outline-danger');
        
        // Show status alert
        const studentName = this.closest('.attendance-item').querySelector('.col-md-4:nth-child(2)').textContent;
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-success alert-dismissible fade show attendance-alert';
        alertElement.innerHTML = `
          <strong>${studentName}</strong> marked as present.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const alertContainer = document.getElementById('attendance-alerts') || document.createElement('div');
        if (!document.getElementById('attendance-alerts')) {
          alertContainer.id = 'attendance-alerts';
          alertContainer.className = 'mt-3';
          foundStudentsList.parentElement.prepend(alertContainer);
        }
        
        alertContainer.appendChild(alertElement);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 3000);
      });
    });
    
    document.querySelectorAll('.mark-absent-btn').forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.getAttribute('data-student-id');
        const checkbox = document.querySelector(`.attendance-checkbox[data-student-id="${studentId}"]`);
        const statusBadge = this.closest('.attendance-item').querySelector('.badge');
        const messageBtn = this.parentElement.querySelector('.send-message-btn');
        
        // Update checkbox (which is now hidden)
        checkbox.checked = false;
        checkbox.setAttribute('data-status-set', 'true');
        
        // Update status badge
        statusBadge.className = 'badge bg-danger me-2';
        statusBadge.textContent = 'Absent';
        
        // Show message button when student is marked absent
        messageBtn.classList.remove('d-none');
        
        // Update visual indicators - change button appearances
        this.classList.remove('btn-outline-danger');
        this.classList.add('btn-danger');
        
        const presentBtn = button.parentElement.querySelector('.mark-present-btn');
        presentBtn.classList.remove('btn-success');
        presentBtn.classList.add('btn-outline-success');
        
        // Show status alert
        const studentName = this.closest('.attendance-item').querySelector('.col-md-4:nth-child(2)').textContent;
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-danger alert-dismissible fade show attendance-alert';
        alertElement.innerHTML = `
          <strong>${studentName}</strong> marked as absent.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const alertContainer = document.getElementById('attendance-alerts') || document.createElement('div');
        if (!document.getElementById('attendance-alerts')) {
          alertContainer.id = 'attendance-alerts';
          alertContainer.className = 'mt-3';
          foundStudentsList.parentElement.prepend(alertContainer);
        }
        
        alertContainer.appendChild(alertElement);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 3000);
      });
    });
    
    document.querySelectorAll('.send-message-btn').forEach(button => {
      button.addEventListener('click', function() {
        const studentId = this.getAttribute('data-student-id');
        const studentEmail = this.getAttribute('data-student-email');
        const date = attendanceDate.value;
        
        // Get student data
        const student = students.find(s => s.id === studentId);
        if (!student) return;
        
        // Format date for the email subject
        const formattedDate = formatDate(date);
        
        // Check if attendance is marked
        const attendanceRecord = student.attendance.find(a => a.date === date);
        const isPresent = attendanceRecord ? attendanceRecord.status === 'present' : null;
        
        // Create email subject and body
        let emailSubject = `Attendance Notification - ${formattedDate}`;
        let emailBody = `Dear Parents/Guardians,\n\n`;
        
        emailBody += `This is to inform you that your child was absent from class today (${formattedDate}).\n\n`;
        emailBody += `Please ensure regular attendance as it is crucial for academic progress. If your child was absent due to illness or any other important reason, please send a note or medical certificate.\n\n`;
        emailBody += `Please feel free to contact us if you have any questions or concerns.\n\n`;
        emailBody += `Thank you,\nSchool Administration`;
        
        // Encode for mailto link
        const encodedSubject = encodeURIComponent(emailSubject);
        const encodedBody = encodeURIComponent(emailBody);
        
        // Create and open the mailto link
        const mailtoLink = `mailto:${studentEmail}?subject=${encodedSubject}&body=${encodedBody}`;
        window.open(mailtoLink);
        
        // Show status alert
        const studentName = this.closest('.attendance-item').querySelector('.col-md-4:nth-child(2)').textContent;
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-info alert-dismissible fade show attendance-alert';
        alertElement.innerHTML = `
          Opening email composer for <strong>${studentName}</strong>.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const alertContainer = document.getElementById('attendance-alerts') || document.createElement('div');
        if (!document.getElementById('attendance-alerts')) {
          alertContainer.id = 'attendance-alerts';
          alertContainer.className = 'mt-3';
          foundStudentsList.parentElement.prepend(alertContainer);
        }
        
        alertContainer.appendChild(alertElement);
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 3000);
      });
    });
  }
  
  // Helper function to update button styles based on attendance status
  function updateAttendanceButtonStyles() {
    document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
      const studentId = checkbox.getAttribute('data-student-id');
      const presentBtn = document.querySelector(`.mark-present-btn[data-student-id="${studentId}"]`);
      const absentBtn = document.querySelector(`.mark-absent-btn[data-student-id="${studentId}"]`);
      const messageBtn = document.querySelector(`.send-message-btn[data-student-id="${studentId}"]`);
      const statusBadge = checkbox.closest('.attendance-item').querySelector('.badge');
      
      if (checkbox.checked) {
        // Present
        presentBtn.classList.remove('btn-outline-success');
        presentBtn.classList.add('btn-success');
        absentBtn.classList.remove('btn-danger');
        absentBtn.classList.add('btn-outline-danger');
        statusBadge.className = 'badge bg-success me-2';
        statusBadge.textContent = 'Present';
        // Hide message button for present students
        messageBtn.classList.add('d-none');
      } else if (checkbox.hasAttribute('data-status-set')) {
        // Absent
        presentBtn.classList.remove('btn-success');
        presentBtn.classList.add('btn-outline-success');
        absentBtn.classList.remove('btn-outline-danger');
        absentBtn.classList.add('btn-danger');
        statusBadge.className = 'badge bg-danger me-2';
        statusBadge.textContent = 'Absent';
        // Show message button for absent students
        messageBtn.classList.remove('d-none');
      } else {
        // Not marked
        presentBtn.classList.remove('btn-success');
        presentBtn.classList.add('btn-outline-success');
        absentBtn.classList.remove('btn-danger');
        absentBtn.classList.add('btn-outline-danger');
        statusBadge.className = 'badge bg-secondary me-2';
        statusBadge.textContent = 'Not Marked';
        // Show message button initially
        messageBtn.classList.remove('d-none');
      }
    });
  }
  
  // Select all students checkbox
  const selectAllCheckbox = document.getElementById('select-all-students');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.attendance-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
        
        // Trigger the change event to update the status badges
        const event = new Event('change');
        checkbox.dispatchEvent(event);
      });
    });
  }
  
  // Group message button functionality
  const groupMessageBtn = document.getElementById('group-message-btn');
  if (groupMessageBtn) {
    groupMessageBtn.addEventListener('click', function() {
      const date = attendanceDate.value; // Hidden field with today's date
      
      // Get all checkboxes
      const checkboxes = document.querySelectorAll('.attendance-checkbox');
      const studentIds = Array.from(checkboxes).map(checkbox => {
        const studentId = checkbox.getAttribute('data-student-id');
        const isChecked = checkbox.checked;
        return { id: studentId, status: isChecked ? 'present' : 'absent' };
      });
      
      // Find absent students
      const absentStudents = studentIds.filter(s => s.status === 'absent');
      
      if (absentStudents.length === 0) {
        // Show alert if no absent students are found
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-warning alert-dismissible fade show attendance-alert';
        alertElement.innerHTML = `
          <strong>No absent students found!</strong> Please select at least one student to send a message.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const alertContainer = document.getElementById('attendance-alerts') || document.createElement('div');
        if (!document.getElementById('attendance-alerts')) {
          alertContainer.id = 'attendance-alerts';
          alertContainer.className = 'mt-3';
          foundStudentsList.parentElement.prepend(alertContainer);
        }
        
        alertContainer.appendChild(alertElement);
        alertContainer.classList.remove('d-none');
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 5000);
        return;
      }
      
      // Format date for the email subject
      const formattedDate = formatDate(date);
      
      // Create email with all absent students as recipients
      const recipientStudents = absentStudents.map(absent => {
        const student = students.find(s => s.id === absent.id);
        return student;
      });
      
      // Collect email addresses
      const emailAddresses = recipientStudents.map(student => student.email).join(',');
      
      // Create email subject and body
      let emailSubject = `Attendance Notification - ${formattedDate}`;
      let emailBody = `Dear Parents/Guardians,\n\n`;
      
      emailBody += `This is to inform you that your child was absent from class today (${formattedDate}).\n\n`;
      emailBody += `Please ensure regular attendance as it is crucial for academic progress. If your child was absent due to illness or any other important reason, please send a note or medical certificate.\n\n`;
      emailBody += `Please feel free to contact us if you have any questions or concerns.\n\n`;
      emailBody += `Thank you,\nSchool Administration`;
      
      // Encode for mailto link
      const encodedSubject = encodeURIComponent(emailSubject);
      const encodedBody = encodeURIComponent(emailBody);
      
      // Create and open the mailto link
      const mailtoLink = `mailto:${emailAddresses}?subject=${encodedSubject}&body=${encodedBody}`;
      window.open(mailtoLink);
      
      // Show status alert
      const alertElement = document.createElement('div');
      alertElement.className = 'alert alert-info alert-dismissible fade show attendance-alert';
      alertElement.innerHTML = `
        Opening email composer for <strong>${recipientStudents.length} absent students</strong>.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      const alertContainer = document.getElementById('attendance-alerts');
      if (alertContainer) {
        alertContainer.classList.remove('d-none');
        alertContainer.appendChild(alertElement);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 5000);
      }
    });
  }
  
  // Mark attendance button
  if (markAttendanceBtn) {
    markAttendanceBtn.addEventListener('click', function() {
      const date = attendanceDate.value; // Hidden field with today's date
      
      const checkboxes = document.querySelectorAll('.attendance-checkbox');
      const attendanceData = Array.from(checkboxes).map(checkbox => ({
        studentId: checkbox.getAttribute('data-student-id'),
        isPresent: checkbox.checked,
        isSet: checkbox.hasAttribute('data-status-set')
      }));
      
      // Filter out students that haven't been marked
      const markedAttendanceData = attendanceData.filter(data => data.isSet);
      
      if (markedAttendanceData.length === 0) {
        // Show alert if no students were marked
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-warning alert-dismissible fade show attendance-alert';
        alertElement.innerHTML = `
          <strong>No students marked!</strong> Please mark at least one student as present or absent.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const alertContainer = document.getElementById('attendance-alerts') || document.createElement('div');
        if (!document.getElementById('attendance-alerts')) {
          alertContainer.id = 'attendance-alerts';
          alertContainer.className = 'mt-3';
          foundStudentsList.parentElement.prepend(alertContainer);
        }
        
        alertContainer.appendChild(alertElement);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 5000);
        
        return;
      }
      
      // Show loading animation
      const loadingElement = document.createElement('div');
      loadingElement.className = 'alert alert-info attendance-alert text-center';
      loadingElement.innerHTML = `
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <strong>Saving attendance records...</strong>
      `;
      
      const alertContainer = document.getElementById('attendance-alerts') || document.createElement('div');
      if (!document.getElementById('attendance-alerts')) {
        alertContainer.id = 'attendance-alerts';
        alertContainer.className = 'mt-3';
        foundStudentsList.parentElement.prepend(alertContainer);
      }
      
      alertContainer.appendChild(loadingElement);
      
      // Disable the mark attendance button while saving
      markAttendanceBtn.disabled = true;
      markAttendanceBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Saving...
      `;
      
      // Simulate loading time (3 seconds)
      setTimeout(() => {
        // Update students attendance
        markedAttendanceData.forEach(data => {
          const studentIndex = students.findIndex(s => s.id === data.studentId);
          
          if (studentIndex !== -1) {
            // Check if attendance already exists for this date
            const attendanceIndex = students[studentIndex].attendance.findIndex(a => a.date === date);
            
            if (attendanceIndex !== -1) {
              // Update existing attendance
              students[studentIndex].attendance[attendanceIndex].status = data.isPresent ? 'present' : 'absent';
            } else {
              // Add new attendance record
              students[studentIndex].attendance.push({
                date,
                status: data.isPresent ? 'present' : 'absent'
              });
            }
          }
        });
        
        // Save to localStorage
        localStorage.setItem('students', JSON.stringify(students));
        
        // Remove loading element
        loadingElement.remove();
        
        // Reset button state
        markAttendanceBtn.disabled = false;
        markAttendanceBtn.innerHTML = 'Save Attendance';
        
        // Show success message
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-success alert-dismissible fade show attendance-alert';
        alertElement.innerHTML = `
          <strong>Success!</strong> Attendance marked for ${markedAttendanceData.length} students.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alertElement);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
          alertElement.classList.remove('show');
          setTimeout(() => alertElement.remove(), 150);
        }, 5000);
      }, 3000); // 3 second loading time
    });
  }
  
  // Initialize manage students tab content if active
  if (document.getElementById('students-list')) {
    populateStudentsList();
  }
  
  // Tab change event - Load content when tab is shown
  const teacherTabs = document.getElementById('teacherTabs');
  if (teacherTabs) {
    teacherTabs.addEventListener('show.bs.tab', function(event) {
      const targetTab = event.target.getAttribute('data-bs-target');
      
      if (targetTab === '#manage-students') {
        populateStudentsList();
      }
    });
  }
  
  // Track Attendance functionality
  const trackDateInput = document.getElementById('track-date');
  const fetchAttendanceBtn = document.getElementById('fetch-attendance-btn');
  const dateAttendanceContainer = document.getElementById('date-attendance-container');
  const dateAttendanceLoading = document.getElementById('date-attendance-loading');
  const dateAttendanceList = document.getElementById('date-attendance-list');
  const noDateAttendance = document.getElementById('no-date-attendance');
  
  // Set today's date by default for the track attendance date input
  if (trackDateInput) {
    trackDateInput.value = getTodayDate();
  }
  
  // Fetch attendance records for a selected date
  if (fetchAttendanceBtn) {
    fetchAttendanceBtn.addEventListener('click', function() {
      const selectedDate = trackDateInput.value;
      
      if (!selectedDate) {
        alert('Please select a date!');
        return;
      }
      
      // Show loading
      dateAttendanceContainer.classList.remove('d-none');
      dateAttendanceLoading.classList.remove('d-none');
      dateAttendanceList.innerHTML = '';
      
      // Format date for display
      const formattedDate = formatDate(selectedDate);
      document.getElementById('selected-date-display').textContent = formattedDate;
      
      // Simulate loading (for demonstration)
      setTimeout(() => {
        dateAttendanceLoading.classList.add('d-none');
        
        // Gather attendance data for the selected date
        const studentsWithAttendance = [];
        let presentCount = 0;
        let absentCount = 0;
        
        students.forEach(student => {
          // Find attendance record for this date
          const attendanceRecord = student.attendance.find(a => a.date === selectedDate);
          
          // Create a record with student info and attendance status
          const record = {
            id: student.id,
            name: student.name,
            roll: student.roll,
            class: student.class,
            status: attendanceRecord ? attendanceRecord.status : 'no-record'
          };
          
          studentsWithAttendance.push(record);
          
          // Count present and absent students
          if (attendanceRecord) {
            if (attendanceRecord.status === 'present') {
              presentCount++;
            } else if (attendanceRecord.status === 'absent') {
              absentCount++;
            }
          }
        });
        
        // Update counters
        document.getElementById('total-students-count').textContent = students.length;
        document.getElementById('present-students-count').textContent = presentCount;
        document.getElementById('absent-students-count').textContent = absentCount;
        
        // Check if any attendance records exist for this date
        const hasAttendance = studentsWithAttendance.some(record => record.status !== 'no-record');
        
        if (!hasAttendance) {
          noDateAttendance.classList.remove('d-none');
          return;
        }
        
        noDateAttendance.classList.add('d-none');
        
        // Always display all students, regardless of attendance status
        studentsWithAttendance.forEach((record, index) => {
          const row = document.createElement('tr');
          
          let statusBadge;
          if (record.status === 'present') {
            statusBadge = `<span class="badge bg-success">Present</span>`;
          } else if (record.status === 'absent') {
            statusBadge = `<span class="badge bg-danger">Absent</span>`;
          } else {
            statusBadge = `<span class="badge bg-secondary">Not Marked</span>`;
          }
          
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.roll}</td>
            <td>${record.name}</td>
            <td>${record.class}</td>
            <td>${statusBadge}</td>
          `;
          
          dateAttendanceList.appendChild(row);
        });
      }, 500);
    });
  }
}); 
# Frontend Backend Integration Guide

This guide explains how to integrate the existing HTML/CSS/JavaScript frontend with the Flask backend API located in `python-backend/app.py`.

## Overview

The frontend currently uses localStorage for data persistence. To integrate with the backend, we need to:

1. Replace localStorage calls with API calls
2. Handle JWT authentication
3. Update data structures to match backend DTOs

## API Base URL

Set the API base URL at the top of your JavaScript files:

```javascript
const API_BASE = 'http://127.0.0.1:8080/api';
```

## Authentication Integration

### Login Process

Replace the current login logic with API calls:

```javascript
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.ok) {
            const authResponse = await response.json();
            localStorage.setItem('token', authResponse.token);
            localStorage.setItem('username', authResponse.username);
            localStorage.setItem('role', authResponse.role);
            return true;
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}
```

### Register Process

```javascript
async function register(username, password, email, role) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                email: email,
                role: role
            })
        });

        if (response.ok) {
            const authResponse = await response.json();
            localStorage.setItem('token', authResponse.token);
            localStorage.setItem('username', authResponse.username);
            localStorage.setItem('role', authResponse.role);
            return true;
        } else {
            throw new Error('Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        return false;
    }
}
```

## Student Management Integration

### Get All Students

```javascript
async function getAllStudents() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/students`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch students');
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        return [];
    }
}
```

### Create Student

```javascript
async function createStudent(studentData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(studentData)
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to create student');
        }
    } catch (error) {
        console.error('Error creating student:', error);
        return null;
    }
}
```

## Marks Management Integration

### Get Subjects by Semester

```javascript
async function getSubjectsBySemester(semester) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/marks/subjects/semester/${semester}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch subjects');
        }
    } catch (error) {
        console.error('Error fetching subjects:', error);
        return [];
    }
}
```

### Get Marks by Student and Semester

```javascript
async function getMarksByStudentAndSemester(studentId, semester) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/marks/student/${studentId}/semester/${semester}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch marks');
        }
    } catch (error) {
        console.error('Error fetching marks:', error);
        return [];
    }
}
```

### Add Marks

```javascript
async function addMarks(markData) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/marks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(markData)
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to add marks');
        }
    } catch (error) {
        console.error('Error adding marks:', error);
        return null;
    }
}
```

### Add Subject

```javascript
async function addSubject(subjectName, semester) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/marks/subjects?subjectName=${encodeURIComponent(subjectName)}&semester=${semester}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error adding subject:', error);
        return false;
    }
}
```

### Delete Subject

```javascript
async function deleteSubject(subjectName, semester) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/marks/subjects?subjectName=${encodeURIComponent(subjectName)}&semester=${semester}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error deleting subject:', error);
        return false;
    }
}
```

## Notices Integration

### Get All Notices

```javascript
async function getAllNotices() {
    try {
        const response = await fetch(`${API_BASE}/notices`);
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch notices');
        }
    } catch (error) {
        console.error('Error fetching notices:', error);
        return [];
    }
}
```

### Create Notice (Admin only)

```javascript
async function createNotice(title, content) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/notices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to create notice');
        }
    } catch (error) {
        console.error('Error creating notice:', error);
        return null;
    }
}
```

## Data Structure Changes

### Student DTO Structure

```javascript
{
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "dateOfBirth": "2000-01-01",
    "address": "123 Main St",
    "enrollmentNumber": "EN001",
    "course": "BCA",
    "semester": 1,
    "userId": 1
}
```

### Mark DTO Structure

```javascript
{
    "id": 1,
    "studentId": 1,
    "subjectName": "Mathematics I",
    "semester": 1,
    "marks": 85,
    "grade": "A"
}
```

## Migration Steps

1. **Add API_BASE constant** to all JavaScript files
2. **Replace localStorage calls** with API calls in authentication functions
3. **Update student management** to use StudentDTO structure
4. **Modify marks functions** to use semester-wise API endpoints
5. **Update subject management** to use dynamic subject APIs
6. **Replace notice functions** with API calls
7. **Add error handling** for API failures
8. **Update UI loading states** during API calls

## Example: Updated showStudentSemesterMarks Function

```javascript
async function showStudentSemesterMarks(studentId, semester) {
    try {
        // Get subjects for the semester
        const subjects = await getSubjectsBySemester(semester);

        // Get marks for the student and semester
        const marks = await getMarksByStudentAndSemester(studentId, semester);

        // Create marks map for easy lookup
        const marksMap = {};
        marks.forEach(mark => {
            marksMap[mark.subjectName] = mark.marks;
        });

        // Display the marks
        const displayDiv = document.getElementById('studentMarksDisplay');
        if (displayDiv) {
            displayDiv.innerHTML = `
                <table class="profile-table">
                    <tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
                    ${subjects.map(subject => `
                        <tr>
                            <td>${subject}</td>
                            <td>${marksMap[subject] || 0}</td>
                            <td>${calculateGrade(marksMap[subject] || 0)}</td>
                        </tr>
                    `).join('')}
                </table>
            `;
        }
    } catch (error) {
        console.error('Error loading marks:', error);
        // Show error message to user
    }
}
```

## Testing the Integration

1. Start the backend server
2. Update frontend with API calls
3. Test authentication flow
4. Test student registration
5. Test marks entry and retrieval
6. Test subject management
7. Test notice functionality

## Error Handling

Add proper error handling for API calls:

```javascript
function handleApiError(error, defaultMessage = 'An error occurred') {
    console.error(error);
    // Show user-friendly error message
    alert(error.message || defaultMessage);
}
```

This integration guide provides a complete path to migrate from localStorage to a full backend API system.
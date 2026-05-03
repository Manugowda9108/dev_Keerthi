# College Portal System

A complete college management system with dynamic semester-wise marks, student registration, and admin functionality.

## 🚀 Quick Start

### 1. Start the Backend Server
**Option A: Double-click the batch file**
- Double-click `start_server.bat` in the project root

**Option B: Manual start**
```bash
cd python-backend
python app.py
```

The server will start on `http://127.0.0.1:8080`

### 2. Open the Frontend
- Open `index.html` in your web browser
- Navigate through the application

### 3. Demo Accounts
- **Admin**: username: `admin`, password: `admin123`
- **Student**: Register a new account or use existing ones

## Project Structure

```
college-portal/
├── frontend/                 # HTML/CSS/JavaScript frontend
│   ├── index.html           # Home page
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── dashboard.html       # Student dashboard
│   ├── admin-dashboard.html # Admin dashboard
│   ├── profile.html         # Student profile
│   ├── script.js            # Main JavaScript functionality
│   ├── style.css            # Main stylesheet
│   └── *.html               # Other pages
├── python-backend/         # Flask backend (Python)
│   ├── app.py              # Main application
│   ├── requirements.txt    # Python dependencies
│   ├── run.bat            # Windows run script
│   └── db.sqlite          # SQLite database (auto-created)
├── start_server.bat       # Easy server startup
├── FRONTEND_INTEGRATION.md  # Integration guide
├── BUG_FIXES_REPORT.md     # Bug fixes documentation
└── README.md               # This file
```

## Features

### Frontend Features
- **Responsive Design**: Works on desktop and mobile devices
- **Semester-wise Marks**: 6-semester system with dynamic subjects
- **Dynamic Subject Management**: Add/delete subjects per semester
- **Student Registration**: Complete application form with document upload
- **Admin Dashboard**: Manage students, notices, and marks
- **Local Storage**: Data persistence without backend

### Backend Features
- **RESTful APIs**: Complete API suite for all operations
- **JWT Authentication**: Secure token-based authentication
- **Dynamic Subjects**: Database-driven subject management
- **Student Management**: CRUD operations for student data
- **Marks Management**: Semester-wise marks with grades
- **Notice Board**: Admin-managed announcements
- **SQLite Database**: Relational data storage

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Local Storage for data persistence
- Responsive design with CSS Grid/Flexbox

### Backend
- Python 3.11+, Flask 3.x
- Flask-CORS for cross-origin requests
- Flask-JWT-Extended for authentication
- SQLite 3 database
- BCrypt for password hashing

## Quick Start

### Prerequisites
- Python 3.12+ (for backend)
- A modern web browser (for frontend)

### 1. Backend Setup (Windows)

```bash
cd backend
# Run the setup script (installs prerequisites if needed)
setup.bat
```

If Maven is not installed, `setup.bat` will attempt to download a local copy of Apache Maven.

Or manually:
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE college_portal;"

# Configure application.properties with your MySQL credentials

# Build and run
mvn clean install
mvn spring-boot:run
```

### 2. Frontend Setup

Simply open `index.html` in your web browser. The frontend works independently with localStorage.

### 3. Integration (Optional)

To connect frontend with backend:
1. Follow the `FRONTEND_INTEGRATION.md` guide
2. Update API_BASE URL in JavaScript files
3. Replace localStorage calls with API calls

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/{id}` - Get student by ID
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Marks & Subjects
- `GET /api/marks/student/{studentId}/semester/{semester}` - Get marks
- `POST /api/marks` - Add marks
- `PUT /api/marks/{id}` - Update marks
- `DELETE /api/marks/{id}` - Delete marks
- `GET /api/marks/subjects/semester/{semester}` - Get subjects
- `POST /api/marks/subjects` - Add subject
- `DELETE /api/marks/subjects` - Delete subject

### Notices
- `GET /api/notices` - Get all notices
- `POST /api/notices` - Create notice (admin)
- `PUT /api/notices/{id}` - Update notice
- `DELETE /api/notices/{id}` - Delete notice

## Sample Data

The backend includes sample data:
- **Admin Account**: `admin` / `admin123`
- **Subjects**: Pre-loaded subjects for all 6 semesters
- **Subjects**: Pre-loaded subjects for all 6 semesters
- **Notices**: Sample announcements

## Key Features Explained

### Dynamic Semester System
- **6 Semesters**: Complete degree program structure
- **Flexible Subjects**: Add/remove subjects per semester
- **Marks Tracking**: Individual subject marks with grades
- **Grade Calculation**: Automatic grade assignment based on marks

### Student Lifecycle
1. **Registration**: Complete application with documents
2. **Profile Management**: Update personal information
3. **Marks Entry**: Semester-wise academic performance
4. **Progress Tracking**: View marks across all semesters

### Admin Capabilities
- **Student Management**: View/edit all student records
- **Marks Management**: Enter/update student marks
- **Subject Management**: Configure subjects per semester
- **Notice Board**: Post announcements and updates

## Development

### Frontend Development
- Edit HTML files for structure
- Modify `style.css` for styling
- Update `script.js` for functionality
- Test in browser with developer tools

### Backend Development
- Add entities in `entity/` package
- Create repositories in `repository/` package
- Implement services in `service/` package
- Add controllers in `controller/` package
- Update `application.properties` for configuration

## Deployment

### Backend Deployment
```bash
# Build JAR
mvn clean package

# Run JAR
java -jar target/college-portal-backend-1.0.0.jar
```

### Frontend Deployment
- Host HTML/CSS/JS files on any web server
- Update API_BASE URL for production backend
- Ensure CORS is configured for cross-origin requests

## Learning Outcomes

This project demonstrates:
- **Full-Stack Development**: Frontend + Backend integration
- **RESTful API Design**: Proper HTTP methods and status codes
- **Database Design**: Relational modeling with JPA
- **Security**: JWT authentication and authorization
- **Modern JavaScript**: ES6+ features and async/await
- **Spring Boot**: Dependency injection and configuration
- **Responsive Design**: Mobile-first CSS approach

## Support

- Check `FRONTEND_INTEGRATION.md` for API integration details
- Review `backend/README.md` for backend-specific documentation
- Test with sample data: admin/admin123
- Use browser developer tools for frontend debugging
- Check Spring Boot logs for backend issues

## Future Enhancements

- File upload for documents
- Email notifications
- Advanced reporting and analytics
- Mobile app development
- Multi-tenancy for multiple colleges
- Integration with external systems (payment, SMS, etc.)


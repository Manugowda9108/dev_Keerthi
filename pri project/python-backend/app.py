from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import timedelta
import os

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-college-portal-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)
CORS(app)

# SQLite DB
DB_FILE = 'db.sqlite'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def normalize_student_row(student_row):
    if not student_row:
        return None
    return {
        'id': student_row['id'],
        'userId': student_row['user_id'],
        'username': student_row['username'],
        'email': student_row['email'],
        'firstName': student_row['first_name'],
        'lastName': student_row['last_name'],
        'phone': student_row['phone'],
        'course': student_row['course'],
        'gender': student_row['gender'],
        'dateOfBirth': student_row['date_of_birth'],
        'address': student_row['address'],
        'fatherName': student_row['father_name'],
        'motherName': student_row['mother_name'],
        'caste': student_row['caste'],
        'nationality': student_row['nationality'],
        'state': student_row['state'],
        'pincode': student_row['pincode'],
        'applicationStatus': student_row['application_status']
    }

def normalize_marks_row(mark_row):
    if not mark_row:
        return None
    return {
        'id': mark_row['id'],
        'studentId': mark_row['student_id'],
        'subjectName': mark_row['subject_name'],
        'semester': mark_row['semester'],
        'marksObtained': mark_row['marks_obtained'],
        'grade': mark_row['grade']
    }

def calculate_grade(marks):
    if marks >= 90:
        return 'A+'
    if marks >= 80:
        return 'A'
    if marks >= 70:
        return 'B'
    if marks >= 60:
        return 'C'
    if marks >= 50:
        return 'D'
    return 'F'

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT, role TEXT DEFAULT 'STUDENT')''')
    c.execute('''CREATE TABLE IF NOT EXISTS students
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, username TEXT, email TEXT, first_name TEXT, last_name TEXT, phone TEXT, course TEXT, gender TEXT, date_of_birth TEXT, address TEXT, father_name TEXT, mother_name TEXT, caste TEXT, nationality TEXT, state TEXT, pincode TEXT, application_status TEXT DEFAULT 'PENDING')''')
    c.execute('''CREATE TABLE IF NOT EXISTS marks
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, subject_name TEXT, semester INTEGER, marks_obtained REAL DEFAULT 0, grade TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS notices
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, priority TEXT DEFAULT 'Normal')''')
    
    # Sample admin
    admin_hash = generate_password_hash('admin123')
    c.execute("INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES ('admin', 'admin@college.com', ?, 'ADMIN')", (admin_hash,))
    c.execute("INSERT OR IGNORE INTO notices (title, content) VALUES ('Welcome!', 'College portal live.')")
    
    conn.commit()
    conn.close()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    if not all(k in data and data[k] for k in ['username', 'email', 'password']):
        return jsonify({'error': 'username, email and password are required'}), 400
    username = data['username']
    email = data['email']
    password = data['password']
    firstName = data.get('firstName', '')
    lastName = data.get('lastName', '')
    phone = data.get('phone', '')
    
    conn = get_db_connection()
    c = conn.cursor()
    try:
        hash_pw = generate_password_hash(password)
        c.execute("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'STUDENT')", (username, email, hash_pw))
        user_id = c.lastrowid
        additional_claims = {'username': username, 'role': 'STUDENT'}
        access_token = create_access_token(identity=str(user_id), additional_claims=additional_claims)
        return jsonify({'token': access_token, 'id': user_id, 'username': username, 'role': 'STUDENT'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email exists'}), 409
    finally:
        conn.commit()
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    if not all(k in data and data[k] for k in ['username', 'password']):
        return jsonify({'error': 'username and password are required'}), 400
    username = data['username']
    password = data['password']
    
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user and check_password_hash(user[2], password):
        additional_claims = {'username': user[1], 'role': user[3]}
        access_token = create_access_token(identity=str(user[0]), additional_claims=additional_claims)
        return jsonify({'token': access_token, 'id': user[0], 'username': user[1], 'role': user[3]})
    return jsonify({'error': 'Invalid credentials'}), 401

# Students
@app.route('/api/students', methods=['GET'])
@jwt_required()
def get_students():
    claims = get_jwt()
    if claims['role'] != 'ADMIN':
        return jsonify({'error': 'Admin only'}), 403
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM students")
    students = [normalize_student_row(row) for row in c.fetchall()]
    conn.close()
    return jsonify(students)

@app.route('/api/students', methods=['POST'])
@jwt_required()
def create_student():
    data = request.json or {}
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('''INSERT INTO students (user_id, username, email, first_name, last_name, phone, course, gender, date_of_birth, address, father_name, mother_name, caste, nationality, state, pincode, application_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''', 
              (data['userId'], data['username'], data['email'], data.get('firstName'), data.get('lastName'), data.get('phone'), data.get('course'), data.get('gender'), data.get('dateOfBirth'), data.get('address'), data.get('fatherName'), data.get('motherName'), data.get('caste'), data.get('nationality'), data.get('state'), data.get('pincode'), data.get('applicationStatus', 'PENDING')))
    student_id = c.lastrowid
    conn.commit()
    c.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    created = normalize_student_row(c.fetchone())
    conn.close()
    return jsonify(created), 201

# ... more endpoints similar

@app.route('/api/students/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_student(user_id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    student = normalize_student_row(c.fetchone())
    conn.close()
    if student:
        return jsonify(student)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/students/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_student(user_id):
    data = request.json or {}
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM students WHERE user_id = ?", (user_id,))
    existing = c.fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    c.execute(
        '''UPDATE students SET username = ?, email = ?, first_name = ?, last_name = ?, phone = ?, course = ?, gender = ?, date_of_birth = ?, address = ?, father_name = ?, mother_name = ?, caste = ?, nationality = ?, state = ?, pincode = ?, application_status = ? WHERE user_id = ?''',
        (
            data.get('username'),
            data.get('email'),
            data.get('firstName'),
            data.get('lastName'),
            data.get('phone'),
            data.get('course'),
            data.get('gender'),
            data.get('dateOfBirth'),
            data.get('address'),
            data.get('fatherName'),
            data.get('motherName'),
            data.get('caste'),
            data.get('nationality'),
            data.get('state'),
            data.get('pincode'),
            data.get('applicationStatus', 'PENDING'),
            user_id
        )
    )
    conn.commit()
    c.execute("SELECT * FROM students WHERE user_id = ?", (user_id,))
    updated = normalize_student_row(c.fetchone())
    conn.close()
    return jsonify(updated)

@app.route('/api/marks/student/<int:student_id>/semester/<int:semester>', methods=['GET'])
@jwt_required()
def get_student_marks(student_id, semester):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM marks WHERE student_id = ? AND semester = ?", (student_id, semester))
    marks = [normalize_marks_row(row) for row in c.fetchall()]
    conn.close()
    return jsonify(marks)

@app.route('/api/marks', methods=['POST'])
@jwt_required()
def create_marks():
    data = request.json or {}
    required = ['studentId', 'subjectName', 'semester', 'marksObtained']
    if not all(k in data for k in required):
        return jsonify({'error': 'studentId, subjectName, semester and marksObtained are required'}), 400

    marks_obtained = float(data['marksObtained'])
    grade = calculate_grade(marks_obtained)
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO marks (student_id, subject_name, semester, marks_obtained, grade) VALUES (?, ?, ?, ?, ?)",
        (data['studentId'], data['subjectName'], data['semester'], marks_obtained, grade)
    )
    mark_id = c.lastrowid
    conn.commit()
    c.execute("SELECT * FROM marks WHERE id = ?", (mark_id,))
    created = normalize_marks_row(c.fetchone())
    conn.close()
    return jsonify(created), 201

@app.route('/api/marks/<int:mark_id>', methods=['PUT'])
@jwt_required()
def update_marks(mark_id):
    data = request.json or {}
    marks_obtained = float(data.get('marksObtained', 0))
    grade = calculate_grade(marks_obtained)
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "UPDATE marks SET subject_name = ?, semester = ?, marks_obtained = ?, grade = ? WHERE id = ?",
        (data.get('subjectName'), data.get('semester'), marks_obtained, grade, mark_id)
    )
    if c.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Not found'}), 404
    conn.commit()
    c.execute("SELECT * FROM marks WHERE id = ?", (mark_id,))
    updated = normalize_marks_row(c.fetchone())
    conn.close()
    return jsonify(updated)

@app.route('/api/notices', methods=['GET'])
def get_notices():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM notices ORDER BY id DESC")
    notices = [dict(row) for row in c.fetchall()]
    conn.close()
    return jsonify(notices)

@app.route('/api/notices', methods=['POST'])
@jwt_required()
def create_notice():
    claims = get_jwt()
    if claims['role'] != 'ADMIN':
        return jsonify({'error': 'Admin only'}), 403

    data = request.json or {}
    if not all(k in data and data[k] for k in ['title', 'content']):
        return jsonify({'error': 'title and content are required'}), 400

    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "INSERT INTO notices (title, content, priority) VALUES (?, ?, ?)",
        (data['title'], data['content'], data.get('priority', 'Normal'))
    )
    notice_id = c.lastrowid
    conn.commit()
    c.execute("SELECT * FROM notices WHERE id = ?", (notice_id,))
    created = dict(c.fetchone())
    conn.close()
    return jsonify(created), 201

if __name__ == '__main__':
    init_db()
    app.run(port=8080, debug=True)

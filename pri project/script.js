
function goPage(p){
window.location=p;
}

let studentFormCurrentStep = 0;
let adminStudents = [];
let currentStudent = null;
let currentStudentMarks = [];
let currentMarksSemester = 1;
let notifications = [];
const API_BASE = 'http://127.0.0.1:8080/api';
const courseFees = {
  'B.COM': 4500,
  'BBA': 5000,
  'BCA': 5200,
  'B.SC': 4800
};

function getAuthToken(){
  return localStorage.getItem('authToken');
}

function getCurrentUserId(){
  return localStorage.getItem('userId');
}

function getCurrentUserRole(){
  return localStorage.getItem('userRole');
}

function isAdminUser(){
  return getCurrentUserRole() === 'ADMIN';
}

function saveAuthSession(auth){
  if(!auth) return;
  localStorage.setItem('authToken', auth.token);
  if(auth.id) localStorage.setItem('userId', auth.id);
  if(auth.username) localStorage.setItem('username', auth.username);
  if(auth.role) localStorage.setItem('userRole', auth.role);
}

function clearAuthSession(){
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
}

async function apiRequest(path, method='GET', body=null, auth=false){
  let headers = {};
  let payload = null;
  if(body && !(body instanceof FormData)){
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  } else if(body){
    payload = body;
  }
  if(auth){
    let token = getAuthToken();
    if(token){
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return fetch(API_BASE + path, {
    method,
    headers,
    body: payload
  });
}

async function fetchAllStudents(){
  let response = await apiRequest('/students', 'GET', null, true);
  if(!response.ok) return [];
  return response.json();
}

async function fetchStudentMarksBySemester(studentId, semester){
  let response = await apiRequest(`/marks/student/${studentId}/semester/${semester}`, 'GET', null, true);
  if(!response.ok) return [];
  return response.json();
}

async function fetchCurrentStudent(){
  let userId = getCurrentUserId();
  if(!userId) return null;
  let response = await apiRequest(`/students/user/${userId}`, 'GET', null, true);
  if(!response.ok) return null;
  return response.json();
}

function getLoggedUsername(){
  return localStorage.getItem('username') || '';
}

function redirectToLogin(role){
  if(role === 'ADMIN') window.location = 'admin-login.html';
  else window.location = 'login.html';
}

function requireStudentAuth(){
  let token = getAuthToken();
  let role = getCurrentUserRole();
  if(!token || role !== 'STUDENT'){
    window.location = 'login.html';
    return false;
  }
  return true;
}

function requireAdminAuth(){
  let token = getAuthToken();
  let role = getCurrentUserRole();
  if(!token || role !== 'ADMIN'){
    window.location = 'admin-login.html';
    return false;
  }
  return true;
}

function setFeeForCourse(course){
  let feeInput = document.getElementById('app-feeAmount');
  if(!feeInput) return;
  let fee = courseFees[course] || 5000;
  feeInput.value = fee;
}

function initHome(){
setInterval(()=>{
let now=new Date();
document.getElementById("date").innerHTML="Date: "+now.toDateString();
document.getElementById("time").innerHTML="Time: "+now.toLocaleTimeString();
},1000)

setupScrollReveal();
}

function showApplicationStep(n){
let tabs = document.querySelectorAll('.application-tab');
if(!tabs.length) return;
if(n >= tabs.length) n = tabs.length - 1;
if(n < 0) n = 0;
studentFormCurrentStep = n;

tabs.forEach((tab, idx)=>{
  if(idx === n){
    tab.style.display = 'block';
    tab.classList.add('active');
    setTimeout(()=> tab.classList.add('fade-in'), 10);
  } else {
    tab.classList.remove('fade-in');
    tab.classList.remove('active');
    tab.style.display = 'none';
  }
});

let prev = document.getElementById('prevBtn');
let next = document.getElementById('nextBtn');
if(prev) prev.style.display = n === 0 ? 'none' : 'inline';
if(next) next.innerHTML = n === (tabs.length - 1) ? 'Submit' : 'Next';

let dots = document.getElementsByClassName('step');
for(let i=0; i<dots.length; i++){
  dots[i].className = dots[i].className.replace(' active','').replace(' finish','');
  if(i === n) dots[i].className += ' active';
  if(i < n) dots[i].className += ' finish';
}

let indicator = document.getElementById('stepIndicator');
if(indicator) indicator.textContent = `Step ${n+1} of ${tabs.length}`;
}

function nextPrev(n){
let tabs = document.querySelectorAll('.application-tab');
if(!tabs.length) return false;

if(n===1 && !validateApplicationFormStep(studentFormCurrentStep)) return false;

studentFormCurrentStep += n;
if(studentFormCurrentStep >= tabs.length){
  return submitApplication();
}
showApplicationStep(studentFormCurrentStep);
if(studentFormCurrentStep === tabs.length - 1){
  initPaymentGateway();
}
}

function validateApplicationFormStep(step){
let valid = true;
let requiredFields = [];
if(step===0){
  requiredFields = ['app-name','app-phone','app-email','app-course','app-gender','app-dob','app-address','app-fatherName','app-motherName','app-caste','app-nationality','app-state','app-pincode'];
} else if(step===1){
  requiredFields = ['app-studentPhoto','app-adharFile','app-marksCardFile','app-rationCardFile','app-terms'];
} else if(step===2){
  requiredFields = ['app-paymentMethod','app-transactionId'];
}

requiredFields.forEach(id=>{
  let el = document.getElementById(id);
  if(!el || (el.type === 'checkbox' ? !el.checked : !el.value)){
    valid=false;
    let err = document.getElementById('err-' + id);
    if(err) err.textContent = 'This field is required';
    if(el) el.classList.add('input-invalid');
  } else {
    let err = document.getElementById('err-' + id);
    if(err) err.textContent = '';
    if(el) el.classList.remove('input-invalid');
  }
});

return valid;
}

async function adminLogin(event){
  if(event) event.preventDefault();
  let username = document.getElementById('adminUsername')?.value || '';
  let password = document.getElementById('adminPassword')?.value || '';
  let response = await apiRequest('/auth/login', 'POST', { username, password });
  if(response.ok){
    let auth = await response.json();
    if(auth.role === 'ADMIN'){
      saveAuthSession(auth);
      window.location = 'admin-dashboard.html';
      return false;
    }
  }
  let errorDiv = document.getElementById('adminLoginError');
  if(errorDiv){
    errorDiv.textContent = 'Invalid username or password';
    errorDiv.style.display = 'block';
  }
  return false;
}

async function loadAdminDashboard(){
  if(!requireAdminAuth()) return;

  let adminName = getLoggedUsername() || 'Admin';
  document.getElementById('adminName').textContent = adminName;

  adminStudents = await fetchAllStudents();
  updateAdminStats();
  loadStudentsTable();
  loadApplicationsTable();
  showAdminSection('summary');
}

function updateAdminStats(){
  let submittedApps = 0;
  let approvedApps = 0;
  let rejectedApps = 0;

  adminStudents.forEach(s=>{
    if(s.email) submittedApps++;
    if(s.applicationStatus && s.applicationStatus.toLowerCase() === 'approved') approvedApps++;
    if(s.applicationStatus && s.applicationStatus.toLowerCase() === 'rejected') rejectedApps++;
  });

  document.getElementById('totalStudents').textContent = adminStudents.length;
  document.getElementById('totalApplications').textContent = submittedApps;
  document.getElementById('approvedApplications').textContent = approvedApps;
  document.getElementById('pendingApplications').textContent = submittedApps - approvedApps - rejectedApps;
}

function formatStudentName(student){
  return `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
}

function formatStudentStatus(student){
  if(!student.email) return '<span style="color:#d97706;">Pending</span>';
  if(student.applicationStatus && student.applicationStatus.toLowerCase() === 'approved') return '<span style="color:#2b8a57;">Approved</span>';
  if(student.applicationStatus && student.applicationStatus.toLowerCase() === 'rejected') return '<span style="color:#e84d60;">Rejected</span>';
  return '<span style="color:#2b8a57;">Submitted</span>';
}

function loadStudentsTable(){
  let tbody = document.getElementById('studentsTableBody');
  if(!tbody) return;

  tbody.innerHTML = adminStudents.map((s)=>{
    return `
    <tr>
      <td>${formatStudentName(s)}</td>
      <td>${s.email || '-'}</td>
      <td>${s.phone || '-'}</td>
      <td>${s.course || '-'}</td>
      <td>${formatStudentStatus(s)}</td>
      <td><button onclick="viewStudentDetailsAdmin(${s.userId})">View</button></td>
    </tr>`;
  }).join('');
}

function loadApplicationsTable(){
  let tbody = document.getElementById('applicationsTableBody');
  if(!tbody) return;

  tbody.innerHTML = adminStudents.filter(s=>s.email).map(s=>{
    let studentName = formatStudentName(s);
    let status = s.applicationStatus ? s.applicationStatus.toLowerCase() : 'submitted';
    return `
    <tr>
      <td>${studentName}</td>
      <td>${s.email}</td>
      <td>${s.course || '-'}</td>
      <td>${new Date().toLocaleDateString()}</td>
      <td>
        <select onchange="updateApplicationStatus(this.value, ${s.userId})" style="padding:4px; border:1px solid #d0d6eb; border-radius:6px;">
          <option value="submitted" ${status==='submitted' ? 'selected' : ''}>Submitted</option>
          <option value="approved" ${status==='approved' ? 'selected' : ''}>Approved</option>
          <option value="rejected" ${status==='rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td><button onclick="viewStudentDetailsAdmin(${s.userId})">Details</button></td>
    </tr>`;
  }).join('');
}

async function updateApplicationStatus(status, userId){
  let student = adminStudents.find(s=>s.userId === userId);
  if(!student) return;

  let payload = {
    userId: student.userId,
    username: student.username,
    email: student.email,
    firstName: student.firstName,
    lastName: student.lastName,
    phone: student.phone,
    dateOfBirth: student.dateOfBirth,
    address: student.address,
    course: student.course,
    gender: student.gender,
    caste: student.caste,
    nationality: student.nationality,
    state: student.state,
    pincode: student.pincode,
    aadharNumber: student.aadharNumber,
    studentPhoto: student.studentPhoto,
    adharFile: student.adharFile,
    marksCardFile: student.marksCardFile,
    rationCardFile: student.rationCardFile,
    fatherName: student.fatherName,
    motherName: student.motherName,
    applicationStatus: status
  };

  let response = await apiRequest(`/students/${userId}`, 'PUT', payload, true);
  if(!response.ok){
    alert('Unable to update application status.');
    return;
  }

  let updatedStudent = await response.json();
  let index = adminStudents.findIndex(s=>s.userId === userId);
  if(index !== -1){
    adminStudents[index] = updatedStudent;
  }

  sendNotification(formatStudentName(updatedStudent), status === 'approved' ? 'approval' : 'rejection', `Application status changed to ${status}`);
  updateAdminStats();
  loadApplicationsTable();
  alert('Application status updated to: ' + status + '\nNotification queued.');
}

function viewStudentDetailsAdmin(userId){
  let student = adminStudents.find(s=>s.userId === userId);
  if(!student) return;

  let modal = document.getElementById('studentModal');
  let content = document.getElementById('studentModalContent');
  if(!modal || !content) return;

  content.innerHTML = `
    <table class="profile-table" style="width:100%;">
      <tr><th>Name</th><td>${formatStudentName(student)}</td></tr>
      <tr><th>Email</th><td>${student.email || '-'}</td></tr>
      <tr><th>Phone</th><td>${student.phone || '-'}</td></tr>
      <tr><th>Course</th><td>${student.course || '-'}</td></tr>
      <tr><th>Gender</th><td>${student.gender || '-'}</td></tr>
      <tr><th>Date of Birth</th><td>${student.dateOfBirth || '-'}</td></tr>
      <tr><th>Address</th><td>${student.address || '-'}</td></tr>
      <tr><th>Father's Name</th><td>${student.fatherName || '-'}</td></tr>
      <tr><th>Mother's Name</th><td>${student.motherName || '-'}</td></tr>
      <tr><th>Caste</th><td>${student.caste || '-'}</td></tr>
      <tr><th>Nationality</th><td>${student.nationality || '-'}</td></tr>
      <tr><th>State</th><td>${student.state || '-'}</td></tr>
      <tr><th>Pincode</th><td>${student.pincode || '-'}</td></tr>
      <tr><th>Application Status</th><td>${student.applicationStatus || 'Not Submitted'}</td></tr>
    </table>
  `;
  modal.style.display = 'flex';
}

function viewApplicationDetails(userId){
  viewStudentDetailsAdmin(userId);
}

function filterStudentsTable(){
  let query = document.getElementById('studentSearchBox')?.value.toLowerCase() || '';
  let rows = document.querySelectorAll('#studentsTableBody tr');
  rows.forEach(row=>{
    let text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

function filterApplications(filter){
  let filtered = filter === 'all'
    ? adminStudents.filter(s => s.email)
    : filter === 'submitted'
      ? adminStudents.filter(s => s.email && (!s.applicationStatus || s.applicationStatus.toLowerCase() === 'submitted'))
      : filter === 'approved'
        ? adminStudents.filter(s => s.email && s.applicationStatus && s.applicationStatus.toLowerCase() === 'approved')
        : adminStudents.filter(s => s.email && s.applicationStatus && s.applicationStatus.toLowerCase() === 'rejected');

  let tbody = document.getElementById('applicationsTableBody');
  if(!tbody) return;

  tbody.innerHTML = filtered.map(s=>{
    let studentName = formatStudentName(s);
    let status = s.applicationStatus ? s.applicationStatus.toLowerCase() : 'submitted';
    return `
    <tr>
      <td>${studentName}</td>
      <td>${s.email}</td>
      <td>${s.course || '-'}</td>
      <td>${new Date().toLocaleDateString()}</td>
      <td>
        <select onchange="updateApplicationStatus(this.value, ${s.userId})" style="padding:4px; border:1px solid #d0d6eb; border-radius:6px;">
          <option value="submitted" ${status==='submitted' ? 'selected' : ''}>Submitted</option>
          <option value="approved" ${status==='approved' ? 'selected' : ''}>Approved</option>
          <option value="rejected" ${status==='rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td><button onclick="viewStudentDetailsAdmin(${s.userId})">Details</button></td>
    </tr>`;
  }).join('');
}

function searchStudentForMarks(){
  let query = document.getElementById('marksSearchBox')?.value.toLowerCase() || '';
  let student = adminStudents.find(s=>formatStudentName(s).toLowerCase().includes(query));
  
  let container = document.getElementById('marksResultContainer');
  if(!container) return;
  
  if(!student){
    container.innerHTML = '<p style="color:#d97706;">Student not found</p>';
    return;
  }
  
  container.innerHTML = `
    <h4>${formatStudentName(student)}'s Marks</h4>
    <div class="year-buttons">
      <button onclick="showStudentSemesterMarks(${student.userId}, 1)">1st Semester</button>
      <button onclick="showStudentSemesterMarks(${student.userId}, 2)">2nd Semester</button>
      <button onclick="showStudentSemesterMarks(${student.userId}, 3)">3rd Semester</button>
      <button onclick="showStudentSemesterMarks(${student.userId}, 4)">4th Semester</button>
      <button onclick="showStudentSemesterMarks(${student.userId}, 5)">5th Semester</button>
      <button onclick="showStudentSemesterMarks(${student.userId}, 6)">6th Semester</button>
    </div>
    <div id="studentMarksDisplay"></div>
  `;
  showStudentSemesterMarks(student.userId, 1);
}

async function showStudentSemesterMarks(userId, semester){
  let student = adminStudents.find(s=>s.userId === userId);
  if(!student) return;

  let marks = await fetchStudentMarksBySemester(userId, semester);
  currentStudentMarks = marks;
  currentMarksSemester = semester;

  let displayDiv = document.getElementById('studentMarksDisplay');
  if(!displayDiv) return;

  if(!marks || marks.length === 0){
    displayDiv.innerHTML = '<p style="color:#666;">No marks recorded for this semester.</p>';
    return;
  }

  displayDiv.innerHTML = `<table class="profile-table">
    <tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
    ${marks.map(m=>`<tr><td>${m.subjectName}</td><td>${m.marksObtained || 0}</td><td>${m.grade || '-'}</td></tr>`).join('')}
  </table>`;
}

function showAdminSection(section){
  document.querySelectorAll('.admin-section').forEach(s=>s.style.display='none');
  let el = document.getElementById(section + 'Section');
  if(el) el.style.display = 'block';
  
  // Load specific section data
  if(section === 'notices'){
    loadAdminNotices();
  }
}

function closeStudentModal(){
  let modal = document.getElementById('studentModal');
  if(modal) modal.style.display = 'none';
}

function adminLogout(){
  clearAuthSession();
  window.location = 'index.html';
}

async function registerStudent(event){
  if(event) event.preventDefault();
  let formErrors = document.getElementById('form-errors');
  if(formErrors) formErrors.style.display = 'none';

  let setFieldError = (inputId, errId, message) => {
    let input = document.getElementById(inputId);
    let err = document.getElementById(errId);
    if(input) input.classList.add('input-invalid');
    if(err) err.textContent = message;
  };

  let clearFieldError = (inputId, errId) => {
    let input = document.getElementById(inputId);
    let err = document.getElementById(errId);
    if(input) input.classList.remove('input-invalid');
    if(err) err.textContent = '';
  };

  clearFieldError('name','err-name');
  clearFieldError('email','err-email');
  clearFieldError('firstName','err-firstName');
  clearFieldError('lastName','err-lastName');
  clearFieldError('phone','err-phone');
  clearFieldError('password','err-password');
  clearFieldError('confirmPassword','err-confirmPassword');

  let username = (document.getElementById('name')?.value || '').trim();
  let email = (document.getElementById('email')?.value || '').trim();
  let firstName = (document.getElementById('firstName')?.value || '').trim();
  let lastName = (document.getElementById('lastName')?.value || '').trim();
  let phone = (document.getElementById('phone')?.value || '').trim();
  let password = (document.getElementById('password')?.value || '');
  let confirm = (document.getElementById('confirmPassword')?.value || '');

  let errors = [];

  let isValidName = (v) => /^[A-Za-z ]{3,}$/.test(v);
  let isValidPhone = (v) => {
    let digits = v.replace(/\D/g, '');
    if(digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    return digits.length === 10;
  };
  let isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  let isValidPassword = (v) => /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(v);

  if(!isValidName(username)){
    errors.push('Please enter a valid username.');
    setFieldError('name','err-name','Enter at least 3 letters (A-Z only).');
  }
  if(!isValidEmail(email)){
    errors.push('Please enter a valid email.');
    setFieldError('email','err-email','Enter a valid email address.');
  }
  if(!isValidName(firstName)){
    errors.push('Please enter a valid first name.');
    setFieldError('firstName','err-firstName','Enter at least 3 letters.');
  }
  if(!isValidName(lastName)){
    errors.push('Please enter a valid last name.');
    setFieldError('lastName','err-lastName','Enter at least 3 letters.');
  }
  if(!isValidPhone(phone)){
    errors.push('Please enter a valid phone number.');
    setFieldError('phone','err-phone','Enter a valid 10-digit mobile number.');
  }
  if(!isValidPassword(password)){
    errors.push('Please enter a stronger password.');
    setFieldError('password','err-password','Min 6 chars with letters and numbers.');
  }
  if(confirm !== password){
    errors.push('Confirm password does not match.');
    setFieldError('confirmPassword','err-confirmPassword','Password must match.');
  }

  if(errors.length>0){
    if(formErrors){
      formErrors.innerHTML = errors.slice(0,3).map(e=>`<div>${e}</div>`).join('');
      formErrors.style.display = 'block';
    }
    return false;
  }

  try {
    let response = await apiRequest('/auth/register', 'POST', {
      username,
      email,
      password,
      firstName,
      lastName,
      phone
    });

    if(response.ok){
      showSuccessPopup("Registered successfully! Redirecting to Login page...", "login.html", 2200);
      // Backup redirect in case modal is blocked/closed.
      setTimeout(() => { window.location = 'login.html'; }, 2600);
      return false;
    }

    let msg = 'Registration failed. Please try again.';
    try {
      let errData = await response.json();
      if(errData && errData.error) msg = errData.error;
    } catch (_) {}

    if(formErrors){
      formErrors.innerHTML = `<div>${msg}</div>`;
      formErrors.style.display = 'block';
    } else {
      alert(msg);
    }
  } catch (err) {
    let msg = 'Unable to connect to server. Please start backend and try again.';
    if(formErrors){
      formErrors.innerHTML = `<div>${msg}</div>`;
      formErrors.style.display = 'block';
    } else {
      alert(msg);
    }
  }
  return false;
}

async function submitApplication(){

let formErrors=document.getElementById("app-form-errors");
if(formErrors) formErrors.style.display="none";

let setFieldError=(inputId, errId, message)=>{
let input=document.getElementById(inputId);
let err=document.getElementById(errId);

if(input) input.classList.add("input-invalid");
if(err) err.textContent=message;
};

let clearFieldError=(inputId, errId)=>{
let input=document.getElementById(inputId);
let err=document.getElementById(errId);
if(input) input.classList.remove("input-invalid");
if(err) err.textContent="";
};

// Clear errors
clearFieldError("app-email","err-app-email");
clearFieldError("app-course","err-app-course");
clearFieldError("app-gender","err-app-gender");
clearFieldError("app-dob","err-app-dob");
clearFieldError("app-address","err-app-address");
clearFieldError("app-fatherName","err-app-fatherName");
clearFieldError("app-motherName","err-app-motherName");
clearFieldError("app-caste","err-app-caste");
clearFieldError("app-nationality","err-app-nationality");
clearFieldError("app-state","err-app-state");
clearFieldError("app-pincode","err-app-pincode");
clearFieldError("app-studentPhoto","err-app-studentPhoto");
clearFieldError("app-adharFile","err-app-adharFile");
clearFieldError("app-marksCardFile","err-app-marksCardFile");
clearFieldError("app-rationCardFile","err-app-rationCardFile");
clearFieldError("app-terms","err-app-terms");

let emailEl=document.getElementById("app-email");
let courseEl=document.getElementById("app-course");
let genderEl=document.getElementById("app-gender");
let dobEl=document.getElementById("app-dob");
let addressEl=document.getElementById("app-address");
let fatherNameEl=document.getElementById("app-fatherName");
let motherNameEl=document.getElementById("app-motherName");
let casteEl=document.getElementById("app-caste");
let nationalityEl=document.getElementById("app-nationality");
let stateEl=document.getElementById("app-state");
let pincodeEl=document.getElementById("app-pincode");
let studentPhotoEl=document.getElementById("app-studentPhoto");
let adharEl=document.getElementById("app-adharFile");
let marksCardEl=document.getElementById("app-marksCardFile");
let rationCardEl=document.getElementById("app-rationCardFile");
let termsEl=document.getElementById("app-terms");

let email=(emailEl?.value || "").trim();
let course=(courseEl?.value || "").trim();
let gender=(genderEl?.value || "").trim();
let dob=(dobEl?.value || "").trim();
let address=(addressEl?.value || "").trim();
let fatherName=(fatherNameEl?.value || "").trim();
let motherName=(motherNameEl?.value || "").trim();
let caste=(casteEl?.value || "").trim();
let nationality=(nationalityEl?.value || "").trim();
let state=(stateEl?.value || "").trim();
let pincode=(pincodeEl?.value || "").trim();
let studentPhoto=studentPhotoEl?.files?.[0];
let adharFile=adharEl?.files?.[0];
let marksCardFile=marksCardEl?.files?.[0];
let rationCardFile=rationCardEl?.files?.[0];
let terms=!!termsEl?.checked;

let errors=[];

let isValidName=(v)=>{
return /^[A-Za-z ]{3,}$/.test(v);
};

let isValidEmail=(v)=>{
return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

let calcAge=(dobStr)=>{
let d=new Date(dobStr);
if(Number.isNaN(d.getTime())) return null;
let now=new Date();
let age=now.getFullYear()-d.getFullYear();
let m=now.getMonth()-d.getMonth();
if(m<0 || (m===0 && now.getDate()<d.getDate())) age--;
return age;
};

if(!isValidEmail(email)){
errors.push("Please enter a valid email address.");
setFieldError("app-email","err-app-email","Enter a valid email like name@example.com.");
}

if(!course){
errors.push("Please select a course.");
setFieldError("app-course","err-app-course","Course is required.");
}

if(!gender){
errors.push("Please select your gender.");
setFieldError("app-gender","err-app-gender","Gender is required.");
}

let age=calcAge(dob);
if(age === null || age < 14){
errors.push("Please enter a valid date of birth (age must be 14+).");
setFieldError("app-dob","err-app-dob","Enter a valid DOB (age 14 or above).");
}

if(address.length < 10){
errors.push("Please enter your address.");
setFieldError("app-address","err-app-address","Address should be at least 10 characters.");
}

if(!isValidName(fatherName)){
errors.push("Please enter a valid father's name.");
setFieldError("app-fatherName","err-app-fatherName","Enter at least 3 letters (A-Z only).");
}

if(!isValidName(motherName)){
errors.push("Please enter a valid mother's name.");
setFieldError("app-motherName","err-app-motherName","Enter at least 3 letters (A-Z only).");
}

if(!caste || caste.length < 2){
errors.push("Please enter your caste.");
setFieldError("app-caste","err-app-caste","Caste should be at least 2 characters.");
}

if(!nationality || nationality.length < 2){
errors.push("Please enter your nationality.");
setFieldError("app-nationality","err-app-nationality","Nationality should be at least 2 characters.");
}

if(!state || state.length < 2){
errors.push("Please enter your state.");
setFieldError("app-state","err-app-state","State should be at least 2 characters.");
}

if(!/^\d{6}$/.test(pincode)){
errors.push("Please enter a valid pincode.");
setFieldError("app-pincode","err-app-pincode","Enter a valid 6-digit pincode.");
}

if(!studentPhoto){
errors.push("Please upload a student photo.");
setFieldError("app-studentPhoto","err-app-studentPhoto","Student photo is required.");
} else if(!studentPhoto.type.startsWith('image/')){
errors.push("Please upload a valid image file.");
setFieldError("app-studentPhoto","err-app-studentPhoto","Only image files are allowed.");
}

if(!adharFile){
errors.push("Please upload Aadhar card.");
setFieldError("app-adharFile","err-app-adharFile","Aadhar card is required.");
} else if(!(adharFile.type.startsWith('image/') || adharFile.type==='application/pdf')){
errors.push("Please upload a valid Aadhar file (image/pdf).");
setFieldError("app-adharFile","err-app-adharFile","Only image or PDF allowed.");
}

if(!marksCardFile){
errors.push("Please upload marks card file.");
setFieldError("app-marksCardFile","err-app-marksCardFile","Marks card file is required.");
} else if(!(marksCardFile.type.startsWith('image/') || marksCardFile.type==='application/pdf')){
errors.push("Please upload a valid marks card file (image/pdf).");
setFieldError("app-marksCardFile","err-app-marksCardFile","Only image or PDF allowed.");
}

if(!rationCardFile){
errors.push("Please upload ration card file.");
setFieldError("app-rationCardFile","err-app-rationCardFile","Ration card file is required.");
} else if(!(rationCardFile.type.startsWith('image/') || rationCardFile.type==='application/pdf')){
errors.push("Please upload a valid ration card file (image/pdf).");
setFieldError("app-rationCardFile","err-app-rationCardFile","Only image or PDF allowed.");
}

if(!terms){
errors.push("Please confirm the details are correct.");
setFieldError("app-terms","err-app-terms","Required.");
}

if(errors.length>0){
if(formErrors){
formErrors.innerHTML=errors.slice(0,3).map(e=>`<div>${e}</div>`).join("");
formErrors.style.display="block";
}
return false;
}

  let fullName = (document.getElementById('app-name')?.value || '').trim();
  let nameParts = fullName.split(' ').filter(Boolean);
  let firstName = nameParts.shift() || '';
  let lastName = nameParts.join(' ') || '';

  let studentPayload = {
    userId: Number(getCurrentUserId()),
    username: getLoggedUsername(),
    email,
    firstName,
    lastName,
    phone: document.getElementById('app-phone')?.value || '',
    course,
    gender,
    dateOfBirth: dob,
    address,
    fatherName,
    motherName,
    caste,
    nationality,
    state,
    pincode,
    aadharNumber: document.getElementById('app-adharFile')?.value ? document.getElementById('app-adharFile').files[0]?.name : null,
    studentPhoto: studentPhoto ? studentPhoto.name : null,
    adharFile: adharFile ? adharFile.name : null,
    marksCardFile: marksCardFile ? marksCardFile.name : null,
    rationCardFile: rationCardFile ? rationCardFile.name : null,
    applicationStatus: 'SUBMITTED',
    fatherName,
    motherName
  };

  let existingStudent = await fetchCurrentStudent();
  let response;
  if(existingStudent && existingStudent.userId){
    response = await apiRequest(`/students/${existingStudent.userId}`, 'PUT', studentPayload, true);
  } else {
    response = await apiRequest('/students', 'POST', studentPayload, true);
  }

  if(response && response.ok){
    showSuccessModal();
    return false;
  }

  alert('Unable to save application. Please try again.');
  return false;
}


function showSuccessModal(){
  let modal = document.getElementById('successModal');
  if(!modal) return;
  modal.style.display = 'flex';
}

function closeSuccessModal(){
  let modal = document.getElementById('successModal');
  if(!modal) return;
  modal.style.display = 'none';
  loadDashboard();
}

function editApplication(){
  document.getElementById('studentDetails').style.display = 'none';
  document.getElementById('profileInfo').style.display = 'none';
  document.getElementById('applicationForm').style.display = 'block';
  studentFormCurrentStep = 0;
  showApplicationStep(studentFormCurrentStep);
}

async function loginStudent(event){
  if(event) event.preventDefault();
  let username = document.getElementById('loginUsername')?.value || '';
  let password = document.getElementById('loginPassword')?.value || '';
  try {
    let response = await apiRequest('/auth/login', 'POST', { username, password });
    if(response.ok){
      let auth = await response.json();
      if(auth.role === 'STUDENT'){
        saveAuthSession(auth);
        showSuccessPopup("Login successful! Redirecting to Student Dashboard...", "dashboard.html", 1800);
        // Backup redirect in case modal is blocked/closed.
        setTimeout(() => { window.location = 'dashboard.html'; }, 2200);
        return false;
      }
      alert('This account is not a student account.');
      return false;
    }

    let msg = 'Invalid login credentials.';
    try {
      let errData = await response.json();
      if(errData && errData.error) msg = errData.error;
    } catch (_) {}
    alert(msg);
  } catch (err) {
    alert('Unable to connect to server. Please start backend and try again.');
  }
  return false;
}

async function loadDashboard(){
  if(!requireStudentAuth()) return;
  let student = await fetchCurrentStudent();
  if(!student || !student.userId){
    // No student profile yet, show application form
    document.getElementById('appStatus').innerHTML = 'Application Status: Not Submitted';
    document.getElementById('applyLink').style.display = 'block';
    document.getElementById('profileInfo').style.display = 'none';
    document.getElementById('studentDetails').style.display = 'none';
    document.getElementById('studentDetailsLink').style.display = 'none';
    document.getElementById('applicationForm').style.display = 'none';
    document.getElementById('marksSection').style.display = 'none';
    document.getElementById('marksEditor').style.display = 'none';
    return;
  }

  let fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  document.getElementById('welcome').innerHTML = 'Welcome ' + fullName;
  document.getElementById('phone').innerHTML = student.phone || '';

  if(student.email){
    document.getElementById('appStatus').innerHTML = `Application Status: ${student.applicationStatus || 'Submitted'}`;
    document.getElementById('applyLink').style.display = 'none';
    document.getElementById('profileInfo').style.display = 'block';
    document.getElementById('course').innerHTML = student.course || '-';
    document.getElementById('studentDetailsLink').style.display = 'inline';
    document.getElementById('studentDetails').style.display = 'block';
    document.getElementById('applicationForm').style.display = 'none';

    document.getElementById('dname').innerHTML = fullName;
    document.getElementById('demail').innerHTML = student.email || '-';
    document.getElementById('dphone').innerHTML = student.phone || '-';
    document.getElementById('dcourse').innerHTML = student.course || '-';
    document.getElementById('dgender').innerHTML = student.gender || '-';
    document.getElementById('ddob').innerHTML = student.dateOfBirth || '-';
    document.getElementById('daddress').innerHTML = student.address || '-';
    document.getElementById('dfatherName').innerHTML = student.fatherName || '-';
    document.getElementById('dmotherName').innerHTML = student.motherName || '-';
    document.getElementById('dcaste').innerHTML = student.caste || '-';
    document.getElementById('dnationality').innerHTML = student.nationality || '-';
    document.getElementById('dstate').innerHTML = student.state || '-';
    document.getElementById('dpincode').innerHTML = student.pincode || '-';
    document.getElementById('dadharFile').innerHTML = student.adharFile || '-';
    document.getElementById('dmarksCardFile').innerHTML = student.marksCardFile || '-';
    document.getElementById('drationCardFile').innerHTML = student.rationCardFile || '-';
    setupMarksSection(student);
  } else {
    document.getElementById('appStatus').innerHTML = 'Application Status: Not Submitted';
    document.getElementById('applyLink').style.display = 'block';
    document.getElementById('profileInfo').style.display = 'none';
    document.getElementById('studentDetails').style.display = 'none';
    document.getElementById('studentDetailsLink').style.display = 'none';
    document.getElementById('applicationForm').style.display = 'none';
    document.getElementById('marksSection').style.display = 'none';
    document.getElementById('marksEditor').style.display = 'none';
  }
}

function setupMarksSection(student){
  currentStudent = student;
  currentMarksSemester = 1;
  currentStudentMarks = [];

  document.getElementById('marksSection').style.display = 'block';
  document.getElementById('marksEditor').style.display = 'block';
  showSemesterMarks(currentMarksSemester);
  markSemesterButtons(currentMarksSemester);
  loadMarksEditor();
}

function markSemesterButtons(semester){
  for(let i=1; i<=6; i++){
    let btn = document.getElementById('semBtn'+i);
    if(btn){
      btn.style.background = i===semester ? '#0b3d91' : '#ffffff';
      btn.style.color = i===semester ? '#fff' : '#0b3d91';
      btn.style.border = i===semester ? '1px solid #204c98' : '1px solid #d1d7ee';
    }
  }
}

async function showSemesterMarks(semester){
  if(!currentStudent || !currentStudent.userId){
    return;
  }

  markSemesterButtons(semester);
  currentMarksSemester = semester;
  currentStudentMarks = await fetchStudentMarksBySemester(currentStudent.userId, semester);

  let container = document.getElementById('semesterMarksContainer');
  if(!container) return;

  if(!currentStudentMarks || currentStudentMarks.length === 0){
    container.innerHTML = '<p style="color:#666;">No marks recorded for this semester.</p>';
  } else {
    container.innerHTML = `<table class="profile-table" style="width:100%; max-width:none;">
      <thead><tr><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
      <tbody>
        ${currentStudentMarks.map(m=>`<tr><td>${m.subjectName}</td><td>${m.marksObtained || 0}</td><td>${m.grade || '-'}</td></tr>`).join('')}
      </tbody>
    </table>`;
  }

  let select = document.getElementById('marksSemesterSelect');
  if(select) select.value = semester.toString();
}

function addSubjectField(){
  let inputs = document.querySelectorAll('.subject-name-input');
  let lastIdx = inputs.length > 0 ? parseInt(inputs[inputs.length-1].dataset.idx) : -1;
  let newIdx = lastIdx + 1;
  
  let container = document.getElementById('subjectNamesContainer');
  if(!container) return;
  
  let input = document.createElement('input');
  input.type = 'text';
  input.value = '';
  input.className = 'subject-name-input';
  input.dataset.idx = newIdx;
  input.placeholder = 'Enter subject name';
  input.style.cssText = 'padding:8px; border:1px solid #d0d6eb; border-radius:6px;';
  
  let btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '×';
  btn.dataset.subjectIdx = newIdx;
  btn.style.cssText = 'padding:6px 12px; background:#d97706; color:#fff; border:none; border-radius:6px; cursor:pointer;';
  btn.onclick = function(){
    removeSubjectField(newIdx);
  };
  
  container.appendChild(input);
  container.appendChild(btn);
}

function removeSubjectField(idx){
  let container = document.getElementById('subjectNamesContainer');
  if(!container) return;
  
  let input = container.querySelector(`.subject-name-input[data-idx="${idx}"]`);
  let subjectName = input ? input.value : '';
  
  if(subjectName){
    let marksEditor = document.getElementById('marksEditorFields');
    if(marksEditor){
      let markField = marksEditor.querySelector(`[id="mark-${subjectName}"]`);
      if(markField && markField.parentElement){
        markField.parentElement.remove();
      }
    }
  }
  
  if(input){
    input.remove();
  }
  
  let allButtons = container.querySelectorAll('button');
  allButtons.forEach(btn => {
    if(btn.dataset.subjectIdx === idx.toString() || btn.dataset.subjectIdx == idx){
      btn.remove();
    }
  });
}

async function loadMarksEditor(){
  let semester = Number(document.getElementById('marksSemesterSelect').value || 1);
  markSemesterButtons(semester);

  if(currentMarksSemester !== semester){
    await showSemesterMarks(semester);
  }

  let marks = currentStudentMarks.filter(m => m.semester === semester);
  let subjects = marks.length ? marks.map(m => m.subjectName) : ['Math','Physics','Chemistry','English','Computer'];

  let subjectContainer = document.getElementById('subjectNamesContainer');
  if(subjectContainer){
    subjectContainer.innerHTML = '';
    subjects.forEach((sub, idx) => {
      let input = document.createElement('input');
      input.type = 'text';
      input.value = sub;
      input.className = 'subject-name-input';
      input.dataset.idx = idx;
      input.placeholder = 'Subject name';
      input.style.cssText = 'padding:8px; border:1px solid #d0d6eb; border-radius:6px;';
      
      let btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.dataset.subjectIdx = idx;
      btn.style.cssText = 'padding:6px 12px; background:#d97706; color:#fff; border:none; border-radius:6px; cursor:pointer;';
      btn.onclick = function(){
        removeSubjectField(idx);
      };
      
      subjectContainer.appendChild(input);
      subjectContainer.appendChild(btn);
    });
  }

  let editor = document.getElementById('marksEditorFields');
  if(!editor) return;

  let marksMap = {};
  marks.forEach(m => {
    marksMap[m.subjectName] = m.marksObtained || 0;
  });

  editor.innerHTML = subjects.map(sub=>`
    <div class="form-field">
      <label for="mark-${sub}">${sub}</label>
      <input type="number" id="mark-${sub}" value="${marksMap[sub] || 0}" min="0" max="100" required>
    </div>
  `).join('');
}

async function saveMarks(){
  let semester = Number(document.getElementById('marksSemesterSelect').value || 1);
  if(!currentStudent || !currentStudent.userId){
    alert('No student selected for marks.');
    return;
  }

  let subjectInputs = document.querySelectorAll('.subject-name-input');
  let fields = Array.from(subjectInputs).map(input => input.value.trim()).filter(val => val.length > 0);
  if(fields.length === 0){
    fields = ['Math','Physics','Chemistry','English','Computer'];
  }

  let savePromises = fields.map(async (subject) => {
    let rawValue = document.getElementById(`mark-${subject}`)?.value || '0';
    let value = Number.parseFloat(rawValue);
    if(Number.isNaN(value)) value = 0;

    let existing = currentStudentMarks.find(m=>m.subjectName === subject);
    let payload = {
      studentId: currentStudent.userId,
      subjectName: subject,
      semester,
      marksObtained: value
    };

    if(existing && existing.id){
      let response = await apiRequest(`/marks/${existing.id}`, 'PUT', payload, true);
      return response.ok ? response.json() : null;
    }
    let response = await apiRequest('/marks', 'POST', payload, true);
    return response.ok ? response.json() : null;
  });

  await Promise.all(savePromises);
  await showSemesterMarks(semester);
  alert('Marks saved for semester ' + semester);
}

function downloadMarksReport(){
  let semester = Number(document.getElementById('marksSemesterSelect').value || 1);
  let student = currentStudent || {};
  let marks = currentStudentMarks.filter(m => m.semester === semester);
  let rows = [['Subject','Marks','Grade']];
  if(marks.length === 0){
    rows.push(['No marks yet', '0', '']);
  } else {
    marks.forEach(m => rows.push([m.subjectName, m.marksObtained || 0, m.grade || '']));
  }

  let csvContent = rows.map(r=>r.join(',')).join('\n');
  let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  let url = URL.createObjectURL(blob);

  let link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `student-marks-semester${semester}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


function showApplicationForm(){
let form = document.getElementById("applicationForm");
if(!form) return;
form.style.display = "block";
document.getElementById("applyLink").style.display = "none";
document.getElementById("studentDetails").style.display = "none";
document.getElementById("profileInfo").style.display = "none";

let courseSelect = document.getElementById('app-course');
if(courseSelect){
  courseSelect.addEventListener('change', (e) => {
    setFeeForCourse(e.target.value);
  });
  setFeeForCourse(courseSelect.value);
}

studentFormCurrentStep = 0;
showApplicationStep(studentFormCurrentStep);
}

function viewProfile(){
window.location="profile.html";
}

async function loadProfile(){
  if(!requireStudentAuth()) return;
  let student = await fetchCurrentStudent();
  if(!student || !student.userId){
    window.location = 'dashboard.html';
    return;
  }

  let fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  document.getElementById('pname').innerHTML = fullName;
  document.getElementById('pemail').innerHTML = student.email || '-';
  document.getElementById('pphone').innerHTML = student.phone || '-';
  document.getElementById('pcourse').innerHTML = student.course || '-';
  document.getElementById('pgender').innerHTML = student.gender || '-';
  document.getElementById('pdob').innerHTML = student.dateOfBirth || '-';
  document.getElementById('paddress').innerHTML = student.address || '-';
  document.getElementById('pfatherName').innerHTML = student.fatherName || '-';
  document.getElementById('pmotherName').innerHTML = student.motherName || '-';
  document.getElementById('pcaste').innerHTML = student.caste || '-';
  document.getElementById('pnationality').innerHTML = student.nationality || '-';
  document.getElementById('pstate').innerHTML = student.state || '-';
  document.getElementById('ppincode').innerHTML = student.pincode || '-';
  document.getElementById('padharFile').innerHTML = student.adharFile || '-';
  document.getElementById('pmarksCardFile').innerHTML = student.marksCardFile || '-';
  document.getElementById('prationCardFile').innerHTML = student.rationCardFile || '-';
  
  // Hide loading and show table
  let loadingMsg = document.getElementById('loadingMessage');
  let profileTable = document.getElementById('profileTable');
  if(loadingMsg) loadingMsg.style.display = 'none';
  if(profileTable) profileTable.style.display = 'table';
}

function logout(){
  clearAuthSession();
  alert('Logged out');
  window.location='index.html';
}

function openLightbox(src, caption){
let lightbox=document.getElementById("lightbox");
let img=document.getElementById("lightbox-img");
let cap=document.getElementById("lightbox-caption");

if(!lightbox || !img || !cap) return;

img.src=encodeURI(src);
img.alt=caption || "Gallery image";
cap.textContent=caption || "";
lightbox.classList.add("open");
}

function closeLightbox(){
let lightbox=document.getElementById("lightbox");
let img=document.getElementById("lightbox-img");

if(!lightbox) return;

lightbox.classList.remove("open");
if(img) img.src="";
}

document.addEventListener("keydown",(e)=>{
if(e.key==="Escape"){
closeLightbox();
closeVideoModal();
}
});

function setupScrollReveal(){
let items=document.querySelectorAll(".reveal-on-scroll");
if(!items || items.length===0) return;

// IntersectionObserver animates cards as they come into view.
let observer=new IntersectionObserver((entries)=>{
entries.forEach((entry)=>{
if(entry.isIntersecting){
entry.target.classList.add("is-visible");
}
});
},{threshold:0.15});

items.forEach((el)=>{
observer.observe(el);
});
}

function openVideoModal(src, caption){
let modal=document.getElementById("video-modal");
let player=document.getElementById("video-player");
let cap=document.getElementById("video-caption");
if(!modal || !player || !cap) return;

cap.textContent=caption || "";
player.src=encodeURI(src);
modal.classList.add("open");

// Play best-effort (some browsers require user gesture).
player.play().catch(()=>{});
}

function closeVideoModal(){
let modal=document.getElementById("video-modal");
let player=document.getElementById("video-player");
if(!modal || !player) return;

modal.classList.remove("open");
player.pause();
player.removeAttribute("src");
player.load();
}

// ===== NOTICE BOARD SYSTEM =====
async function loadNotices(){
  let adminSection = document.getElementById('adminNoticeSection');
  if(adminSection && isAdminUser()) adminSection.style.display = 'block';

  let response = await apiRequest('/notices', 'GET');
  let notices = [];
  if(response.ok){
    notices = await response.json();
  }
  let container = document.getElementById('noticesContainer');
  if(!container) return;

  if(!notices || notices.length === 0){
    container.innerHTML = '<p style="text-align:center; color:#666; grid-column:1/-1;">No notices posted yet.</p>';
    return;
  }

  container.innerHTML = notices.reverse().map(n=>`
    <div style="background:#fff; border:1px solid #d4d9eb; border-radius:12px; padding:18px; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <div style="flex:1;">
          <h3 style="margin:0 0 4px 0; color:#0b3d91;">${n.title}</h3>
          <p style="margin:0 0 8px 0; font-size:13px; color:#666;">Posted on ${new Date(n.createdAt || n.postedAt || n.updatedAt || n.date || Date.now()).toLocaleDateString()}</p>
          <p style="margin:0; line-height:1.6;">${n.content}</p>
        </div>
        <span style="background:${n.priority==='Urgent'?'#e84d60':n.priority==='Important'?'#d97706':'#2b8a57'}; color:#fff; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; white-space:nowrap; margin-left:12px;">${n.priority}</span>
      </div>
    </div>
  `).join('');
}

async function postNotice(){
  let title = document.getElementById('noticeTitle')?.value || '';
  let content = document.getElementById('noticeContent')?.value || '';
  let priority = document.getElementById('noticePriority')?.value || 'Normal';
  
  if(!title || !content) { alert('Please fill all fields'); return; }

  let response = await apiRequest('/notices', 'POST', { title, content, priority }, true);
  if(response.ok){
    alert('Notice posted successfully!');
    document.getElementById('noticeTitle').value = '';
    document.getElementById('noticeContent').value = '';
    loadNotices();
  } else {
    alert('Unable to post notice.');
  }
}

async function postAdminNotice(){
  let title = document.getElementById('adminNoticeTitle')?.value || '';
  let content = document.getElementById('adminNoticeContent')?.value || '';
  let priority = document.getElementById('adminNoticePriority')?.value || 'Normal';
  
  if(!title || !content) { alert('Please fill all fields'); return; }

  let response = await apiRequest('/notices', 'POST', { title, content, priority }, true);
  if(response.ok){
    alert('Notice posted successfully!');
    document.getElementById('adminNoticeTitle').value = '';
    document.getElementById('adminNoticeContent').value = '';
    document.getElementById('adminNoticePriority').value = 'Normal';
    loadAdminNotices();
  } else {
    alert('Unable to post notice.');
  }
}

async function loadAdminNotices(){
  let response = await apiRequest('/notices', 'GET');
  let notices = [];
  if(response.ok){
    notices = await response.json();
  }
  let container = document.getElementById('adminNoticesContainer');
  if(!container) return;
  
  if(!notices || notices.length === 0){
    container.innerHTML = '<p style="text-align:center; color:#666; grid-column:1/-1;">No notices posted yet.</p>';
    return;
  }
  
  container.innerHTML = notices.reverse().map(n=>`
    <div style="background:#fff; border:1px solid #d4d9eb; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:8px;">
        <h4 style="margin:0; color:#0b3d91;">${n.title}</h4>
        <span style="background:${n.priority==='Urgent'?'#e84d60':n.priority==='Important'?'#d97706':'#2b8a57'}; color:#fff; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; white-space:nowrap;">${n.priority}</span>
      </div>
      <p style="margin:0 0 8px 0; font-size:12px; color:#666;">Posted: ${new Date(n.createdAt || n.postedAt || n.updatedAt || n.date || Date.now()).toLocaleString()}</p>
      <p style="margin:0; line-height:1.5; color:#333;">${n.content}</p>
    </div>
  `).join('');
}

// ===== NOTIFICATION SYSTEM =====
function sendNotification(studentName, type, message){
  notifications.push({
    to: studentName,
    type: type,
    message: message,
    timestamp: new Date().toISOString(),
    read: false
  });
}

function showNotifications(){
  let name = getLoggedUsername() || '';
  let userNotifs = notifications.filter(n => n.to === name);
  
  let html = '<h3>Your Notifications</h3>';
  if(userNotifs.length === 0){
    html += '<p>No notifications available.</p>';
  } else {
    html += userNotifs.slice().reverse().map(n=>`
      <div style="background:#f8f9fc; border-left:4px solid ${n.type==='approval'?'#2b8a57':n.type==='rejection'?'#e84d60':'#0b3d91'}; padding:12px; margin:8px 0; border-radius:4px;">
        <strong>${n.type.toUpperCase()}</strong>
        <p>${n.message}</p>
        <small style="color:#666;">${new Date(n.timestamp).toLocaleString()}</small>
      </div>
    `).join('');
  }
  
  let modal = document.getElementById('notificationModal');
  if(modal){
    modal.innerHTML = html;
    modal.parentElement.style.display = 'flex';
  }
}

// ===== PAYMENT GATEWAY INTEGRATION =====
function initPaymentGateway(){
  let formDiv = document.getElementById('paymentGatewayDiv');
  if(!formDiv) return;
  
  formDiv.innerHTML = `
    <div style="background:linear-gradient(135deg, #fff9f5, #fffaf8); border:1px solid #e0d6cb; border-radius:14px; padding:20px;">
      <h4>Complete Payment</h4>
      <p>Amount: <strong><span id="payAmount">5000</span> INR</strong></p>
      <div style="display:flex; gap:10px; margin:16px 0;">
        <button onclick="selectPaymentMethod('UPI')" style="flex:1; padding:12px; background:#6366f1; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600;">UPI</button>
        <button onclick="selectPaymentMethod('Card')" style="flex:1; padding:12px; background:#3b82f6; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Card</button>
        <button onclick="selectPaymentMethod('NetBanking')" style="flex:1; padding:12px; background:#10b981; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Net Banking</button>
      </div>
      <div id="paymentFormDiv"></div>
    </div>
  `;
}

function selectPaymentMethod(method){
  let div = document.getElementById('paymentFormDiv');
  if(!div) return;
  
  if(method === 'UPI'){
    div.innerHTML = `
      <label>UPI ID:</label>
      <input type="text" placeholder="yourname@bank" style="width:100%; padding:8px; margin:8px 0; border:1px solid #d0d6eb; border-radius:6px;">
      <button onclick="processPayment('${method}')" style="width:100%; padding:10px; background:#6366f1; color:#fff; border:none; border-radius:6px; cursor:pointer; margin-top:10px; font-weight:600;">Pay Now</button>
    `;
  } else if(method === 'Card'){
    div.innerHTML = `
      <label>Card Number:</label>
      <input type="text" placeholder="1234 5678 9012 3456" style="width:100%; padding:8px; margin:8px 0; border:1px solid #d0d6eb; border-radius:6px;">
      <label>Expiry & CVV:</label>
      <div style="display:flex; gap:10px;">
        <input type="text" placeholder="MM/YY" style="flex:1; padding:8px; border:1px solid #d0d6eb; border-radius:6px;">
        <input type="text" placeholder="CVV" style="flex:1; padding:8px; border:1px solid #d0d6eb; border-radius:6px;">
      </div>
      <button onclick="processPayment('${method}')" style="width:100%; padding:10px; background:#3b82f6; color:#fff; border:none; border-radius:6px; cursor:pointer; margin-top:10px; font-weight:600;">Pay Now</button>
    `;
  } else {
    div.innerHTML = `
      <label>Select Bank:</label>
      <select style="width:100%; padding:8px; margin:8px 0; border:1px solid #d0d6eb; border-radius:6px;">
        <option>HDFC Bank</option>
        <option>ICICI Bank</option>
        <option>SBI</option>
        <option>Axis Bank</option>
      </select>
      <button onclick="processPayment('${method}')" style="width:100%; padding:10px; background:#10b981; color:#fff; border:none; border-radius:6px; cursor:pointer; margin-top:10px; font-weight:600;">Proceed to Bank</button>
    `;
  }
}

function processPayment(method){
  alert(`Payment of 5000 INR via ${method} - Mock payment processed successfully!\n\nIn production:\n- Connect to Razorpay/Stripe API\n- Process actual transactions\n- Send payment confirmation\n- Update application status`);
}

// ===== PDF EXPORT =====
function exportStudentPDF(){
  let student = currentStudent || {};
  let fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  let pdfContent = `
STUDENT PROFILE REPORT
========================
Name: ${fullName}
Email: ${student.email || ''}
Phone: ${student.phone || ''}
Course: ${student.course || ''}
Gender: ${student.gender || ''}
DOB: ${student.dateOfBirth || ''}
Address: ${student.address || ''}
Father: ${student.fatherName || ''}
Mother: ${student.motherName || ''}
Caste: ${student.caste || ''}
Nationality: ${student.nationality || ''}
State: ${student.state || ''}
Pincode: ${student.pincode || ''}
Application Status: ${student.applicationStatus ? student.applicationStatus : 'Not Submitted'}
  `;
  
  let blob = new Blob([pdfContent], { type: 'text/plain' });
  let url = URL.createObjectURL(blob);
  let link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `student-profile-${fullName || 'student'}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  alert('Report exported! (Note: In production, use jsPDF for actual PDF format)');
}

// ===== PRINT MARKS REPORT =====
function showSuccessPopup(message, redirectPage = null, delay = 2000) {
  try {
    let existing = document.getElementById('success-popup');
    if (existing) existing.remove();

    let popup = document.createElement('div');
    popup.id = 'success-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-live', 'polite');
    popup.style.position = 'fixed';
    popup.style.inset = '0';
    popup.style.background = 'rgba(0,0,0,0.55)';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';
    popup.style.zIndex = '99999';

    let card = document.createElement('div');
    card.style.width = 'min(90%, 420px)';
    card.style.background = '#fff';
    card.style.borderRadius = '16px';
    card.style.padding = '24px';
    card.style.boxShadow = '0 24px 70px rgba(0,0,0,0.3)';
    card.style.textAlign = 'center';

    let title = document.createElement('h3');
    title.textContent = 'Success!';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#0b3d91';

    let text = document.createElement('p');
    text.textContent = message;
    text.style.margin = '0 0 20px 0';
    text.style.color = '#3d475e';

    let button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'OK';
    button.style.border = 'none';
    button.style.background = 'linear-gradient(90deg, #0b3d91 0%, #1462b8 100%)';
    button.style.color = '#fff';
    button.style.borderRadius = '10px';
    button.style.padding = '10px 20px';
    button.style.fontWeight = '700';
    button.style.cursor = 'pointer';
    button.onclick = () => {
      popup.remove();
      if (redirectPage) window.location = redirectPage;
    };

    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(button);
    popup.appendChild(card);
    document.body.appendChild(popup);

    if (redirectPage) {
      setTimeout(() => {
        let popupEl = document.getElementById('success-popup');
        if (popupEl) popupEl.remove();
        window.location = redirectPage;
      }, delay);
    }
  } catch (err) {
    // Guaranteed user feedback even if DOM popup fails.
    alert(message);
    if (redirectPage) {
      setTimeout(() => {
        window.location = redirectPage;
      }, delay);
    }
  }
}

function printMarksReport(){
  let semester = Number(document.getElementById('marksSemesterSelect').value || 1);
  let student = currentStudent || {};
  let fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  let marks = currentStudentMarks.filter(m => m.semester === semester);

  let printContent = `
    <html>
    <head>
      <title>Marks Report - ${fullName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #0b3d91; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>Marks Report</h1>
      <p><strong>Student Name:</strong> ${fullName}</p>
      <p><strong>Semester:</strong> ${semester}${semester === 1 ? 'st' : semester === 2 ? 'nd' : semester === 3 ? 'rd' : 'th'} Semester</p>
      <table>
        <tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
        ${marks.map(m=>`<tr><td>${m.subjectName}</td><td>${m.marksObtained || 0}</td><td>${m.grade || '-'}</td></tr>`).join('')}
      </table>
    </body>
    </html>
  `;

  let printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

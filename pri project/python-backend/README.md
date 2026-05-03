# Python Backend

This folder contains the Flask backend for the college portal application.

## Setup

1. Open PowerShell and navigate to this folder:

```powershell
cd python-backend
```

2. Create and activate a virtual environment:

```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. Install dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Run

Start the backend server with:

```powershell
python app.py
```

Or use the helper script:

```powershell
.\run.bat
```

The API will run on `http://127.0.0.1:8080` by default.

## API Base URL

`http://localhost:8080/api`

## Default Admin Credentials

- Username: `admin`
- Password: `admin123`

## Notes

- The backend uses SQLite and creates `db.sqlite` automatically when first run.
- Set `JWT_SECRET_KEY` in the environment to override the default secret.

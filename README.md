# MedAI

MedAI is a full-stack healthcare web application built with a React frontend and a FastAPI backend.  
It provides AI-assisted health support, prescription handling, medicine reminders, lab bookings, and pharmacy ordering in one platform.

## Project Structure

```
MedAI/
├── backend/   # FastAPI backend
└── frontend/  # React + Vite frontend
```

## Main Features

- AI chat and health analysis
- User authentication and profile management
- Medicine reminders and prescription support
- Lab test booking and report handling
- Pharmacy product browsing and order flow
- Doctor/admin dashboards

## Local Setup

### Backend

From the `backend` folder, install dependencies once (uses your default `python` / `pip`; no virtual environment is required):

```bash
cd backend
pip install -r requirements.txt
python main.py
```

On Windows you can use `py -m pip install -r requirements.txt` and `py main.py` if `python` is not on your PATH.

If you use a virtual environment (`.venv`) for isolation, the editor is configured not to auto-activate it in the integrated terminal; run `python main.py` the same way.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

- Configure required environment variables in `backend/.env` and `frontend/.env`.
- Keep API keys and secrets out of version control.

## License

This project is for educational and development use.

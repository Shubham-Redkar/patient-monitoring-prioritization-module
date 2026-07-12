# Patient Monitoring & Sepsis Prioritization Module

A full-stack clinical decision-support prototype for monitoring patient vitals and laboratory results, estimating sepsis risk, and prioritizing patients for review. It combines trained scikit-learn models, rule-based alerting, explainable clinical signals, and a role-aware React dashboard.

> [!WARNING]
> This project is for demonstration and research purposes. It is not a certified medical device and must not be used as a substitute for clinical judgment, validated hospital protocols, or emergency care.

## Features

- Patient dashboard ranked by `Critical`, `High`, `Medium`, or `Normal` priority
- Vital-sign anomaly detection and rolling four-reading instability detection
- Lab-based sepsis-risk probability and classification
- Human-readable contributing signals for model outputs
- Optional Groq-generated clinical summaries with a deterministic fallback
- Alert acknowledgement and manual priority overrides
- Patient history and vital/lab trend charts
- Atomic, validated CSV imports and patient-data deletion
- JWT authentication and role-based access for admins, doctors, and nurses
- User administration, password changes, and email-based password recovery

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 19, React Router, Vite, Tailwind CSS, Chart.js |
| Backend | FastAPI, Pydantic, Motor/PyMongo |
| Database | MongoDB (local or Atlas) |
| Models | scikit-learn, SHAP, pandas, NumPy |
| Authentication | JWT (HS256) and bcrypt |
| Optional explanation service | Groq API |

## Repository layout

```text
.
├── backend/
│   ├── app/
│   │   ├── core/       # Configuration and application bootstrap
│   │   ├── db/         # MongoDB connection and repositories
│   │   ├── models/     # Packaged trained model artifacts
│   │   ├── routes/     # FastAPI endpoints
│   │   ├── schemas/    # Request and response validation
│   │   ├── services/   # Prediction, import, and explanation workflows
│   │   ├── utils/      # Auth, feature engineering, rules, and alert logic
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/        # Authenticated API client
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── features/
│   │   └── pages/
│   └── package.json
└── notebook/            # Additional copies of trained model artifacts
```

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer (required by Vite 8)
- MongoDB running locally or a MongoDB Atlas connection string
- A Groq API key only if generated clinical summaries are desired

## Local setup

### 1. Configure and run the backend

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=patient_monitoring

# Replace this in every non-local environment.
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional. Without a key, the API returns a structured local rationale.
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

# Password-reset links
FRONTEND_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=no-reply@sepsis-monitor.local
SMTP_USE_TLS=true
PASSWORD_RESET_EXPIRE_MINUTES=30
```

Generate a suitable development secret with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Start FastAPI from `backend/app` because the application currently uses app-directory imports:

```bash
cd app
uvicorn main:app --reload
```

The API is available at <http://localhost:8000>, with OpenAPI documentation at <http://localhost:8000/docs>. The `/health` endpoint reports whether MongoDB was connected during startup. The server can start without MongoDB, but authentication and patient-data features remain unavailable.

When `SMTP_HOST` is empty, password-reset URLs are logged by the backend for local development instead of being emailed.

### 2. Configure and run the frontend

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The UI is available at <http://localhost:5173>. Its default API base URL is `http://localhost:8000/api/v1`.

Optional `frontend/.env` settings:

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
VITE_DATE_LOCALE=en-US
VITE_TIME_ZONE=UTC
```

## Default accounts

On the first successful database startup, the backend creates these development accounts if they do not already exist:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin123` | Admin |
| `doctor` | `doctor123` | Doctor |
| `nurse` | `nurse123` | Nurse |

Change these credentials immediately outside local development. Existing accounts are not overwritten at startup.

## Role permissions

| Capability | Admin | Doctor | Nurse |
| --- | :---: | :---: | :---: |
| View dashboard and patient list | Yes | Yes | Yes |
| Access detailed patient page in the UI | Yes | Yes | No |
| Read patient history through the API | Yes | Yes | Yes |
| Upload CSV / delete patient data | Yes | No | Yes |
| Acknowledge alerts | No | Yes | Yes |
| Clear alert acknowledgement | Yes | Yes | No |
| Override patient priority | No | Yes | No |
| Manage users | Yes | No | No |

## CSV import format

Upload a UTF-8 CSV from the Data Management page. Every row must contain all of these columns:

```csv
patient_id,hour_from_admission,heart_rate,respiratory_rate,spo2_pct,temperature_c,systolic_bp,diastolic_bp,wbc_count,lactate,creatinine,crp_level,hemoglobin
1001,0,88,18,97,37.1,118,76,9.4,1.3,0.9,8.2,13.7
```

Identity and hour values are integers. Clinical measurements must be positive; `spo2_pct` must not exceed 100. The `(patient_id, hour_from_admission)` pair is unique, so a later upload upserts the same reading. If any row fails validation, no rows from that file are written and the API returns row-specific errors.

## Prioritization pipeline

For a requested patient and hour, the backend:

1. Loads available history through that hour and derives vital features.
2. Applies the packaged vital anomaly model and marks sustained instability when at least two of the latest four readings are anomalous.
3. Derives lab features and, when lab data exists, calculates sepsis-risk probability and label.
4. Combines lab risk and sustained instability into a priority:

| Lab-risk label | Sustained instability | Priority |
| --- | --- | --- |
| High | Yes | Critical |
| High | No | High |
| No lab data | Yes | High |
| Low | Yes | Medium |
| Any other combination | No | Normal |

5. Applies an active doctor-entered priority override, if present.
6. Extracts influential lab and vital signals. For High and Critical cases, it generates a two-sentence Groq summary when configured; otherwise it produces a local structured rationale.
7. Returns alert and acknowledgement state with the prediction.

## API overview

All application endpoints except health and root are under `/api/v1`. Protected requests use `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Sign in with OAuth2 form fields |
| `GET` | `/auth/me` | Authenticated | Validate a token and return its user |
| `POST` | `/auth/forgot-password` | Public | Request a password-reset link |
| `POST` | `/auth/reset-password` | Public | Consume a reset token |
| `POST` | `/auth/change-password` | Authenticated | Change the current password |
| `GET/POST` | `/auth/users` | Admin | List or create users |
| `DELETE` | `/auth/users/{username}` | Admin | Delete another user |
| `GET` | `/patients` | Authenticated | List patient IDs |
| `GET` | `/patients/{id}/predict?hour={hour}` | Authenticated | Run the prediction workflow |
| `GET` | `/patients/{id}/history` | Authenticated | Read a bounded history window |
| `GET` | `/patients/{id}/meta` | Authenticated | Read manual-override metadata |
| `POST/DELETE` | `/patients/{id}/override_priority` | Doctor | Set or clear an override |
| `POST/DELETE` | `/patients/{id}/acknowledge` | Role-dependent | Set or clear acknowledgement |
| `POST` | `/upload-csv` | Admin, Nurse | Validate and import readings |
| `DELETE` | `/patients/{id}` | Admin, Nurse | Delete all data for a patient |

Use the interactive OpenAPI page for request bodies, query parameters, and live responses.

## Development checks

```bash
# Frontend lint and production build
cd frontend
npm run lint
npm run build

# Backend import/startup check (requires installed Python dependencies)
cd ../backend/app
python -c "from main import app; print(app.title)"
```

## Docker

From the repository root, use this single command to build the FastAPI and React images and start them with MongoDB:

```bash
docker compose up --build
```

Open the application at <http://localhost:8080>, the API at <http://localhost:8000>, and the API documentation at <http://localhost:8000/docs>.

This uses the development defaults in `compose.yaml`. Before deploying anywhere other than a disposable local environment, provide a strong `JWT_SECRET_KEY` and any optional Groq or SMTP settings through environment variables or a root `.env` file. MongoDB data is retained in the named `mongodb_data` volume.

## Security and deployment notes

- Replace the default JWT secret and seeded passwords before deployment.
- Restrict CORS origins; the current backend configuration permits all origins for development.
- Use TLS for the frontend, API, MongoDB, and SMTP connections.
- Keep `.env` files and API keys out of version control.
- Validate model performance, clinical thresholds, monitoring, auditability, and regulatory obligations before any real-world evaluation.

# AcoustiCare

A cross-platform mobile application for remote voice analysis and patient-provider communication in clinical voice assessment.

## Overview

AcoustiCare enables patients to submit voice recordings to healthcare providers while supporting advanced acoustic analysis for voice disorder screening and treatment monitoring. The platform facilitates recording requests, survey distribution, and longitudinal voice quality tracking.

## Tech Stack

**Frontend:** React Native 0.81 + Expo 54, TypeScript, React Navigation, Expo AV
**Backend:** Django 5.2 + DRF 3.16, PostgreSQL, JWT authentication
**Voice Analysis:** Praat-Parselmouth 0.4.6 (integration planned)

## Voice Analysis Capabilities

The platform is designed to integrate acoustic analysis algorithms for clinical voice assessment:

- **Jitter:** Frequency perturbation (local, RAP, PPQ5) - indicates vocal fold irregularity
- **Shimmer:** Amplitude perturbation (local, APQ) - indicates cycle-to-cycle amplitude variation
- And others...


## Features

**Patients:** Voice recording submission, provider connection, recording requests, survey completion
**Providers:** Patient management, recording requests, audio review, survey creation 
**Technical:** JWT auth, cross-platform recording (web/mobile), HTTP range requests for streaming, CORS-enabled API

## Quick Start

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure PostgreSQL
psql -U postgres
CREATE DATABASE hypercase;
ALTER USER postgres WITH PASSWORD 'hypercase123';
\q

# Run migrations and start server
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create config.js with your backend URL
echo "const BACKEND_URL = 'http://YOUR_IP:8000';\nexport default { BACKEND_URL };" > config.js

npm start              # Start Expo
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
```

## Development

**Frontend:** 2-space indent, semicolons, camelCase variables, PascalCase components
**Backend:** PEP 8, snake_case functions, PascalCase classes

## Tests (not implemented yet - updated 11/29/2025 by Suraj)
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && python manage.py test
```

## Security Notes

See `DEVELOPER_ANALYSIS.md` for detailed security analysis. Before production:
- Configure CORS allowed origins (currently allows all)
- Use environment variables for SECRET_KEY
- Implement rate limiting
- Enable password validation
- Configure HTTPS and secure headers

## Last Updated
Suraj Kumar, 11/29/2025
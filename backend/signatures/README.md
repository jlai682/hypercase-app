# Signatures Module for HyperCASE

This module handles storing and retrieving consent signatures from patients using the Supabase database.

## Features

- Links signatures to patient records in a one-to-one relationship
- Provides API endpoints for creating, retrieving, and updating signatures
- Supports fetching signatures by patient ID
- Integrated with Django's authentication system
- Stores data in Supabase PostgreSQL database

## API Endpoints

- `GET /api/signatures/` - List all signatures
- `POST /api/signatures/` - Create a new signature
- `GET /api/signatures/<id>/` - Get a specific signature by ID
- `PUT /api/signatures/<id>/` - Update a specific signature
- `DELETE /api/signatures/<id>/` - Delete a specific signature

### Patient-specific endpoints

- `GET /api/signatures/by_patient/?patient_id=<id>` - Get signature for a specific patient
- `POST /api/signatures/for_patient/` - Create or update signature for a specific patient

## Model

The Signature model has the following fields:

- `patient` - OneToOneField link to Patient model
- `is_checked` - Boolean indicating agreement with terms
- `digital_signature` - Text representation of patient's signature
- `date` - Date when consent was given

## Integration with Frontend

The frontend consent form fetches the current user's patient record, then either:
1. Retrieves their existing signature data to pre-fill the form
2. Creates a new signature record linked to their patient record

The form submits data to the `/api/signatures/for_patient/` endpoint with the patient ID and signature details.

## Setup Instructions

1. Run Django migrations: `python manage.py migrate signatures`
2. Ensure PostgreSQL connection to Supabase is configured in settings.py
3. Test endpoints with authentication in place

## Authentication

All endpoints should validate that the user making the request is either:
- The patient associated with the signature
- A provider with appropriate permissions
- An administrator

This authentication is handled by the Django REST framework.
# HyperCASE Project Guide

## Build Commands
- **Frontend**:
  - Start: `cd frontend && npm start` or `cd frontend && npx expo start`
  - Test: `cd frontend && npm test` or `cd frontend && jest` (single test: `cd frontend && jest -t "TestName"`)
  - Lint: `cd frontend && npm run lint`
  - Reset: `cd frontend && npm run reset-project`

- **Backend**:
  - Setup venv: `cd backend && python3 -m venv venv && source venv/bin/activate` (Mac) or `venv\Scripts\activate` (Windows)
  - Install: `cd backend && pip install -r requirements.txt`
  - Run server: `cd backend && python manage.py runserver 0.0.0.0:8000`
  - Run test: `cd backend && python manage.py test` (single test: `python manage.py test app_name.tests.TestClass.test_function`)

## Code Style Guidelines
- **Frontend**:
  - React functional components with hooks (useState, useEffect)
  - 2-space indentation, semicolons required
  - TypeScript typing when possible with interfaces for props
  - Imports order: React → UI libs → Utils → Local components
  - camelCase for variables/functions, PascalCase for components

- **Backend**:
  - Follow Django conventions with snake_case for functions/variables
  - PascalCase for classes, especially models
  - Organize imports: Django → Models → Forms → Utils
  - Use decorators for view functions as appropriate
  - Error handling with try/except and appropriate status codes
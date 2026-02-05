# AcoustiCare Backend

**Note:** The backend is already deployed to production. There is no need to run this locally unless you are developing or testing changes.

---

## Running with Docker

### 1. Install Docker Desktop

**Mac:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop/
- Open the downloaded `.dmg` file and drag Docker to Applications
- Launch Docker Desktop from Applications
- Wait for Docker to start (whale icon in menu bar will stop animating)

**Windows:**
- Download Docker Desktop from https://www.docker.com/products/docker-desktop/
- Run the installer and follow the prompts
- Restart your computer if prompted
- Launch Docker Desktop and wait for it to start

### 2. Set up environment variables

Make sure you have a `.env` file in the backend folder with the required variables:

```bash
SECRET_KEY=your_secret_key_here
```

To generate a secret key:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 3. Run the backend

From the `backend` folder, run:
```bash
docker-compose up
```

To stop the containers:
```bash
docker-compose down
```

To rebuild after making changes:
```bash
docker-compose up --build
```
---

## Running without Docker

** do everything in the backend folder of the directory

### 1. Create a virtual environment

Windows:
```bash
python -m venv venv
```

Mac:
```bash
python3 -m venv venv
```

### 2. Activate the virtual environment

Windows:
```bash
venv\Scripts\activate
```

Mac:
```bash
source venv/bin/activate
```

### 3. Install Requirements

```bash
pip install -r requirements.txt
```

### 4. Configure the backend URL for the frontend to communicate with

Create a new file called config.js in the root folder of the frontend. The file should look like this:

```bash
const BACKEND_URL = 'http://<YOUR IP ADDRESS HERE>:8000';

export default {
    BACKEND_URL,
};
```

This basically sets an environment variable for us to use because your backend will be hosted locally.

### 6. Run the Django Development server

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## Setting up a local database

### 1. Install PostgreSQL

Mac:
```bash
brew install postgresql
```

Windows (via Chocolatey):
```bash
choco install postgresql
```

### 2. Install psycopg2

In the virtual environment in your project terminal, run:

```bash
pip install psycopg2
```

### 3. Create the database locally

In your terminal, run:

```bash
psql -U postgres
```

If it says "role does not exist," create the default postgres user, and run the above command again:

```bash
createuser -s postgres
psql -U postgres
```

Then, create the database:

```bash
CREATE DATABASE hypercase;
```
* note: MUST be 'hypercase'

Then, change the postgres password by running:

```bash
ALTER USER postgres WITH PASSWORD 'hypercase123';
```
* note: MUST be 'hypercase123'


### 4. Make migrations and migrate to the new database

In your project terminal (in the virtual environment), run the following commands:

```bash
python manage.py makemigrations
python manage.py migrate
```

Last edited by: Suraj Kumar 2/5/2026

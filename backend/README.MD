# Steps for getting the backend running:

** do everything in the backend folder of the directory 

1. create a virtual environment: 

Windows: 
```bash
python -m venv venv
```

Mac:
```bash
python3 -m venv venv
```

2. Activate the virtual environment:

Windows:
```bash
venv\Scripts\activate
```

Mac: 
```bash
source venv/bin/activate
```

3. install Django 

```bash
pip install django
```

4. Install Requirements

```bash
pip install -r requirements.txt
```

5. Configure the backend URL for the frontend to communicate with

Create a new file called config.js in the root folder of the frontend. The file should look like this: 

```bash
const BACKEND_URL = 'http://<YOUR IP ADDRESS HERE>:8000';  

export default {
    BACKEND_URL,
};
```

This basically sets an environment variable for us to use because your backend will be hosted locally.

5. Run the Django Development server

```bash
python manage.py runserver 0.0.0.0:8000
```

# Steps for setting up a local database:

1. Install PostgreSQL: 

Mac:
```bash
brew install postgresql 
```

Windows (via Chocolatey):
```bash
choco install postgresql
```

2. Install psycopg2

In the virtual environment in your project terminal, run:

```bash
pip install psycopg2
```

3. Create the database locally:

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


4. Make migrations and migrate to the new database:

in your project terminal (in the virtual environment), run the following commands:

```bash
python manage.py makemigrations
python manage.py migrate
```

From here, you should be able to run the project as normally (on any wifi) and signup/login as you please. the only issue is we won't be collaborating on the same datbase, which should be fine for development purposes for now. 


# Setup .env file to protect secrets

1. Make a new file named ".env" in the root of backend folder. 

2. Generate a secret key by typing the command in the terminal below: 
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())
```

3. Copy and paste the key and set it equal to SECRET_KEY. Your .env file should have the same format as below

```bash
SECRET_KEY=*copy_and_pasted_key*  
```
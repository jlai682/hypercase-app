# Steps for getting the backend running:

** do everything in the backend folder of the directory 

1. create a virtual environment: 

Windows: 
python -m venv venv

Mac:
python3 -m venv venv

2. Activate the virtual environment:

Windows:
venv\Scripts\activate

Mac: 
source venv/bin/activate

3. install Django 

pip install django

4. Install Requirements

pip install -r requirements.txt

5. Configure the backend URL for the frontend to communicate with

Create a new file called config.js in the root folder of the frontend. The file should look like this: 

const BACKEND_URL = 'http://<YOUR IP ADDRESS HERE>:8000';  

export default {
    BACKEND_URL,
};

This basically sets an environment variable for us to use because your backend will be hosted locally. You can see where we use this in patientSignup.jsx (in the fetch to the backend) 

5. Run the Django Development server

python manage.py runserver 0.0.0.0:8000

# Steps for setting up a local database:

1. Install PostgreSQL: 

Mac:
brew install postgresql 

Windwos:
choco install postgresql
 (via Chocolatey)

2. Install psycopg2

In the virtual environment in your project terminal, run:

pip install psycopg2

3. Create the database locally:

In your terminal, run: 

psql -U postgres

If it says "role does not exist," create the default postgres user, and run the above command again: 

createuser -s postgres
psql -U postgres

Then, create the database:

CREATE DATABASE hypercase;

* note: MUST be 'hypercase' 

Then, change the postgres password by running:

ALTER USER postgres WITH PASSWORD 'hypercase123';

* note: MUST be 'hypercase123' 


4. Make migrations and migrate to the new database:

in your project terminal (in the virtual environment), run the following commands:

python manage.py makemigrations
python manage.py migrate

From  here you should be able to run the project as normally (on any wifi) and signup/login as you please. the only issue is we won't be collaborating on the same datbase, which should be fine for development purposes for now. 
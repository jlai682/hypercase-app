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


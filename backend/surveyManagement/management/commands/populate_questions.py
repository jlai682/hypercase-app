from django.core.management.base import BaseCommand
from surveyManagement.models import OpenQuestion, MultipleChoiceQuestion, MultipleChoiceOption

class Command(BaseCommand):
    help = 'Populate the database with sample open and multiple choice questions'

    def handle(self, *args, **kwargs):
        # Open Questions
        open_questions = [
            "When did this complaint start?",
            "Did this complaint occur suddenly or slowly?",
            "How often does this complaint occur? (e.g. daily, weekly, occasionally, infrequently)",
            "What seemed to trigger the problem? (e.g. illness, accident, surgery)",
            "Does the problem get worse at a specific time of day?",
            "Has the problem become better or worse recently?",
            "What makes the problem better?",
            "Have you seen another doctor about this concern? If yes, who?",
            "What else have you done to address this concern?",
            "How many 6-8 oz glasses of non-caffeinated beverages do you drink during the day?",
            "If you consume caffeine: How often? How much?",
            "If you exercise: How often? How long?",
            "If you quit smoking/tobacco: When?",
            "If you ever smoked/used tobacco: How much? (packs per day, snuff/dip)",
            "Number of years smoked:",
            "Do you have trouble taking any of your medications? If yes, describe.",
            "What is your main voice concern?",
            "Today I would rate my voice as the following (1-10):",
            "Occupation:",
            "Any leisure activities that involve your voice? (e.g. singing, coaching, spectator sports)",
            "How does using your voice in your occupation affect you?",
            "Have you had prior voice treatment? If yes, by who?",
            "If you are a singer: describe singing style(s)/genre(s), range, number of hours/week performing or practicing.",
            "Briefly describe any current issues with your singing voice:",
            "How long have you been experiencing these swallowing difficulties?",
            "Have you experienced any weight loss due to your swallowing difficulties?",
            "Does swallowing make you cough?",
            "Do you feel like food gets stuck when you swallow? Where does it feel stuck?",
            "Do you hesitate to go out to eat because of your swallowing problems?",
            "Have you had any previous swallowing tests or treatments?",
            "What is your main airway concern?",
            "Have you had any recent respiratory infections or fevers?",
            "Are you currently taking any medications for breathing problems?",
            "Have there been any recent changes to your medications?",
            "How long have you had the tracheostomy?",
            "Have you had any problems with your tracheostomy tube recently?",
            "Do you use any breathing assistance devices, such as a ventilator?",
            "Have you received training on tracheostomy care and emergency procedures?",
            "Do you feel confident in managing your tracheostomy at home?",
        ]


        for text in open_questions:
            question, created = OpenQuestion.objects.get_or_create(question_description=text)
            if created:
                self.stdout.write(f'Created open question: "{text}"')
            else:
                self.stdout.write(f'Open question already exists: "{text}"')

        # Multiple Choice Questions
        mc_questions_and_options = {
            "What is the main concern or problem that we can help you with today? (you may pick more than one)": [
                "Difficulty with your voice",
                "Difficulty breathing",
                "Tracheostomy Management",
                "Airway Stenosis",
                "Difficulty swallowing",
                "Cough",
                "Throat Clearing",
                "Lump or Pain in Throat",
                "Sleep Apnea (OSA)",
                "Snoring",
                "Other (write in)"
            ],
            "How severe is the problem impacting your life?": [str(i) for i in range(11)],  # 0 to 10
            "Have you seen another doctor about this concern?": ["Yes", "No"],
            "Were any studies done recently we need to review?": [
                "X-rays", "CT", "MRI", "PET", "Labs", "Sleep Study", "Hearing Test", "Other"
            ],
            "How often do you have a drink containing alcohol?": [
                "Never", "Monthly or less", "2-4 times per month", "2-3 times per week", "4 or more times per week"
            ],
            "How many standard drinks containing alcohol do you have on a typical day?": [
                "1 or 2", "3 or 4", "5 or 6", "7 to 9", "10 or more"
            ],
            "How often do you have 6 or more drinks on one occasion?": [
                "Never", "Less than monthly", "Monthly", "Weekly", "Daily or almost daily"
            ],
            "Do you consume any caffeine?": ["Yes", "No"],
            "Do you exercise?": ["Yes", "No"],
            "Have you ever smoked or used tobacco?": ["Yes", "No"],
            "If yes to smoking/tobacco: Currently Smoking?": ["Yes"],
            "Would you like to quit smoking/tobacco?": ["Yes", "No"],
            "Do you use e-Cigarettes?": ["Yes", "No"],
            "Do you use chewing tobacco, cigars, or a pipe?": ["Yes", "No"],
            "Do you smoke marijuana?": ["Yes", "No"],
            "Do you use other drugs?": ["Yes", "No"],
            "Do you have trouble taking any of your medications?": ["Yes", "No"],
            "Do you take Blood Thinners?": [
                "Aspirin", "Plavix", "Coumadin", "Eliquis", "Pradaxa", "Savaysa",
                "Arixtra", "Heparin", "Xarelto", "Motrin", "Aleve"
            ],
            "What is your main voice concern?": [
                "The sound of your voice", "The feel of your voice", "Sound & feel", "Other"
            ],
            "My voice is best:": [
                "In the morning", "In the afternoon", "In the evening", "After resting", "Other"
            ],
            "Occupation status:": ["Homemaker", "Unemployed", "Retired"],
            "In what capacity do you use your voice?": [
                "Teacher", "Sales", "Politician", "Attorney", "Clergy", "Telephone operator",
                "Singer", "Actor", "Announcer"
            ],
            "Have you had prior voice treatment?": ["Yes", "No"],
            "Home environment factors (select all that apply)": [
                "Background noise", "Excessive talking/phone use", "Loud speech/yelling", "Other"
            ],
            "Voice Category:": ["Soprano", "Mezzo-soprano", "Alto", "Tenor", "Baritone", "Bass", "Other"],
            "Singing Genre:": [
                "Classical", "Pop", "Jazz", "Musical theatre", "Rock", "Country", "Gospel", "Other"
            ],
        }


        for question_text, options in mc_questions_and_options.items():
            mc_question, _ = MultipleChoiceQuestion.objects.get_or_create(question_description=question_text)
            for option_text in options:
                MultipleChoiceOption.objects.get_or_create(question=mc_question, option=option_text)
            self.stdout.write(f'Created MC question: "{question_text}" with options: {options}')

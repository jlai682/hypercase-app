from django.db import migrations


def copy_fk_to_m2m(apps, schema_editor):
    MultipleChoiceResponse = apps.get_model('surveyManagement', 'MultipleChoiceResponse')
    for response in MultipleChoiceResponse.objects.all():
        if response.selected_option_id is not None:
            response.selected_options.add(response.selected_option_id)


def set_multi_select_flags(apps, schema_editor):
    MultipleChoiceQuestion = apps.get_model('surveyManagement', 'MultipleChoiceQuestion')
    multi_select_descriptions = [
        "What is the main concern or problem that we can help you with today? (you may pick more than one)",
        "Were any studies done recently we need to review?",
        "Do you take Blood Thinners?",
        "In what capacity do you use your voice?",
        "Home environment factors (select all that apply)",
    ]
    MultipleChoiceQuestion.objects.filter(
        question_description__in=multi_select_descriptions
    ).update(is_multi_select=True)


class Migration(migrations.Migration):

    dependencies = [
        ('surveyManagement', '0005_multiplechoicequestion_is_multi_select_and_more'),
    ]

    operations = [
        migrations.RunPython(copy_fk_to_m2m, migrations.RunPython.noop),
        migrations.RunPython(set_multi_select_flags, migrations.RunPython.noop),
    ]

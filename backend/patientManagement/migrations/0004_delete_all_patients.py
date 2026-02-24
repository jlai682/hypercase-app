from django.db import migrations


def delete_all_patients(apps, schema_editor):
    """Delete all existing patients and their associated users before schema change."""
    Patient = apps.get_model('patientManagement', 'Patient')
    User = apps.get_model('auth', 'User')
    user_ids = list(Patient.objects.values_list('user_id', flat=True))
    Patient.objects.all().delete()
    User.objects.filter(id__in=user_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('patientManagement', '0003_remove_patient_email_alter_patient_firstname_and_more'),
    ]

    operations = [
        migrations.RunPython(delete_all_patients, migrations.RunPython.noop),
    ]

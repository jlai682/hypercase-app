from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patientManagement', '0004_delete_all_patients'),
    ]

    operations = [
        # Remove old name fields
        migrations.RemoveField(
            model_name='patient',
            name='firstName',
        ),
        migrations.RemoveField(
            model_name='patient',
            name='lastName',
        ),

        # Add unique_id field
        migrations.AddField(
            model_name='patient',
            name='unique_id',
            field=models.CharField(default='0000000000', max_length=10, unique=True),
            preserve_default=False,
        ),

        # Make optional fields have defaults
        migrations.AlterField(
            model_name='patient',
            name='medical_history',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='patient',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='patient',
            name='phone_number',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
    ]

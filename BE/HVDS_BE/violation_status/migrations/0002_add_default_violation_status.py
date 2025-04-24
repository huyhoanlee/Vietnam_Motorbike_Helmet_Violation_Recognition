from django.db import migrations

def create_default_status(apps, schema_editor):
    ViolationStatus = apps.get_model('violation_status', 'ViolationStatus')
    ViolationStatus.objects.create(status_name='AI_detected')
    ViolationStatus.objects.create(status_name='Reported')

class Migration(migrations.Migration):
    dependencies = [
        ('violation_status', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_status),
    ]
from django.db import migrations

def add_ai_reliable_status(apps, schema_editor):
    ViolationStatus = apps.get_model('violation_status', 'ViolationStatus')
    ViolationStatus.objects.get_or_create(status_name='AI reliable', defaults={'description': 'AI-detected with high confidence'})

class Migration(migrations.Migration):
    dependencies = [
        ('violation_status', '0001_initial'),  # Adjust based on your previous migration
    ]

    operations = [
        migrations.RunPython(add_ai_reliable_status),
    ]
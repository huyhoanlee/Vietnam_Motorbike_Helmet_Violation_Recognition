from django.db import migrations

def create_default_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    
    Role.objects.get_or_create(role_name='Admin')
    Role.objects.get_or_create(role_name='Supervisor')

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_roles),
    ]
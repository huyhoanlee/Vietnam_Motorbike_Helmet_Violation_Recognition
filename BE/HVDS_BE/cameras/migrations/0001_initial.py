# Generated by Django 5.1.6 on 2025-03-02 15:52
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('locations', '0001_initial'),
        ('camera_urls', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Camera',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('device_name', models.CharField(max_length=255)),
                ('status', models.CharField(
                    max_length=8, 
                    choices=[('Active', 'Active'), ('Deactive', 'Deactive')],
                    default='Active', 
                    verbose_name='Status of account: [Active, Deactive]'
                    )),
                ('last_active', models.DateTimeField(null=True)),
                ('location_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='locations.location')),
                ('camera_url_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='camera_urls.cameraurl'))
            ],
        ),
    ]

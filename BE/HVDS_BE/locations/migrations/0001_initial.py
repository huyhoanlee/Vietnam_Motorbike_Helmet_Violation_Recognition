# Generated by Django 5.1.6 on 2025-03-02 15:52

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Location',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('road', models.CharField(max_length=255)),
                ('dist', models.CharField(max_length=255)),
                ('city', models.CharField(max_length=255)),
            ],
        ),
    ]

# Generated by Django 5.1.6 on 2025-04-12 06:55

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("car_parrots", "0002_remove_carparrot_citizen_id_carparrots"),
        ("vehicles", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vehicle",
            name="car_parrot_id",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="car_parrots.carparrots"
            ),
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="id",
            field=models.AutoField(primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name="vehicle",
            name="plate_number",
            field=models.CharField(max_length=255),
        ),
    ]

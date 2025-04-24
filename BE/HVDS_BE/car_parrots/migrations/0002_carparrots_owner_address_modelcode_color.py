from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('car_parrots', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='CarParrots',
            name='owner',
            field=models.CharField(max_length=255, default=''),
        ),
        migrations.AddField(
            model_name='CarParrots',
            name='address',
            field=models.CharField(max_length=255, default=''),
        ),
        migrations.AddField(
            model_name='CarParrots',
            name='modelCode',
            field=models.CharField(max_length=50, default=''),
        ),
        migrations.AddField(
            model_name='CarParrots',
            name='color',
            field=models.CharField(max_length=50, default=''),
        ),
    ]
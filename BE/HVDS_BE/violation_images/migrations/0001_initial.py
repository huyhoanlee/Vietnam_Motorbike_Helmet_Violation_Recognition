from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('violations', '0001_initial')
    ]

    operations = [
        migrations.CreateModel(
            name='ViolationImages',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('time', models.DateTimeField()),
                ('image', models.TextField()),
                ('confidence', models.FloatField(null=True)),
                ('violation_id', models.ForeignKey(on_delete=models.deletion.CASCADE, to='violations.violation'))
            ],
        ),
    ]  
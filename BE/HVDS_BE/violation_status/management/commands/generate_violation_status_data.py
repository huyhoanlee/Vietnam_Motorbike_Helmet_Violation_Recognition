import pandas as pd
from django.core.management.base import BaseCommand
from violation_status.models import ViolationStatus
from django.conf import settings

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
            df = pd.read_excel(settings.FILE_DATA_PATH, sheet_name='ViolationStatus')
            ViolationStatus.objects.all().delete()
            for _, row in df.iterrows():
                ViolationStatus.objects.create(
                    status_name=row['status_name'],
                    description=row['description']
                )
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {len(df)} Violation Status from Excel'))
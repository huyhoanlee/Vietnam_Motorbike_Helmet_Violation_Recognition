import pandas as pd
from django.core.management.base import BaseCommand
from locations.models import Location
from django.conf import settings

class Command(BaseCommand):
    help = 'Generate fake Location data from Excel file or sample data'

    def handle(self, *args, **kwargs):
            df = pd.read_excel(settings.FILE_DATA_PATH, sheet_name='Location')
            Location.objects.all().delete()
            for _, row in df.iterrows():
                Location.objects.create(
                    name=row['name'],
                    road=row['road'],
                    dist=row['dist'],
                    city=row['city']
                )
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {len(df)} locations from Excel'))
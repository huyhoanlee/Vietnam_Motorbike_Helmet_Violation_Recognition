import pandas as pd
from django.core.management.base import BaseCommand
from citizens.models import Citizen
from django.conf import settings

class Command(BaseCommand):
    help = 'Generate fake Location data from Excel file or sample data'

    def handle(self, *args, **kwargs):
            df = pd.read_excel(settings.FILE_DATA_PATH, sheet_name='Citizen')
            # Citizen.objects.all().delete()
            # for _, row in df.iterrows():
            #     Citizen.objects.create(
            #         citizen_identity_id=row['citizen_identity_id'],
            #         full_name=row['full_name'],
            #         phone_number=row['phone_number'],
            #         email=row['email'],
            #         address=row['address'],
            #         status=row['status'],
            #         # dob=row['dob'],
            #         place_of_birth=row['place_of_birth'],
            #         gender=row['gender'],
            #         # issue_date=row['issue_date'],
            #         place_of_issue=row['dob'],
            #         nationality=row['nationality'],
            #     )
            self.stdout.write(self.style.SUCCESS(f'Successfully imported {Citizen.objects.all().count()} citizens from Excel'))
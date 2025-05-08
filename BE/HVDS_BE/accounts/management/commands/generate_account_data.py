import pandas as pd
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Role
from django.conf import settings

class Command(BaseCommand):
    help = 'Generate account data from Excel file or sample data'

    def handle(self, *args, **kwargs):
        Account = get_user_model()
        df = pd.read_excel(settings.FILE_DATA_PATH, sheet_name='Account')

        for index, row in df.iterrows():
            try:
                role_name = str(row['role']).strip()
                role = Role.objects.get(role_name=role_name)
                
                username = str(row['username'])
                email = str(row['email'])
                password = str(row['password'])
                status = str(row['status'])

                if Account.objects.filter(username=username).exists():
                    self.stdout.write(self.style.WARNING(f"Account {username} already exists. Skipping."))
                    continue

                if role_name == "Admin":
                    Account.objects.create_superuser(
                        username=username,
                        email=email,
                        password=password,
                        role_id=role,
                        status=status
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created superuser: {username}"))
                else:
                    Account.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        role_id=role,
                        status=status
                    )
                    self.stdout.write(self.style.SUCCESS(f"Created user: {username}"))

            except Role.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Role {role_name} does not exist for {row['username']}. Skipping."))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating account {row['username']}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS(f"Processed {len(df)} accounts from Excel"))
import pandas as pd
from django.core.management.base import BaseCommand
from violations.models import Violation
from vehicles.models import Vehicle
from django.conf import settings
from django.db.models import Count

class Command(BaseCommand):
    help = 'Generate fake Location data from Excel file or sample data'

    def handle(self, *args, **kwargs):
        # Step 1: Identify Violations to remove
        violations_to_remove = Violation.objects.filter(
            vehicle_id__normalized_plate_number__regex=r'^.{0,7}$'
        )

        # Step 2: Remove the identified Violations
        count = violations_to_remove.count()
        # violations_to_remove.delete()
        self.stdout.write(self.style.SUCCESS(f'Removed {count} violations with normalized_plate_number length < 8'))

        # Step 3: Identify and remove orphaned Vehicles
        orphaned_vehicles = Vehicle.objects.annotate(violation_count=Count('violation')).filter(violation_count=0)
        orphaned_count = orphaned_vehicles.count()
        # orphaned_vehicles.delete()
        self.stdout.write(self.style.SUCCESS(f'Removed {orphaned_count} orphaned vehicles'))
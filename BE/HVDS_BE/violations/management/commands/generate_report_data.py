import random
from django.core.management.base import BaseCommand
from violations.models import Violation, ViolationStatus, Citizen

class Command(BaseCommand):
    help = 'Randomly update some Violation records to have violation_status_id with status_name "Reported"'

    def handle(self, *args, **kwargs):
        reported_status = ViolationStatus.objects.filter(status_name="Reported").first()
        if not reported_status:
            self.stdout.write(self.style.ERROR('No ViolationStatus with status_name "Reported" found.'))
            return

        violations = list(Violation.objects.all())
        if not violations:
            self.stdout.write(self.style.WARNING('No Violation records found.'))
            return

        # num_to_update = random.randint(1, 200)
        num_to_update = 1
        violations_to_update = random.sample(violations, num_to_update)
        
        verified_citizens = list(Citizen.objects.filter(status="Verified"))
        if not verified_citizens:
            self.stdout.write(self.style.ERROR('No Citizen with status "Verified" found.'))
            return

        for violation in violations_to_update:
            if violation.violation_status_id == reported_status:
                continue
            violation.violation_status_id = reported_status
            violation.reported_location = violation.camera_id.location_id.__str__() if violation.camera_id else None
            violation.camera_id = None
            
            violation.reported_by = random.choice(verified_citizens)
            violation.save()
        num_to_update = Violation.objects.filter(violation_status_id__status_name="Reported").count()
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {num_to_update} Violation records to "Reported" status.'))
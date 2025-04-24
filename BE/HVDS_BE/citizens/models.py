from django.db import models

class Citizen(models.Model):
    id = models.AutoField(primary_key=True)
    citizen_identity_id = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=10)
    email = models.CharField(max_length=255)
    address = models.CharField(max_length=255, null=True, blank=True)
    identity_card = models.TextField()
    status = models.CharField(max_length=255)
    otp = models.CharField(max_length=6, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)  # Date of birth
    place_of_birth = models.CharField(max_length=255, null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], null=True, blank=True)
    issue_date = models.DateField(null=True, blank=True) 
    place_of_issue = models.CharField(max_length=255, null=True, blank=True)
    nationality = models.CharField(max_length=100)

    def __str__(self):
        return self.id
    
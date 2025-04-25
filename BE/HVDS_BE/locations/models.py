from django.db import models

class Location(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    road = models.CharField(max_length=255)
    dist = models.CharField(max_length=255)
    city = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name}, {self.road} street, district {self.dist}, {self.city} city"
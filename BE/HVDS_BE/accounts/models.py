from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager, PermissionsMixin, Group, Permission
from django.contrib.auth.validators import UnicodeUsernameValidator

class Role(models.Model):
    role_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.role_name

class AccountManager(UserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        user = self.create_user(
            username,
            email,
            password,
            role_id=Role.objects.get(id=1),
            **extra_fields
        )
        return user
    
class Account(AbstractUser):
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    username = models.CharField(
        error_messages={'unique': 'A user with that username already exists.'},
        help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
        max_length=150,
        unique=True,
        validators=[UnicodeUsernameValidator()],
        verbose_name='username'
    )
    password = models.CharField(max_length=128, verbose_name='password')
    email = models.EmailField(unique=True, max_length=254, verbose_name='email address')
    status = models.CharField(
        max_length=8,
        choices=[('Active', 'Active'), ('Deactive', 'Deactive')],
        default='Active',
        verbose_name='Status of account: [Active, Deactive]'
    )
    role_id = models.ForeignKey(Role, null=True, on_delete=models.SET_NULL)

    # Required fields for custom user model
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=True)

    objects = AccountManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username




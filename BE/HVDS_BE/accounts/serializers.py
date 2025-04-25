from rest_framework import serializers
from .models import Account, Role
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class AccountSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role_id.role_name", read_only=True)
    class Meta:
        model = Account
        fields = ['id', 'username', 'password', 'email', 'status', 'role']

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role.role_name", read_only=True)

    class Meta:
        model = Account
        fields = ['id', 'username', 'email', 'role']
        
class ListSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="role_id.role_name", read_only=True)

    class Meta:
        model = Account
        fields = ['id', 'username', 'password', 'role', 'email', 'status']
        
class AccountStatusSerializer(serializers.ModelSerializer):
    status = serializers.CharField(write_only=True)

    class Meta:
        model = Account
        fields = ['id', 'status']

class AccountUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # Mật khẩu cũ để xác minh
    new_password = serializers.CharField(write_only=True, required=False)  # Mật khẩu mới (tùy chọn)

    class Meta:
        model = Account
        fields = ['id', 'username', 'email', 'password', 'new_password']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
        }

    def validate(self, data):
        if not any(key in data for key in ['username', 'email', 'new_password']):
            raise serializers.ValidationError("At least one field (username, email, or new_password) must be provided.")
        return data
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        if self.user.status == 'Deactive':
            return {'message': 'This account has been deactivated'}
        
        data['role'] = self.user.role_id.role_name if self.user.role_id else None
        data['id'] = self.user.id
        return data
    
class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, data):
        refresh = data.get('refresh')
        try:
            token = RefreshToken(refresh)
            token.verify()
        except Exception as e:
            raise serializers.ValidationError("Invalid or expired refresh token")
        return data

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'role': user.role if hasattr(user, 'role') else ('Admin' if user.is_staff else 'User')
        }
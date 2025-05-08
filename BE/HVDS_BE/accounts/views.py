from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from .models import Account, Role
from .serializers import UserSerializer, AccountSerializer, ListSerializer, RoleSerializer, AccountStatusSerializer, AccountUpdateSerializer, CustomTokenObtainPairSerializer, RefreshTokenSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = UserSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not request.user.is_staff and request.user != instance:
            return Response({"error": "You can only update your own account."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        if not request.user.is_staff and request.user != instance:
            return Response({"error": "You can only update your own account."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if not request.user.is_staff and request.user != instance:
            return Response({"error": "You can only delete your own account."}, status=status.HTTP_403_FORBIDDEN)
        
        instance.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAdminUser]

class LogoutView(viewsets.ViewSet):
    permission_classes = [AllowAny]
    def create(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=200)
        except:
            return Response({"error": "Invalid token"}, status=400)

class RegisterView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        role_name = request.data.get("role")
        role = Role.objects.get(role_name=role_name)
        email = request.data.get("email")

        if not username or not password:
            return Response({"error": "Missing fields"}, status=status.HTTP_400_BAD_REQUEST)
        
        if confirm_password != password:
            return Response({"error": "Confirm password is different"}, status=status.HTTP_400_BAD_REQUEST)

        if Account.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        if Account.objects.filter(email=email).exists():
            return Response({"error": "email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.is_staff:
            return Response({"error": "Only admins can create admin users."}, status=status.HTTP_403_FORBIDDEN)

        user = Account.objects.create_user(username=username, password=password, role_id=role, email=email)
        
        if role_name == "Admin":
            user.is_staff = True  # Allows admin access
            user.is_superuser = True  # Grants superuser privileges if needed
            user.save()
        return Response({"message": f"Account registered successfully", "data": {"account_id": user.id}}, status=status.HTTP_201_CREATED)
    
class AccountListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = Account.objects.all()
        serializer = ListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AccountStatusUpdateView(generics.UpdateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountStatusSerializer
    lookup_field = 'id'
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        
        instance.status = serializer.validated_data['status']
        instance.save()
        
        return Response({"message": "Change status account successfully"}, status=status.HTTP_200_OK)
    
class AccountUpdateView(generics.UpdateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountUpdateSerializer
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Xác minh mật khẩu cũ
        if not instance.check_password(serializer.validated_data['password']):
            return Response({"message": "wrong password"}, status=status.HTTP_400_BAD_REQUEST)

        # Cập nhật các trường nếu có trong input
        if 'username' in serializer.validated_data:
            instance.username = serializer.validated_data['username']
        if 'email' in serializer.validated_data:
            instance.email = serializer.validated_data['email']
        if 'new_password' in serializer.validated_data:
            instance.set_password(serializer.validated_data['new_password'])

        instance.save()
        return Response({"message": "Account updated successfully"}, status=status.HTTP_200_OK)
    
class RefreshTokenView(APIView):
    def get(self, request, *args, **kwargs):
        # Extract refresh token (e.g., from query param, body, or header)
        refresh_token = request.query_params.get('refresh') or request.data.get('refresh')
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate refresh token
        serializer = RefreshTokenSerializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        # Get user from token
        try:
            token = serializer.validated_data['refresh']
            refresh = RefreshToken(token)
            user = refresh.access_token.payload.get('user_id')
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user)
        except Exception as e:
            return Response(
                {"error": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate new tokens and role
        tokens = serializer.get_tokens(user)
        return Response(tokens, status=status.HTTP_200_OK)
    
class AccountProfileView(generics.RetrieveAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    lookup_field = 'id'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CitizenForgetPasswordView(generics.RetrieveAPIView):
    queryset = Account.objects.all()
    # serializer_class = CitizenApplicationsSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        application = CarParrots.objects.filter(citizen_id=instance)
        response_serializer = CarParrotResponseSerializer(application, many=True)
        return Response({
            "citizen_id": data['id'],
            "applications": response_serializer.data
        }, status=status.HTTP_200_OK)
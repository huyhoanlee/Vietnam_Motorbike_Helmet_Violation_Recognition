import { useState, useRef, } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper, 
  Box, 
  Alert,
  IconButton,
  InputAdornment 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import config from "../../config";
import PenguinAdmin from '../Login/Animation/PenguinAdmin';

const API_BASE_URL = `${config.API_URL}`;

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    
    // State for the penguin animation
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const usernameFieldRef = useRef<HTMLDivElement>(null);
    const passwordFieldRef = useRef<HTMLDivElement>(null);
    
    // Update mouse position when moving over input fields
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!usernameFieldRef.current || !passwordFieldRef.current) return;
        
        const rect = (focusedField === 'password' ? 
            passwordFieldRef.current : usernameFieldRef.current).getBoundingClientRect();
        
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        setMousePosition({ x, y });
    };
    
    // Reset mouse position when leaving input fields
    const handleMouseLeave = () => {
        setMousePosition(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${API_BASE_URL}accounts/login/`, {
                username,
                password
            });

            if (response.data.message === "This account has been deactivated") {
                setError("Account has been Deactive.");
                return;
            }

            const { access, refresh, role, id } = response.data;

            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            localStorage.setItem('user_role', role);
            localStorage.setItem("user_id", id);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.message === "This account has been deactivated") {
                setError("Account has been Deactive.");
            } else {
                setError("Incorrect username or password.");
            }
        }
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper 
                    elevation={6} 
                    sx={{ 
                        p: 4, 
                        width: '100%', 
                        borderRadius: '12px',
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-5px)'
                        }
                    }}
                >
                    <Box sx={{ mb: 4 }}>
                        <PenguinAdmin 
                            isPasswordField={focusedField === 'password'} 
                            isPasswordVisible={showPassword}
                            inputPosition={mousePosition}
                        />
                    </Box>
                    
                    <Typography 
                        variant="h4" 
                        align="center" 
                        fontWeight="bold" 
                        gutterBottom
                        sx={{ 
                            color: '#1F2937',
                            mb: 3
                        }}
                    >
                        Admin Login
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <Box 
                            ref={usernameFieldRef}
                            onMouseMove={handleMouseMove} 
                            onMouseLeave={handleMouseLeave}
                            onFocus={() => setFocusedField('username')}
                        >
                            <TextField
                                label="Username"
                                variant="outlined"
                                fullWidth
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                margin="normal"
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6',
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Box 
                            ref={passwordFieldRef}
                            onMouseMove={handleMouseMove} 
                            onMouseLeave={handleMouseLeave}
                            onFocus={() => setFocusedField('password')}
                        >
                            <TextField
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                fullWidth
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#3B82F6',
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ 
                                mt: 3, 
                                mb: 2, 
                                py: 1.5, 
                                borderRadius: '8px',
                                bgcolor: '#3B82F6',
                                '&:hover': {
                                    bgcolor: '#2563EB',
                                }
                            }}
                        >
                            Log In
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default AdminLogin;
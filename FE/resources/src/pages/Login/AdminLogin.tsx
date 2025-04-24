import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Container, Paper, Box, Alert } from '@mui/material';
import config from "../../config";

const API_BASE_URL = `${config.API_URL}`;

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e :any) => {
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
                setError("Tên đăng nhập hoặc mật khẩu không đúng.");
            }
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: '12px' }}>
                    <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
                        Đăng nhập
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            label="Tên đăng nhập"
                            variant="outlined"
                            fullWidth
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                        />

                        <TextField
                            label="Mật khẩu"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2, py: 1.5, borderRadius: '8px' }}
                        >
                            Đăng nhập
                        </Button>
                    </form>
                </Paper>
            </Box>
        </Container>
    );
};

export default AdminLogin;

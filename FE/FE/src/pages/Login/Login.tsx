import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography } from "@mui/material";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("username", username);
      navigate("/dashboard");
    } else {
      setError("Blank fields, Invalid username or password!");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", justifyContent: "center" }}>
      <Box sx={{ padding: 3, backgroundColor: "#f5f5f5", borderRadius: 2, boxShadow: 3, width: 300 }}>
        <Typography variant="h5" sx={{ mb: 2, textAlign: "center" }}>Login</Typography>
        <TextField fullWidth label="Username" variant="outlined" sx={{ mb: 2 }} value={username} onChange={(e) => setUsername(e.target.value)} />
        <TextField fullWidth label="Password" type="password" variant="outlined" sx={{ mb: 2 }} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <Button fullWidth variant="contained" color="primary" onClick={handleLogin}>Login</Button>
      </Box>
    </Box>
  );
};

export default Login;

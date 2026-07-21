import React, { useState } from 'react';
import { Box, Card, Typography, TextField, Button, InputAdornment, IconButton } from '@mui/material';
import { Mail, Lock, Eye, EyeOff, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('erp_token', res.data.access_token);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error al iniciar sesión", error);
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% -20%, #1e293b, #0f172a)',
        p: 2
      }}
    >
      <Card 
        sx={{
          maxWidth: 420,
          width: '100%',
          p: { xs: 3, sm: 5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box 
          sx={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
          }}
        >
          <Package size={32} color="white" />
        </Box>

        <Box textAlign="center" width="100%">
          <Typography variant="h4" gutterBottom>Bienvenido de nuevo</Typography>
          <Typography variant="body2" color="text.secondary">
            Ingresa tus credenciales para acceder al ERP
          </Typography>
        </Box>

        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TextField
            fullWidth
            label="Usuario"
            variant="outlined"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail size={20} style={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Contraseña"
            variant="outlined"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} style={{ color: '#64748b' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button 
            type="submit" 
            variant="contained" 
            size="large" 
            fullWidth 
            sx={{ mt: 1, py: 1.5, fontSize: '1.05rem' }}
          >
            Iniciar Sesión
          </Button>
        </form>
      </Card>
    </Box>
  );
}

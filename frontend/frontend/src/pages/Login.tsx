import React, { useState } from 'react';
import { Button, TextField, Paper, Alert } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { name, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      backgroundImage: 'url(/belmont.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Paper style={{
        padding: 32,
        maxWidth: 400,
        width: '100%',
        background: 'rgba(255,255,255,0.85)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        borderRadius: 12
      }}>
        <h2 style={{ textAlign: 'center' }}>Staff Login</h2>
        <form onSubmit={handleSubmit}>
          <TextField label="Name" fullWidth value={name} onChange={e => setName(e.target.value)} margin="normal" />
          <TextField label="Password" type="password" fullWidth value={password} onChange={e => setPassword(e.target.value)} margin="normal" />
          {error && <Alert severity="error">{error}</Alert>}
          <Button variant="contained" color="primary" fullWidth type="submit" style={{ marginTop: 16 }}>
            Login
          </Button>
        </form>
      </Paper>
    </div>
  );
}; 
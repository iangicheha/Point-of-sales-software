import React, { useEffect, useState } from 'react';
import { Paper, List, ListItem, ListItemText, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, IconButton, Select, MenuItem as MuiMenuItem, InputLabel, FormControl, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const Users = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'waiter' });
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleOpen = (u?: any) => {
    setEditUser(u || null);
    setForm(u ? { name: u.name, email: u.email, password: '', role: u.role } : { name: '', email: '', password: '', role: 'waiter' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      if (editUser) {
        await axios.put(`/api/users/${editUser.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/users', form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setOpen(false);
      setSuccess('Saved successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to save user');
    }
    setLoading(false);
  };

  const handleDelete = (id: number) => setDeleteId(id);
  const confirmDelete = async () => {
    if (deleteId == null) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`/api/users/${deleteId}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Deleted successfully');
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
    setLoading(false);
    setDeleteId(null);
  };

  // Temporarily removed role check for demo purposes
  // if (user?.role !== 'admin') return <div />;

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>Users</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()} style={{ marginBottom: 16 }}>Add User</Button>
      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {users.map(u => (
          <ListItem key={u.id} secondaryAction={
            <>
              <IconButton edge="end" onClick={() => handleOpen(u)}><Edit /></IconButton>
              <IconButton edge="end" onClick={() => handleDelete(u.id)}><Delete /></IconButton>
            </>
          }>
            <ListItemText
              primary={`${u.name} (${u.role})`}
              secondary={u.email}
            />
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editUser ? 'Edit' : 'Add'} User</DialogTitle>
        <DialogContent>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" />
          <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth margin="normal" />
          <TextField label="Password" name="password" value={form.password} onChange={handleChange} fullWidth margin="normal" type="password" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select name="role" value={form.role} onChange={handleChange} label="Role">
              <MuiMenuItem value="admin">Admin</MuiMenuItem>
              <MuiMenuItem value="frontdesk">Front Desk</MuiMenuItem>
              <MuiMenuItem value="kitchen">Kitchen</MuiMenuItem>
              <MuiMenuItem value="waiter">Waiter</MuiMenuItem>
              <MuiMenuItem value="cashier">Cashier</MuiMenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>Save</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteId != null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this user?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}><Alert severity="success">{success}</Alert></Snackbar>
    </Paper>
  );
}; 
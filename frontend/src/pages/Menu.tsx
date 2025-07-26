import React, { useEffect, useState } from 'react';
import { Paper, List, ListItem, ListItemText, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, IconButton, Select, MenuItem as MuiMenuItem, InputLabel, FormControl, CircularProgress, Snackbar, Alert, TextField as MuiTextField } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const Menu = () => {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', category: '', type: '', price: '', isAvailable: 'true' });
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/menu', { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data);
    } catch (err) {
      setError('Failed to load menu');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [token]);

  const handleOpen = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? {
      name: item.name,
      category: item.category,
      type: item.type || '',
      price: item.price,
      isAvailable: item.isAvailable ? 'true' : 'false'
    } : { name: '', category: '', type: '', price: '', isAvailable: 'true' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    setError('');
    const payload = { ...form, isAvailable: form.isAvailable === 'true' };
    try {
      if (editItem) {
        await axios.put(`/api/menu/${editItem.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/menu', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setOpen(false);
      setSuccess('Saved successfully');
      fetchItems();
    } catch (err) {
      setError('Failed to save menu item');
    }
    setLoading(false);
  };

  const handleDelete = (id: number) => setDeleteId(id);
  const confirmDelete = async () => {
    if (deleteId == null) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.delete(`/api/menu/${deleteId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Menu item removed successfully');
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove menu item. Please try again.');
    }
    setLoading(false);
    setDeleteId(null);
  };

  const drinkTypes = ['Wine', 'Champagne', 'Juice', 'Soda', 'Beer', 'Whiskey', 'Cocktail', 'Water'];
  const mealTypes = ['Main Course', 'Appetizer', 'Dessert', 'Side', 'Salad', 'Soup', 'Breakfast'];

  // Filter out deleted items from display (backend now handles this)
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Temporarily removed role check for demo purposes
  // if (user?.role !== 'admin') return <div />;

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>Menu</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()} style={{ marginBottom: 16 }}>Add Menu Item</Button>
      <MuiTextField
        placeholder="Search menu..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        size="small"
        fullWidth
        style={{ marginBottom: 16 }}
      />
      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {filteredItems.map(item => (
          <ListItem key={item.id} secondaryAction={
            <>
              <IconButton edge="end" onClick={() => handleOpen(item)}><Edit /></IconButton>
              <IconButton edge="end" onClick={() => handleDelete(item.id)}><Delete /></IconButton>
            </>
          }>
            <ListItemText
              primary={`${item.name} (${item.category}${item.type ? ' - ' + item.type : ''}) - $${item.price}`}
              secondary={item.isAvailable ? 'Available' : 'Unavailable'}
            />
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editItem ? 'Edit' : 'Add'} Menu Item</DialogTitle>
        <DialogContent>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select name="category" value={form.category} onChange={handleChange} label="Category">
              <MuiMenuItem value="Meal">Meal</MuiMenuItem>
              <MuiMenuItem value="Drink">Drink</MuiMenuItem>
            </Select>
          </FormControl>
          {form.category === 'Drink' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Drink Type</InputLabel>
              <Select name="type" value={form.type} onChange={handleChange} label="Drink Type">
                {drinkTypes.map(type => <MuiMenuItem key={type} value={type}>{type}</MuiMenuItem>)}
              </Select>
            </FormControl>
          )}
          {form.category === 'Meal' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Meal Type</InputLabel>
              <Select name="type" value={form.type} onChange={handleChange} label="Meal Type">
                {mealTypes.map(type => <MuiMenuItem key={type} value={type}>{type}</MuiMenuItem>)}
              </Select>
            </FormControl>
          )}
          <TextField label="Price" name="price" value={form.price} onChange={handleChange} fullWidth margin="normal" />
          <FormControl fullWidth margin="normal">
            <InputLabel>Availability</InputLabel>
            <Select name="isAvailable" value={form.isAvailable} onChange={handleChange} label="Availability">
              <MuiMenuItem value="true">Available</MuiMenuItem>
              <MuiMenuItem value="false">Unavailable</MuiMenuItem>
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
        <DialogContent>Are you sure you want to delete this menu item?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}><Alert severity="success">{success}</Alert></Snackbar>
    </Paper>
  );
}; 
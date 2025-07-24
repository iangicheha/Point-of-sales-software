import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Grid, TextField, Autocomplete, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { Delete, Save, Add } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

export const EditPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Add state for modal
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: '', minThreshold: 0, category: '' });
  const [newItemLoading, setNewItemLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [poRes, suppliersRes, itemsRes] = await Promise.all([
          axios.get(`/api/purchase-orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/inventory', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const poData = poRes.data;
        setSuppliers(suppliersRes.data);
        setItems(itemsRes.data);

        setSelectedSupplier(poData.supplier);
        setOrderItems(poData.items.map((item: any) => ({
          id: item.item.id,
          name: item.item.name,
          sku: item.item.customSku,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })));
        setNotes(poData.notes);

      } catch (err) {
        setError('Failed to load purchase order data');
      }
      setLoading(false);
    };
    fetchData();
  }, [id, token]);

  const handleAddItem = (item: any) => {
    if (item && !orderItems.some(i => i.id === item.id)) {
      setOrderItems([...orderItems, { ...item, quantity: 1, price: 0, sku: item.customSku }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter(i => i.id !== itemId));
  };

  const handleItemChange = (itemId: string, field: 'quantity' | 'price', value: any) => {
    setOrderItems(orderItems.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * 0.16; // Assuming 16% VAT
  const total = subtotal + tax;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        supplierId: selectedSupplier.id,
        items: orderItems.map(({ id, quantity, price }) => ({ id, quantity, price })),
        notes,
        subtotal,
        tax,
        total,
      };
      await axios.put(`/api/purchase-orders/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Purchase Order updated successfully!');
      setTimeout(() => navigate(`/purchase-order/${id}`), 1500);
    } catch (err) {
      setError('Failed to update purchase order');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Edit Purchase Order #{id?.slice(-6).toUpperCase()}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate(`/purchase-order/${id}`)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={!selectedSupplier || orderItems.length === 0 || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        {/* Left Column: Details & Items */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Details</Typography>
            <Autocomplete
              options={suppliers}
              getOptionLabel={(option) => option.name}
              value={selectedSupplier}
              onChange={(event, newValue) => setSelectedSupplier(newValue)}
              renderInput={(params) => <TextField {...params} label="Select Supplier" variant="outlined" />}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Items</Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => `${option.name} (SKU: ${option.customSku || 'N/A'})`}
                onChange={(event, newValue) => handleAddItem(newValue)}
                renderInput={(params) => <TextField {...params} label="Add Item to Order" variant="outlined" />}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" startIcon={<Add />} onClick={() => setNewItemOpen(true)}>
                New Item
              </Button>
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price (Ksh)</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          sx={{ width: 80 }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                          sx={{ width: 100 }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{(item.quantity * item.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleRemoveItem(item.id)}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Column: Summary & Notes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Subtotal</Typography>
                <Typography>Ksh {subtotal.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Tax (16%)</Typography>
                <Typography>Ksh {tax.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 'bold', mt: 1 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">Ksh {total.toFixed(2)}</Typography>
              </Stack>
            </Stack>
            <TextField
              label="Notes"
              multiline
              rows={4}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mt: 3 }}
            />
          </Paper>
        </Grid>
      </Grid>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* New Item Modal */}
      {newItemOpen && (
        <Box position="fixed" top={0} left={0} width="100vw" height="100vh" zIndex={1300} bgcolor="rgba(0,0,0,0.3)" display="flex" alignItems="center" justifyContent="center">
          <Paper sx={{ p: 4, minWidth: 350 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add New Inventory Item</Typography>
            <Stack spacing={2}>
              <TextField label="Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} fullWidth required />
              <TextField label="Quantity" type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} fullWidth required />
              <TextField label="Unit" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} fullWidth required />
              <TextField label="Min Threshold" type="number" value={newItem.minThreshold} onChange={e => setNewItem({ ...newItem, minThreshold: Number(e.target.value) })} fullWidth required />
              <TextField label="Category" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} fullWidth required />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={() => setNewItemOpen(false)} disabled={newItemLoading}>Cancel</Button>
                <Button variant="contained" onClick={async () => {
                  setNewItemLoading(true);
                  try {
                    const res = await axios.post('/api/inventory', newItem, { headers: { Authorization: `Bearer ${token}` } });
                    setItems(prev => [...prev, res.data]);
                    setNewItemOpen(false);
                    setNewItem({ name: '', quantity: 0, unit: '', minThreshold: 0, category: '' });
                  } catch (e) {
                    alert('Failed to add item');
                  }
                  setNewItemLoading(false);
                }} disabled={newItemLoading || !newItem.name || !newItem.unit || !newItem.category}>Save</Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  );
}; 
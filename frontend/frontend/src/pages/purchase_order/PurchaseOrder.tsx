import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'Submitted':
      return <Chip label={status} color="primary" />;
    case 'Completed':
      return <Chip label={status} color="success" />;
    case 'Draft':
      return <Chip label={status} color="default" />;
    default:
      return <Chip label={status} />;
  }
};

export const PurchaseOrder = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const res = await axios.get('/api/purchase-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPurchaseOrders(res.data);
      } catch (err) {
        setError('Failed to fetch purchase orders');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, [token]);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Purchase Orders
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/purchase-order/new')}>
            New Purchase Order
          </Button>
        </Stack>
      </Paper>

      {/* PO List/Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total (Ksh)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow hover key={po.id}>
                  <TableCell>{po.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{po.supplier?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusChip(po.status)}</TableCell>
                  <TableCell align="right">{Number(po.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button startIcon={<Visibility />} size="small" variant="outlined" onClick={() => navigate(`/purchase-order/${po.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}; 
import React, { useEffect, useState } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  MenuItem as MuiMenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Grid,
  Stack,
  Tooltip,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ReceiptModal } from '../components/ReceiptModal';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';

// Utility function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(amount);
};

interface Payment {
  id: number;
  status: string;
  method: string;
  amount: number;
  transactionRef?: string;
  order?: {
    id: number;
    tableNumber?: string;
    createdAt?: string; // Add this line for date fallback
  };
  paidAt?: string; // Added for payment history
  createdAt?: string; // Added for payment history
}

interface Order {
  id: number;
  tableNumber?: string;
  status: string;
  items?: Array<{
    price: number;
    quantity: number;
  }>;
  payments?: Payment[];
}

export const Payments = () => {
  const { token, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ orderId: '', amount: '', method: 'cash', status: 'completed', transactionRef: '', mpesaPhone: '' });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mpesaDialog, setMpesaDialog] = useState<{ open: boolean, paymentId?: number, orderId?: number, amount?: number, checkingStatus?: boolean }>({ open: false });
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaResult, setMpesaResult] = useState('');
  const [mpesaCheckInterval, setMpesaCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [receipt, setReceipt] = useState<{ open: boolean, orderId?: number }>({ open: false });
  const [mpesaStatus, setMpesaStatus] = useState<{ checking: boolean; message: string; severity: 'info' | 'success' | 'error'; } | null>(null);
  const [stkInterval, setStkInterval] = useState<NodeJS.Timeout | null>(null);
  const [filterFrom, setFilterFrom] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [filterTo, setFilterTo] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Grouping state
  const handleGroupByChange = (_: any, value: 'day' | 'week' | 'month') => {
    if (value) setGroupBy(value);
  };
  const TIMEZONE = 'Africa/Nairobi';
  const getPaymentDate = (p: Payment) => p.paidAt || p.createdAt;

  // Helper to get week start (Monday) for a date
  function getWeekStart(date: string) {
    return dayjs(date).startOf('week').add(1, 'day');
  }
  // Helper to get month start for a date
  function getMonthStart(date: string) {
    return dayjs(date).startOf('month');
  }

  // Filtered payments
  const filteredPayments = payments.filter(p => {
    const date = dayjs(getPaymentDate(p)).tz(TIMEZONE).format('YYYY-MM-DD');
    if (filterFrom && date < filterFrom) return false;
    if (filterTo && date > filterTo) return false;
    if (filterMethod !== 'all' && p.method !== filterMethod) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search && !(
      (p.order?.tableNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionRef || '').toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  // Group filtered payments by day, week, or month
  const groups: Record<string, Payment[]> = {};
  filteredPayments.forEach(p => {
    const date = dayjs(getPaymentDate(p)).tz(TIMEZONE).format('YYYY-MM-DD');
    let key = '';
    if (groupBy === 'day') {
      key = date;
    } else if (groupBy === 'week') {
      key = getWeekStart(date).format('YYYY-[W]WW');
    } else {
      key = getMonthStart(date).format('YYYY-MM');
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  // Sort group keys descending (most recent first)
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  // Add state to track expanded groups
  const handleToggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Summary calculations for selected group
  let summaryPayments: Payment[] = [];
  if (groupBy === 'day') {
    const todayKey = dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
    summaryPayments = groups[todayKey] || [];
  } else if (groupBy === 'week') {
    const weekKey = getWeekStart(dayjs().tz(TIMEZONE).format('YYYY-MM-DD')).format('YYYY-[W]WW');
    summaryPayments = groups[weekKey] || [];
  } else {
    const monthKey = getMonthStart(dayjs().tz(TIMEZONE).format('YYYY-MM-DD')).format('YYYY-MM');
    summaryPayments = groups[monthKey] || [];
  }
  const totalPaymentsSummary = summaryPayments.length;
  const totalAmountSummary = summaryPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const methodTotals = ['cash', 'mpesa', 'card', 'wallet'].map(method => ({
    method,
    count: summaryPayments.filter(p => p.method === method).length,
    amount: summaryPayments.filter(p => p.method === method).reduce((sum, p) => sum + Number(p.amount), 0)
  }));

  // Payment History Section
  const handleToggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Group completed payments by day
  const completedPayments = payments.filter(p => p.status === 'completed');
  const paymentsByDay: Record<string, typeof completedPayments> = {};
  completedPayments.forEach(payment => {
    const date = dayjs(payment.paidAt || payment.createdAt).format('YYYY-MM-DD');
    if (!paymentsByDay[date]) paymentsByDay[date] = [];
    paymentsByDay[date].push(payment);
  });
  const sortedDates = Object.keys(paymentsByDay).sort((a, b) => dayjs(b).unix() - dayjs(a).unix());
  const dailyStats = sortedDates.map((date, idx) => {
    const dayPayments = paymentsByDay[date];
    const totalPayments = dayPayments.length;
    const totalAmount = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    let percentChange: number | null = null;
    if (idx < sortedDates.length - 1) {
      const prevPayments = paymentsByDay[sortedDates[idx + 1]];
      const prevTotalAmount = prevPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      if (prevTotalAmount > 0) {
        percentChange = ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100;
      } else if (totalAmount > 0) {
        percentChange = 100;
      } else {
        percentChange = 0;
      }
    }
    return { date, totalPayments, totalAmount, percentChange };
  });

  // Clear interval when component unmounts
  useEffect(() => {
    return () => {
      if (stkInterval) {
        clearInterval(stkInterval);
      }
    };
  }, [stkInterval]);

  const checkMpesaStatus = async (paymentId: number) => {
    try {
      const response = await axios.get(`/api/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'completed') {
        if (stkInterval) {
          clearInterval(stkInterval);
          setStkInterval(null);
        }
        // Update form with the actual M-Pesa transaction details
        setForm(prev => ({
          ...prev,
          status: 'completed',
          transactionRef: response.data.transactionRef // This should be the actual M-Pesa transaction ID
        }));
        setMpesaStatus({
          checking: false,
          message: 'Payment completed successfully!',
          severity: 'success'
        });
      } else if (response.data.status === 'failed') {
        if (stkInterval) {
          clearInterval(stkInterval);
          setStkInterval(null);
        }
        setMpesaStatus({
          checking: false,
          message: 'Payment failed. Please try again.',
          severity: 'error'
        });
        // Clear any transaction reference if payment failed
        setForm(prev => ({
          ...prev,
          transactionRef: ''
        }));
      }
    } catch (error) {
      console.error('Error checking M-Pesa status:', error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/payments', { headers: { Authorization: `Bearer ${token}` } });
      setPayments(res.data);
    } catch (err) {
      setError('Failed to load payments');
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch {}
  };

  useEffect(() => { fetchPayments(); fetchOrders(); }, [token]);

  const handleOpen = () => {
    setForm({
      orderId: '',
      amount: '',
      method: 'cash',
      status: user?.role === 'cashier' ? 'completed' : 'completed',
      transactionRef: '',
      mpesaPhone: ''
    });
    setFormErrors({});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const VAT_RATE = 0.16;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }

    // Auto-calculate amount when order is selected
    if (name === 'orderId' && value) {
      const selectedOrder = orders.find(order => order.id === value);
      if (selectedOrder) {
        const subtotal = selectedOrder.items?.reduce((sum: number, item: any) => 
          sum + (Number(item.price) * item.quantity), 0) || 0;
        setForm(prev => ({ ...prev, amount: subtotal.toString() }));
      }
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!form.orderId) {
      errors.orderId = 'Order is required';
    }

    if (!form.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errors.amount = 'Amount must be a valid positive number';
    }

    if (form.method !== 'cash' && !form.transactionRef) {
      errors.transactionRef = 'Transaction reference is required for non-cash payments';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    try {
      await axios.post('/api/payments', {
        order: { id: form.orderId },
        amount: Number(form.amount),
        method: form.method,
        status: form.status,
        transactionRef: form.transactionRef,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setOpen(false);
      setSuccess('Payment saved successfully');
      fetchPayments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save payment');
    }
    setLoading(false);
  };

  const handleMpesa = (payment: Payment) => {
    setMpesaDialog({ open: true, paymentId: payment.id, orderId: payment.order?.id, amount: payment.amount });
    setMpesaPhone('');
    setMpesaResult('');
  };

  const handleMpesaSubmit = async () => {
    setLoading(true);
    setMpesaResult('');
    try {
      const resp = await axios.post('/api/payments/mpesa/initiate', {
        amount: mpesaDialog.amount,
        phone: mpesaPhone,
        orderId: mpesaDialog.orderId,
      });

      setMpesaResult('M-Pesa request sent. Please check your phone and enter PIN.');
      setMpesaDialog(prev => ({ ...prev, checkingStatus: true }));

      // Start polling for payment status
      if (mpesaCheckInterval) {
        clearInterval(mpesaCheckInterval);
      }
      
      const interval = setInterval(() => {
        if (resp.data.paymentId) {
          checkMpesaStatus(resp.data.paymentId);
        }
      }, 5000); // Check every 5 seconds
      
      setMpesaCheckInterval(interval);

    } catch (err: any) {
      setMpesaResult('Failed to initiate M-Pesa payment');
      setMpesaDialog(prev => ({ ...prev, checkingStatus: false }));
    }
    setLoading(false);
  };

  const handleStkPush = async () => {
    if (!form.mpesaPhone || !form.amount || !form.orderId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const resp = await axios.post('/api/payments/mpesa/initiate', {
        amount: Number(form.amount),
        phone: form.mpesaPhone,
        orderId: form.orderId,
      });

      setMpesaStatus({
        checking: true,
        message: 'STK Push sent. Please check your phone and enter PIN.',
        severity: 'info'
      });
      // Set status to pending and make it read-only
      setForm(prev => ({ ...prev, status: 'pending' }));

      // Start polling for payment status
      if (stkInterval) {
        clearInterval(stkInterval);
      }
      
      // Check status every 5 seconds until payment completes or fails
      const interval = setInterval(() => {
        if (resp.data.paymentId) {
          checkMpesaStatus(resp.data.paymentId);
        }
      }, 5000);
      
      setStkInterval(interval);

    } catch (err: any) {
      setMpesaStatus({
        checking: false,
        message: 'Failed to initiate M-Pesa payment',
        severity: 'error'
      });
    }
    setLoading(false);
  };

  // Get pending orders for the dropdown
  const pendingOrders = orders.filter(order =>
    order.status === 'sent_to_kitchen' || order.status === 'completed'
  );

  if (!user || (user.role !== 'admin' && user.role !== 'cashier')) return <div />;

  if (loading && !payments.length) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <CircularProgress />
    </Box>
  );

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>Payments</Typography>
      {/* Group By Toggle */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <ToggleButtonGroup
          value={groupBy}
          exclusive
          onChange={handleGroupByChange}
          size="small"
        >
         <ToggleButton value="day">Daily</ToggleButton>
          <ToggleButton value="week">Weekly</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#ffebee' }}>
            <ListAltIcon color="primary" fontSize="large" />
            <div>
             <Typography variant="subtitle2">Total Payments {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</Typography>
             <Typography variant="h6" sx={{ fontWeight: 600 }}>{totalPaymentsSummary}</Typography>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#e3f2fd' }}>
            <MonetizationOnIcon color="success" fontSize="large" />
            <div>
             <Typography variant="subtitle2">Total Amount {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</Typography>
             <Typography variant="h6" sx={{ fontWeight: 600 }}>KES {totalAmountSummary.toLocaleString()}</Typography>
            </div>
          </Paper>
        </Grid>
        {methodTotals.map(mt => (
          <Grid item xs={12} sm={6} md={3} key={mt.method}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fffde7' }}>
              <PaymentIcon color="warning" fontSize="large" />
              <div>
                <Typography variant="subtitle2">{mt.method.charAt(0).toUpperCase() + mt.method.slice(1)}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{mt.count} / KES {mt.amount.toLocaleString()}</Typography>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {/* Filters */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          label="From"
          type="date"
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="To"
          type="date"
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Method</InputLabel>
          <Select value={filterMethod} label="Method" onChange={e => setFilterMethod(e.target.value)}>
            <MuiMenuItem value="all">All</MuiMenuItem>
            <MuiMenuItem value="cash">Cash</MuiMenuItem>
            <MuiMenuItem value="mpesa">M-Pesa</MuiMenuItem>
            <MuiMenuItem value="card">Card</MuiMenuItem>
            <MuiMenuItem value="wallet">Wallet</MuiMenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)}>
            <MuiMenuItem value="all">All</MuiMenuItem>
            <MuiMenuItem value="completed">Completed</MuiMenuItem>
            <MuiMenuItem value="pending">Pending</MuiMenuItem>
            <MuiMenuItem value="failed">Failed</MuiMenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
          placeholder="Table, Ref..."
        />
      </Stack>
      {/* Add Payment Button */}
      {(user?.role === 'admin' || user?.role === 'cashier') && (
        <Button variant="contained" color="primary" onClick={handleOpen} style={{ marginBottom: 16 }}>
          Add Payment
        </Button>
      )}
      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {/* Payment Table with Grouping */}
      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{groupBy === 'day' ? 'Date' : groupBy === 'week' ? 'Week' : 'Month'}</TableCell>
                <TableCell>Table</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ref</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedGroupKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No payments found.</TableCell>
                </TableRow>
              ) : (
                sortedGroupKeys.map(groupKey => {
                  const groupPayments = groups[groupKey].slice().sort((a, b) => dayjs(b.paidAt || b.createdAt).unix() - dayjs(a.paidAt || a.createdAt).unix());
                  // Summary for this group
                  let groupLabel = '';
                  if (groupBy === 'day') {
                    groupLabel = dayjs(groupKey).format('DD MMM YYYY');
                  } else if (groupBy === 'week') {
                    const start = dayjs(groupPayments[groupPayments.length - 1].paidAt || groupPayments[groupPayments.length - 1].createdAt);
                    const end = dayjs(groupPayments[0].paidAt || groupPayments[0].createdAt);
                    groupLabel = `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`;
                  } else {
                    groupLabel = dayjs(groupPayments[0].paidAt || groupPayments[0].createdAt).format('MMMM YYYY');
                  }
                  const groupTotal = groupPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                  return (
                    <React.Fragment key={groupKey}>
                      <TableRow sx={{ bgcolor: groupBy === 'week' ? '#f5f5f5' : '#e3f2fd', fontWeight: 700 }}>
                        <TableCell colSpan={7} sx={{ fontWeight: 700 }}>
                          <IconButton size="small" onClick={() => handleToggleGroup(groupKey)}>
                            {expandedGroups[groupKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          {groupBy === 'week' ? `Week of ${groupLabel}` : groupLabel} — {groupPayments.length} payments, KES {groupTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      {expandedGroups[groupKey] && groupPayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell sx={{ pl: 6 }}>{dayjs(payment.paidAt || payment.createdAt).format('DD MMM YYYY HH:mm')}</TableCell>
                          <TableCell>{payment.order?.tableNumber || '-'}</TableCell>
                          <TableCell align="right">{formatCurrency(Number(payment.amount))}</TableCell>
                          <TableCell>{payment.method.toUpperCase()}</TableCell>
                          <TableCell>
                            <Chip label={payment.status} color={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'} size="small" />
                          </TableCell>
                          <TableCell>{payment.transactionRef || '-'}</TableCell>
                          <TableCell>
            {payment.status === 'completed' && (
                            <Button variant="outlined" size="small" onClick={() => setReceipt({ open: true, orderId: payment.order?.id })}>
                Print Receipt
              </Button>
            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" error={!!formErrors.orderId}>
            <InputLabel>Order</InputLabel>
            <Select name="orderId" value={form.orderId} onChange={handleChange} label="Order">
              {pendingOrders.map((order: Order) => {
                const total = order.items?.reduce((sum: number, item: any) => 
                  sum + (Number(item.price) * item.quantity), 0) || 0;
                const hasCompletedPayment = order.payments?.some((p: Payment) => p.status === 'completed');
                
                // Skip orders that already have a completed payment
                if (hasCompletedPayment) return null;

                return (
                  <MuiMenuItem key={order.id} value={order.id}>
                    Table {order.tableNumber || '-'} - {formatCurrency(total)}
                  </MuiMenuItem>
                );
              }).filter(Boolean)}
            </Select>
            {formErrors.orderId && (
              <Typography variant="caption" color="error">{formErrors.orderId}</Typography>
            )}
          </FormControl>

          <TextField
            label="Amount"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            fullWidth
            margin="normal"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            error={!!formErrors.amount}
            helperText={formErrors.amount}
            InputProps={{
              startAdornment: <Typography variant="body2" sx={{ mr: 1 }}>KES</Typography>
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Method</InputLabel>
            <Select name="method" value={form.method} onChange={handleChange} label="Method">
              <MuiMenuItem value="cash">Cash</MuiMenuItem>
              <MuiMenuItem value="mpesa">M-Pesa</MuiMenuItem>
              <MuiMenuItem value="card">Card</MuiMenuItem>
              <MuiMenuItem value="wallet">Wallet</MuiMenuItem>
            </Select>
          </FormControl>

          {form.method === 'mpesa' && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label="M-Pesa Phone Number"
                name="mpesaPhone"
                value={form.mpesaPhone}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="254XXXXXXXXX"
                helperText="Enter phone number in format: 254XXXXXXXXX"
              />
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleStkPush}
                disabled={loading || !form.mpesaPhone || !form.amount || !form.orderId || mpesaStatus?.checking}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                fullWidth
                sx={{ mt: 1 }}
              >
                {loading ? 'Sending...' : 'Send STK Push'}
              </Button>

              {mpesaStatus && (
                <Box sx={{ mt: 2 }}>
                  {mpesaStatus.checking && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <CircularProgress size={20} />
                      <Typography>Checking payment status...</Typography>
                    </Box>
                  )}
                  <Alert severity={mpesaStatus.severity}>
                    {mpesaStatus.message}
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          {user?.role === 'admin' && (
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={form.status}
                onChange={handleChange}
                label="Status"
                disabled={form.method === 'mpesa'} // Make status read-only for M-Pesa
              >
              <MuiMenuItem value="completed">Completed</MuiMenuItem>
              <MuiMenuItem value="pending">Pending</MuiMenuItem>
              <MuiMenuItem value="failed">Failed</MuiMenuItem>
            </Select>
              {form.method === 'mpesa' && (
                <Typography variant="caption" color="info.main">
                  Status is set automatically for M-Pesa payments.
                </Typography>
              )}
          </FormControl>
          )}

          {/* Show transaction reference only for M-Pesa and card payments */}
          {(['mpesa', 'card'].includes(form.method)) && (
            <TextField
              label="Transaction Reference"
              name="transactionRef"
              value={form.transactionRef}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!formErrors.transactionRef}
              helperText={
                form.method === 'mpesa' 
                  ? 'Transaction reference will be updated automatically after payment'
                  : form.method === 'card'
                    ? 'Enter card transaction reference'
                    : formErrors.transactionRef
              }
              InputProps={{
                readOnly: form.method === 'mpesa'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || (form.method === 'mpesa' && (!mpesaStatus?.message.includes('successfully')))}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <ReceiptModal 
        open={receipt.open} 
        orderId={receipt.orderId} 
        onClose={() => setReceipt({ open: false })} 
        mode="closed" 
      />
      
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Paper>
  );
}; 
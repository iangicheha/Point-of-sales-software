import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Box,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MenuCategories } from '../components/MenuCategories';
import { ModifierDialog } from '../components/ModifierDialog';
import { MenuItem, CartItem } from '../types/menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

export const Order = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modifierOpen, setModifierOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Search and category filter state
  const [search, setSearch] = useState('');

  // Filtered menu items for search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
  );

  // Order status state
  const [orderStatus, setOrderStatus] = useState<'draft' | 'sent_to_kitchen' | 'held' | 'cancelled'>('draft');
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [holdSuccess, setHoldSuccess] = useState(false);

  // Add location state
  const [location, setLocation] = useState<'indoor' | 'outdoor'>('indoor');

  // Add a ref for the print area
  const printRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchMenu();
  }, [token]);

  const fetchMenu = async () => {
      setLoading(true);
      try {
      const res = await axios.get<MenuItem[]>('/api/menu', {
        headers: { Authorization: `Bearer ${token}` }
      });
        setMenuItems(res.data);
      } catch (err) {
        setError('Failed to load menu');
      }
      setLoading(false);
  };

  const handleItemSelect = (item: MenuItem) => {
    setSelectedItem(item);
    setModifierOpen(true);
  };

  const handleModifierSubmit = (
    item: MenuItem,
    quantity: number,
    modifiers: NonNullable<CartItem['modifiers']>,
    specialInstructions: string
  ) => {
    const cartItem: CartItem = {
      ...item,
      quantity,
      modifiers,
      specialInstructions,
    };
    setCart(prev => [...prev, cartItem]);
  };

  const handleEditItem = (index: number) => {
    const item = cart[index];
    setSelectedItem(item);
    setModifierOpen(true);
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      setError('Please enter a table number');
      return;
    }

    if (cart.length === 0) {
      setError('Please add items to the order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderPayload = {
        tableNumber,
        status: 'sent_to_kitchen',
        type: 'restaurant', // Add the required type field
        location, // send location
        items: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: Number(item.price), // Ensure price is a number
          modifiers: item.modifiers,
          specialInstructions: item.specialInstructions,
        })),
      };
      
      console.log('Submitting order with payload:', orderPayload);
      
      const response = await axios.post('/api/orders', orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Order submission response:', response.data);

      setSuccess(true);
      setCart([]);
      setTableNumber('');
    } catch (err: any) {
      console.error('Order submission error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to submit order. Please try again.');
    }

    setLoading(false);
  };

  const handleHoldOrder = () => {
    if (!tableNumber || cart.length === 0) {
      setError('Please enter a table number and add items to hold the order.');
      return;
    }
    setOrderStatus('held');
    setHoldSuccess(true);
  };

  const handlePrintBill = () => {
    setPrintDialogOpen(true);
  };

  // Print only the receipt area
  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=400');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Bill</title>');
      printWindow.document.write('<style>body{font-family:sans-serif;} .receipt{max-width:320px;margin:auto;} .receipt h2{text-align:center;} .receipt .items{margin-bottom:8px;} .receipt .total{font-weight:bold;font-size:1.2em;} .receipt .footer{text-align:center;margin-top:16px;font-size:0.95em;} @media print { button { display: none; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 200);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 100px)' }}>
      {/* Menu Categories Panel */}
      <Box sx={{ flex: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <SearchIcon color="action" />
          <TextField
            placeholder="Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            variant="standard"
            fullWidth
            InputProps={{ disableUnderline: true }}
          />
        </Paper>
        <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MenuCategories items={filteredMenuItems} onSelectItem={handleItemSelect} />
            </Paper>
      </Box>

      {/* Order Summary Panel */}
      <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', minWidth: 340 }}>
        {/* Order Status */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Status: <b style={{ color: orderStatus === 'sent_to_kitchen' ? 'green' : orderStatus === 'held' ? 'orange' : orderStatus === 'cancelled' ? 'red' : undefined }}>{orderStatus.replace(/_/g, ' ').replace(/^./, s => s.toUpperCase())}</b>
          </Typography>
        </Box>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <TextField
          label="Table Number"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          margin="normal"
          required
          sx={{ mb: 2 }}
        />
        <FormLabel component="legend" sx={{ mt: 1 }}>Table Location</FormLabel>
        <RadioGroup
          row
          value={location}
          onChange={e => setLocation(e.target.value as 'indoor' | 'outdoor')}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="indoor" control={<Radio />} label="Indoor" />
          <FormControlLabel value="outdoor" control={<Radio />} label="Outdoor" />
        </RadioGroup>
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {cart.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem alignItems="flex-start" sx={{ alignItems: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">{item.name}</Typography>
                    <IconButton size="small" onClick={() => {
                      if (item.quantity > 1) {
                        setCart(prev => prev.map((ci, i) => i === index ? { ...ci, quantity: ci.quantity - 1 } : ci));
                      }
                    }}><RemoveIcon fontSize="small" /></IconButton>
                    <Typography variant="body2">{item.quantity}</Typography>
                    <IconButton size="small" onClick={() => setCart(prev => prev.map((ci, i) => i === index ? { ...ci, quantity: ci.quantity + 1 } : ci))}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ mt: 0.5 }}>
                    {item.modifiers?.spiceLevel && <Typography variant="caption">Spice: {item.modifiers.spiceLevel}</Typography>}
                    {item.modifiers?.extras && item.modifiers.extras.length > 0 && <Typography variant="caption"> • Extras: {item.modifiers.extras.join(', ')}</Typography>}
                    {item.specialInstructions && (
                      <Typography variant="caption" color="text.secondary" component="span">
                        <br />Note: {item.specialInstructions}
                        </Typography>
                    )}
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ ml: 2, minWidth: 60, textAlign: 'right' }}>
                    Ksh{(item.price * item.quantity).toFixed(2)}
                  </Typography>
                  <IconButton edge="end" onClick={() => handleEditItem(index)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleRemoveItem(index)}>
                    <DeleteIcon />
                  </IconButton>
            </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Total: Ksh{calculateTotal().toFixed(2)}
          </Typography>
          <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
              onClick={() => {
                handleSubmitOrder();
                setOrderStatus('sent_to_kitchen');
              }}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Submitting...' : 'Send to Kitchen'}
        </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              disabled={cart.length === 0}
              onClick={() => {
                setCart([]);
                setTableNumber('');
                setOrderStatus('cancelled');
              }}
            >
              Cancel
            </Button>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              color="info"
              fullWidth
              disabled={cart.length === 0}
              onClick={handleHoldOrder}
            >
              Hold
            </Button>
            <Button
              variant="outlined"
              color="success"
              fullWidth
              disabled={cart.length === 0}
              onClick={handlePrintBill}
            >
              Print Bill
            </Button>
          </Stack>
        </Box>
        {/* Status and Modals */}
        <ModifierDialog
          open={modifierOpen}
          item={selectedItem}
          onClose={() => {
            setModifierOpen(false);
            setSelectedItem(null);
          }}
          onSubmit={handleModifierSubmit}
        />
        <Snackbar
          open={success}
          autoHideDuration={3000}
          onClose={() => setSuccess(false)}
        >
          <Alert severity="success">
            Order sent to kitchen successfully!
          </Alert>
        </Snackbar>
        <Snackbar
          open={holdSuccess}
          autoHideDuration={3000}
          onClose={() => setHoldSuccess(false)}
        >
          <Alert severity="info">
            Order held successfully!
          </Alert>
        </Snackbar>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {/* Print Bill Dialog (placeholder) */}
        {printDialogOpen && (
          <Paper sx={{ p: 3, position: 'absolute', top: isMobile ? 0 : 100, left: '50%', transform: isMobile ? 'none' : 'translateX(-50%)', zIndex: 2000, minWidth: isMobile ? '100vw' : 320, maxWidth: isMobile ? '100vw' : 480, width: isMobile ? '100vw' : undefined, height: isMobile ? '100vh' : undefined, borderRadius: isMobile ? 0 : 2 }}>
            <div ref={printRef} className="receipt" style={{ fontFamily: 'monospace', width: 300, margin: '0 auto', background: '#fff', color: '#000', fontSize: 12, lineHeight: 1.4, border: '1px dashed #eee', boxShadow: '0 0 2px #eee', minHeight: 200 }}>
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <img src="/chatgpt.png" alt="Hotel Logo" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 2 }} />
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>Belmont Hotel</div>
                <div style={{ fontSize: 11 }}>Rodi Kopany, off Homabay-Ndhiwa Road</div>
                <div style={{ fontSize: 11 }}>Homabay Town</div>
                <div style={{ fontSize: 11 }}>Tel: 0700 494454</div>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              <div style={{ fontSize: 11, marginBottom: 2 }}>
                Date: {new Date().toLocaleString()}<br />
                Table: {tableNumber || '-'}<br />
                Location: {location.charAt(0).toUpperCase() + location.slice(1)}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              <div style={{ fontWeight: 'bold', fontSize: 13, margin: '12px 0 6px 0', textAlign: 'center', letterSpacing: 1 }}>ORDER DETAILS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>
                <span style={{ width: 40, textAlign: 'left' }}>Qty</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Item</span>
                <span style={{ width: 70, textAlign: 'right' }}>Total</span>
              </div>
              <div style={{ fontSize: 11 }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ width: 40, textAlign: 'left' }}>{item.quantity}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                    <span style={{ width: 70, textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{calculateTotal().toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                <span>VAT (16%)</span>
                <span>{(calculateTotal() * 0.16).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              <div style={{ fontWeight: 'bold', fontSize: 13, textAlign: 'right', marginBottom: 8 }}>
                Total: {(calculateTotal() * 1.16).toLocaleString()}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0', position: 'relative', height: 24 }}>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  textAlign: 'center',
                  background: '#fff',
                  fontSize: 12,
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  padding: '0 8px',
                  display: 'inline-block',
                }}>
                  Open Check
                </span>
              </div>
              <div style={{ fontSize: 12, textAlign: 'center', margin: '16px 0' }}>
                We hope you enjoyed your meal
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              <div style={{ fontSize: 10, textAlign: 'center', marginTop: 12 }}>---</div>
            </div>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePrint}
              >
                Print
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleSubmitOrder();
                  setOrderStatus('sent_to_kitchen');
                  setPrintDialogOpen(false);
                }}
                disabled={loading || cart.length === 0 || orderStatus === 'sent_to_kitchen'}
              >
                Send to Kitchen
              </Button>
              <Button variant="outlined" onClick={() => setPrintDialogOpen(false)}>Close</Button>
            </Stack>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}; 
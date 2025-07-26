import React, { useEffect, useState } from 'react';
import {
  Paper, Grid, Typography, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, IconButton, InputAdornment, Snackbar, Alert, Box, Stack, Drawer, AppBar, Toolbar, Card, CardContent, Divider, Modal, Fade, Backdrop, ToggleButtonGroup, ToggleButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel, TablePagination, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Checkbox, FormControl, FormLabel, FormGroup, FormControlLabel, Switch, Avatar, Autocomplete
} from '@mui/material';
import { Add, Search, CloudUpload, Print, TableChart, ShoppingCart, NoteAdd, Undo, Inventory2, Edit, ViewModule, Close, Delete, AddShoppingCart, FilterList, PhotoCamera, QrCode2 } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <Card variant="outlined">
        <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
                {icon}
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{value}</Typography>
                    <Typography variant="body2" color="text.secondary">{title}</Typography>
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

// Sorting helpers
type Order = 'asc' | 'desc';

function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key,
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const valA = a[orderBy] || (typeof a[orderBy] === 'number' ? 0 : '');
  const valB = b[orderBy] || (typeof b[orderBy] === 'number' ? 0 : '');
  if (valB < valA) return -1;
  if (valB > valA) return 1;
  return 0;
}

// Table Header Configuration
interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  { id: 'name', numeric: false, label: 'Name' },
  { id: 'category', numeric: false, label: 'Category' },
  { id: 'quantity', numeric: true, label: 'Quantity' },
  { id: 'unit', numeric: false, label: 'Unit' },
  { id: 'price', numeric: true, label: 'Price (Ksh)' },
  { id: 'minThreshold', numeric: true, label: 'Min Threshold' },
  { id: 'brand', numeric: false, label: 'Brand' },
];

// Helper: Generate SKU
function generateSku(name: string) {
  const base = name.replace(/\s+/g, '-').toUpperCase().slice(0, 10);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${rand}`;
}

interface InventoryForm {
  name: string;
  quantity: string;
  unit: string;
  minThreshold: string;
  category: string;
  brand: string;
  tag: string;
  manufacturerSku: string;
  customSku: string;
  barcode: string;
  description: string;
  price: string;
  defaultPrice: string;
  reorderPoint: string;
  desiredLevel: string;
  supplier: string;
  tags: string[];
  isActive: boolean;
  reason: string;
}

export const Inventory = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<InventoryForm>({
    name: '',
    quantity: '',
    unit: '',
    minThreshold: '',
    category: '',
    brand: '',
    tag: '',
    manufacturerSku: '',
    customSku: '',
    barcode: '',
    description: '',
    price: '',
    defaultPrice: '',
    reorderPoint: '',
    desiredLevel: '',
    supplier: '',
    tags: [],
    isActive: true,
    reason: '',
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [countsDialogOpen, setCountsDialogOpen] = useState(false);
  const [inventoryCounts, setInventoryCounts] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState<any>(null);
  const [countSearch, setCountSearch] = useState('');
  const [countedQuantities, setCountedQuantities] = useState<{ [key: string]: string }>({});
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [stockStatusFilter, setStockStatusFilter] = useState<string[]>([]);
  const navigate = useNavigate();
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditItems, setQuickEditItems] = useState<any[]>([]);
  const [quickEditLoading, setQuickEditLoading] = useState(false);
  const [quickEditError, setQuickEditError] = useState('');
  const [quickEditSuccess, setQuickEditSuccess] = useState('');
  const [vendorReturnOpen, setVendorReturnOpen] = useState(false);
  const [vendorReturnPOs, setVendorReturnPOs] = useState<any[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poItems, setPOItems] = useState<any[]>([]);
  const [returnQuantities, setReturnQuantities] = useState<{ [itemId: string]: number }>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');


  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/inventory', { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data);
    } catch (err: any) {
      setError('Failed to load inventory');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [token]);

  const handleOpen = (item?: any) => {
    setEditItem(item || null);
    setForm(item ? { ...item } : { name: '', quantity: '', unit: '', minThreshold: '', category: '', brand: '', tag: '', manufacturerSku: '', customSku: '', description: '', price: '', defaultPrice: '', reorderPoint: '', desiredLevel: '', reason: '' });
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (resetAfter = false) => {
    setLoading(true);
    setError('');
    try {
      // Duplicate check (client-side)
      const duplicate = items.some(item =>
        item.name.trim().toLowerCase() === form.name.trim().toLowerCase() ||
        (form.customSku && item.customSku && item.customSku.trim().toLowerCase() === form.customSku.trim().toLowerCase())
      );
      if (duplicate) {
        setError('An item with this name or SKU already exists.');
        setLoading(false);
        return;
      }
      // Auto-generate SKU if blank
      let customSku = form.customSku;
      if (!customSku) {
        customSku = generateSku(form.name);
      }
      // Auto-generate barcode if blank
      let barcode = form.barcode;
      if (!barcode) {
        barcode = generateSku(form.name);
      }
      // Prepare payload
      const payload = { ...form, customSku, barcode };
      // Save logic (existing)
      if (editItem) {
        await axios.put(`/api/inventory/${editItem.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/inventory', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSuccess('Saved successfully');
      fetchItems();
      if (resetAfter) {
        setForm({
          name: '',
          quantity: '',
          unit: '',
          minThreshold: '',
          category: '',
          brand: '',
          tag: '',
          manufacturerSku: '',
          customSku: '',
          barcode: '',
          description: '',
          price: '',
          defaultPrice: '',
          reorderPoint: '',
          desiredLevel: '',
          supplier: '',
          tags: [],
          isActive: true,
          reason: '',
        });
      } else {
        setModalOpen(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save item');
    }
    setLoading(false);
  };

  const handleOpenDeleteConfirm = (item: any) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setItemToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`/api/inventory/${itemToDelete.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Item deleted successfully');
      fetchItems();
      handleCloseDeleteConfirm();
    } catch (err: any) {
      setError('Failed to delete item');
    }
    setLoading(false);
  };


  // --- Inventory Counts Logic ---
  // Fetch inventory counts from backend
  const fetchInventoryCounts = async () => {
    try {
      const res = await axios.get('/api/inventory-counts', { headers: { Authorization: `Bearer ${token}` } });
      setInventoryCounts(res.data);
    } catch (err) {
      setError('Failed to load inventory counts');
    }
  };

  const handleOpenCountsDialog = () => {
    fetchInventoryCounts();
    setCountsDialogOpen(true);
  };

  const handleStartNewCount = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/inventory-counts', { comment: '', userId: user?.id }, { headers: { Authorization: `Bearer ${token}` } });
      setActiveCount(res.data);
      setCountedQuantities(res.data.items.reduce((acc: any, item: any) => { acc[item.id] = ''; return acc; }, {}));
      setInventoryCounts((prev: any[]) => [res.data, ...prev]);
    } catch (err) {
      setError('Failed to start new count');
    }
    setLoading(false);
  };

  const handleCountedQuantityChange = (itemId: string, quantity: string) => {
    setCountedQuantities(prev => ({ ...prev, [itemId]: quantity }));
  };

  const handleFinalizeCount = async () => {
    if (!activeCount) return;
    setLoading(true);
    setError('');
    try {
      await axios.put(`/api/inventory-counts/${activeCount.id}/finalize`, { counted: countedQuantities }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Inventory count finalized and stock levels updated.');
      setActiveCount(null);
      setCountedQuantities({});
      setCountsDialogOpen(false);
      fetchItems();
      fetchInventoryCounts();
    } catch (err) {
      setError('Failed to finalize inventory count.');
    }
    setLoading(false);
  };


  // Filtered items by search, category, and stock status
  const filteredItems = items
    .filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
    )
    .filter(item => {
      if (categoryFilter.length === 0) return true;
      return categoryFilter.includes(item.category || 'Uncategorized');
    })
    .filter(item => {
      if (stockStatusFilter.length === 0) return true;
      const quantity = Number(item.quantity) || 0;
      const minThreshold = Number(item.minThreshold) || 0;
      const isLowStock = quantity <= minThreshold;
      const isOutOfStock = quantity === 0;
      const isInStock = quantity > minThreshold;

      if (stockStatusFilter.includes('In Stock') && isInStock) return true;
      if (stockStatusFilter.includes('Low Stock') && isLowStock && !isOutOfStock) return true;
      if (stockStatusFilter.includes('Out of Stock') && isOutOfStock) return true;
      return false;
    });


  // Group items by category
  const categories = Array.from(new Set(items.map(item => item.category || 'Uncategorized')));
  const itemsByCategory = categories.map(cat => ({
    category: cat,
    items: filteredItems.filter(item => (item.category || 'Uncategorized') === cat)
  }));

  // Calculate stats for dashboard
  const totalProducts = items.length;
  const totalStockQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const lowStockItems = items.filter(item => (Number(item.quantity) || 0) <= (Number(item.minThreshold) || 0)).length;
  const categoryCount = categories.length;

  // Drawer form validation
  const isDrawerFormValid = form.name && form.quantity && form.unit && form.price;

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStockStatusFilterChange = (status: string) => {
    setStockStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setCategoryFilter([]);
    setStockStatusFilter([]);
  };

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await axios.get('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } });
        setSuppliers(res.data);
      } catch (err) {}
    };
    fetchSuppliers();
  }, [token]);

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      setForm({ ...form, tags: [...form.tags, e.currentTarget.value] });
      e.currentTarget.value = '';
    }
  };
  const handleTagDelete = (tagToDelete: string) => {
    setForm({ ...form, tags: form.tags.filter((tag: string) => tag !== tagToDelete) });
  };

  // Low stock alert helper
  const isLowStock = form.quantity && form.minThreshold && Number(form.quantity) < Number(form.minThreshold);

  const handleOpenQuickEdit = () => {
    setQuickEditItems(items.map(item => ({ ...item }))); // Deep copy
    setQuickEditOpen(true);
  };
  const handleQuickEditChange = (id: string, field: string, value: any) => {
    setQuickEditItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const handleQuickEditSave = async () => {
    setQuickEditLoading(true);
    setQuickEditError('');
    setQuickEditSuccess('');
    try {
      await axios.put('/api/inventory/bulk', { items: quickEditItems }, { headers: { Authorization: `Bearer ${token}` } });
      setQuickEditSuccess('All changes saved!');
      setQuickEditOpen(false);
      fetchItems();
    } catch (err: any) {
      setQuickEditError(err?.response?.data?.message || 'Failed to save changes');
    }
    setQuickEditLoading(false);
  };

  // Fetch POs for vendor return
  const fetchVendorReturnPOs = async () => {
    try {
      const res = await axios.get('/api/purchase-orders', { headers: { Authorization: `Bearer ${token}` } });
      setVendorReturnPOs(res.data);
    } catch {}
  };

  // Open modal and fetch POs
  const handleOpenVendorReturn = () => {
    fetchVendorReturnPOs();
    setSelectedPO(null);
    setPOItems([]);
    setReturnQuantities({});
    setReturnReason('');
    setReturnError('');
    setReturnSuccess('');
    setVendorReturnOpen(true);
  };

  // When PO selected, fetch its items
  useEffect(() => {
    if (selectedPO) {
      setPOItems(selectedPO.items || []);
      setReturnQuantities({});
    }
  }, [selectedPO]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Chip label={status} color="warning" />;
      case 'Completed':
        return <Chip label={status} color="success" />;
      case 'Cancelled':
        return <Chip label={status} color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (!user || user.role !== 'admin') return <div />;

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Stats Dashboard */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Products" value={totalProducts} icon={<Inventory2 sx={{ fontSize: 40, color: 'primary.main' }} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Stock" value={totalStockQuantity} icon={<ShoppingCart sx={{ fontSize: 40, color: 'secondary.main' }} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Low Stock" value={lowStockItems} icon={<Undo sx={{ fontSize: 40, color: 'error.main' }} />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
            <StatCard title="All Categories" value={categoryCount} icon={<ViewModule sx={{ fontSize: 40, color: 'success.main' }} />} />
        </Grid>
      </Grid>

      {/* Upper Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2}>
          <Button startIcon={<Search />} variant="outlined" color="primary" sx={{ minWidth: 120 }} onClick={() => setSearchDialogOpen(true)}>
            Item Search
          </Button>
          <Button startIcon={<Add />} variant="contained" color="primary" onClick={() => setModalOpen(true)} sx={{ minWidth: 120, fontWeight: 600 }}>New Item</Button>
            <Button startIcon={<FilterList />} variant="outlined" color="primary" onClick={() => setFilterDrawerOpen(true)}>
              Filters ({categoryFilter.length + stockStatusFilter.length})
            </Button>
          <Button startIcon={<CloudUpload />} variant="outlined" color="primary" sx={{ minWidth: 120 }}>Import Item</Button>
          <Button startIcon={<Print />} variant="outlined" color="primary" sx={{ minWidth: 120 }}>Print Label</Button>
          </Stack>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newView) => { if (newView) setViewMode(newView); }}
          >
            <ToggleButton value="grid" aria-label="grid view"><ViewModule /></ToggleButton>
            <ToggleButton value="table" aria-label="table view"><TableChart /></ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Filter Drawer */}
      <Drawer anchor="right" open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Category</FormLabel>
            <FormGroup sx={{ maxHeight: '200px', overflowY: 'auto', pr: 1 }}>
              {categories.map(category => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={categoryFilter.includes(category)}
                      onChange={() => handleCategoryFilterChange(category)}
                      name={category}
                    />
                  }
                  label={category}
                />
              ))}
            </FormGroup>
          </FormControl>
          <Divider sx={{ my: 2 }} />
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Stock Status</FormLabel>
            <FormGroup>
              {['In Stock', 'Low Stock', 'Out of Stock'].map(status => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={stockStatusFilter.includes(status)}
                      onChange={() => handleStockStatusFilterChange(status)}
                      name={status}
                    />
                  }
                  label={status}
                />
              ))}
            </FormGroup>
          </FormControl>
          <Divider sx={{ my: 2 }} />
          <Button onClick={clearFilters} fullWidth>Clear All Filters</Button>
        </Box>
      </Drawer>

      {/* New Item Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={modalOpen}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '98vw', sm: 700, md: 900 },
            maxHeight: '96vh',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Sticky Top Bar */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">New Item</Typography>
              <Box>
                <Button onClick={() => handleSave(false)} variant="contained" color="primary" sx={{ mr: 2 }} disabled={!isDrawerFormValid || loading}>Save Changes</Button>
                <Button onClick={() => handleSave(true)} variant="outlined" color="primary" disabled={!isDrawerFormValid || loading}>Save & Start New</Button>
                <IconButton onClick={() => setModalOpen(false)} sx={{ ml: 2 }}><Close /></IconButton>
              </Box>
            </Box>
            <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
              <Grid container spacing={3}>
                {/* Left: Barcode, Active, Tags */}
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Stack spacing={2} alignItems="center">
                      <TextField
                        label="Barcode / QR Code"
                        name="barcode"
                        value={form.barcode}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        InputProps={{ startAdornment: <InputAdornment position="start"><QrCode2 /></InputAdornment> }}
                        helperText={!form.barcode ? 'Auto-generated if left blank' : ''}
                      />
                      <FormControlLabel
                        control={<Switch checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />}
                        label="Active"
                      />
                    </Stack>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {form.tags.map((tag: string) => (
                        <Chip key={tag} label={tag} onDelete={() => handleTagDelete(tag)} />
                      ))}
                    </Stack>
                    <TextField
                      fullWidth
                      margin="normal"
                      placeholder="Add tag and press Enter"
                      onKeyDown={handleTagAdd}
                    />
                  </Paper>
                  {/* Placeholder for Inventory History */}
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle2">Inventory History (coming soon)</Typography>
                    <Typography color="text.secondary" fontSize={13}>All stock changes will be shown here.</Typography>
                  </Paper>
                </Grid>
                {/* Middle: Main Details */}
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
              <TextField
                fullWidth
                margin="normal"
                      label="Item Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      error={!form.name}
                      helperText={!form.name ? 'Required' : ''}
                    />
              <TextField
                fullWidth
                margin="normal"
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
                    <Autocomplete
                      options={suppliers}
                      getOptionLabel={option => option.name}
                      value={suppliers.find(s => s.id === form.supplier) || null}
                      onChange={(_, newValue) => setForm({ ...form, supplier: newValue ? newValue.id : '' })}
                      renderInput={params => <TextField {...params} label="Supplier" margin="normal" />}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Brand"
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                    />
                    {/* Placeholder for custom fields/attributes */}
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Attributes (coming soon)</Typography>
                    <Typography color="text.secondary" fontSize={13}>Add color, size, or other custom attributes here.</Typography>
                  </Paper>
                </Grid>
                {/* Right: Stock & Pricing */}
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Initial Stock Qty"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleChange}
                      error={!form.quantity}
                      helperText={!form.quantity ? 'Required' : isLowStock ? 'Warning: Below minimum threshold!' : ''}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Unit (e.g. pcs, kg, L)"
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      error={!form.unit}
                      helperText={!form.unit ? 'Required' : ''}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Default Price (Ksh)"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      error={!form.price}
                      helperText={!form.price ? 'Required' : ''}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="SKU (auto if blank)"
                      name="customSku"
                      value={form.customSku}
                      onChange={handleChange}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Min Threshold"
                      name="minThreshold"
                      value={form.minThreshold}
                      onChange={handleChange}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Reorder Point"
                      name="reorderPoint"
                      value={form.reorderPoint}
                      onChange={handleChange}
                    />
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Desired Inventory Level"
                      name="desiredLevel"
                      value={form.desiredLevel}
                      onChange={handleChange}
                    />
                    {/* Stock adjustment reason */}
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Stock Adjustment Reason"
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      helperText="E.g. New stock, correction, shrinkage, etc."
                    />
                    {/* Placeholder for multi-location */}
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Location (coming soon)</Typography>
                    <Typography color="text.secondary" fontSize={13}>Specify warehouse, shelf, or store here.</Typography>
                  </Paper>
                  {/* Placeholder for audit trail */}
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle2">Audit Trail (coming soon)</Typography>
                    <Typography color="text.secondary" fontSize={13}>Created by: (user) | Last edited: (date)</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Search Dialog */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Item Search</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="normal"
            label="Search items or categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography component="span">
            Are you sure you want to delete item &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Counts Dialog */}
      <Dialog open={countsDialogOpen} onClose={() => setCountsDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Inventory Counts</DialogTitle>
        <DialogContent>
          {!activeCount ? (
            <>
              <Button startIcon={<AddShoppingCart />} variant="contained" onClick={handleStartNewCount} sx={{ mb: 2 }}>
                Start New Inventory Count
              </Button>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Past Counts</Typography>
              <List>
                {inventoryCounts.map(count => (
                  <ListItem key={count.id} button onClick={() => setActiveCount(count)}>
                    <ListItemText
                      primary={<Typography component="span">{`Count #${count.id.slice(-6)}`}</Typography>}
                      secondary={<Typography component="span">{new Date(count.date).toLocaleDateString()}</Typography>}
                    />
                    <ListItemSecondaryAction>
                      <Chip label={count.status} color={count.status === 'Completed' ? 'success' : 'warning'} />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Counting: {activeCount.id.slice(-6)} ({new Date(activeCount.date).toLocaleDateString()})
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                placeholder="Search items in this count..."
                value={countSearch}
                onChange={e => setCountSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
              <TableContainer component={Paper} sx={{ maxHeight: 400, mt: 2 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Expected Qty</TableCell>
                      <TableCell align="right">Counted Qty</TableCell>
                      <TableCell align="right">Variance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeCount.items
                      .filter((item: any) => item.name.toLowerCase().includes(countSearch.toLowerCase()))
                      .map((item: any) => {
                        const expected = Number(item.quantity) || 0;
                        const countedStr = countedQuantities[item.id];
                        const counted = countedStr !== undefined && countedStr !== '' ? Number(countedStr) : null;
                        const variance = counted !== null ? counted - expected : null;

                        let varianceColor = 'text.secondary';
                        if (variance !== null) {
                          if (variance > 0) varianceColor = 'success.main';
                          else if (variance < 0) varianceColor = 'error.main';
                        }
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell align="right">{expected}</TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                variant="outlined"
                                value={countedQuantities[item.id] ?? ''}
                                onChange={(e) => handleCountedQuantityChange(item.id, e.target.value)}
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              {variance !== null ? (
                                <Typography component="span" sx={{ color: varianceColor, fontWeight: 'medium' }}>
                                  {variance > 0 ? `+${variance}` : variance}
                                </Typography>
                              ) : (
                                <Typography component="span" sx={{ color: 'text.disabled' }}>–</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCountsDialogOpen(false); setActiveCount(null); }}>Close</Button>
          {activeCount && (
            <>
              <Button onClick={() => setActiveCount(null)}>Back to List</Button>
              <Button onClick={handleFinalizeCount} variant="contained" color="primary" disabled={loading}>
                Finalize & Adjust Inventory
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Quick Edit Modal */}
      <Dialog open={quickEditOpen} onClose={() => setQuickEditOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Quick Edit Items</DialogTitle>
        <DialogContent>
          {quickEditError && <Alert severity="error" sx={{ mb: 2 }}>{quickEditError}</Alert>}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Min Threshold</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quickEditItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={e => handleQuickEditChange(item.id, 'quantity', e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.price}
                        onChange={e => handleQuickEditChange(item.id, 'price', e.target.value)}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.minThreshold}
                        onChange={e => handleQuickEditChange(item.id, 'minThreshold', e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickEditOpen(false)}>Cancel</Button>
          <Button onClick={handleQuickEditSave} variant="contained" color="success" disabled={quickEditLoading}>
            {quickEditLoading ? 'Saving...' : 'Save All'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!quickEditSuccess} autoHideDuration={4000} onClose={() => setQuickEditSuccess('')}>
        <Alert onClose={() => setQuickEditSuccess('')} severity="success" sx={{ width: '100%' }}>
          {quickEditSuccess}
        </Alert>
      </Snackbar>

      {/* Action Sections */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Purchase Order</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button startIcon={<ShoppingCart />} variant="contained" color="secondary" onClick={() => navigate('/purchase-order')}>Purchase Order</Button>
              <Button startIcon={<NoteAdd />} variant="outlined" color="secondary" onClick={() => navigate('/purchase-order/new')}>New Order</Button>
              <Button startIcon={<Undo />} variant="outlined" color="secondary" onClick={handleOpenVendorReturn}>Vendor Return</Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mt: 0, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Inventory Maintenance</Typography>
        <Stack direction="row" spacing={2}>
              <Button startIcon={<Inventory2 />} variant="contained" color="success" sx={{ minWidth: 180 }} onClick={handleOpenCountsDialog}>
                Inventory Counts
              </Button>
              <Button startIcon={<Edit />} variant="outlined" color="success" sx={{ minWidth: 180 }} onClick={handleOpenQuickEdit}>
                Quick Edit Items
              </Button>
        </Stack>
      </Paper>
        </Grid>
      </Grid>

      {/* Inventory List by Category */}
      {viewMode === 'grid' ? (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {itemsByCategory.map(({ category, items }) => (
          <Grid item xs={12} md={6} lg={4} key={category}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{category}</Typography>
              {items.length === 0 ? (
                <Typography color="text.secondary">No items in this category.</Typography>
              ) : (
                items.map(item => (
                  <Box key={item.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box>
                      <Typography variant="body1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.quantity} {item.unit} (Min: {item.minThreshold})
                      </Typography>
                    </Box>
                    {user?.role === 'admin' && (
                      <Stack direction="row" spacing={1}>
                        <IconButton onClick={() => handleOpen(item)}><Edit /></IconButton>
                          <IconButton onClick={() => handleOpenDeleteConfirm(item)}><Delete /></IconButton>
                      </Stack>
                    )}
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
      ) : (
        <Paper sx={{ mb: 3, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? 'right' : 'left'}
                      sortDirection={orderBy === headCell.id ? order : false}
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stableSort(filteredItems, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(item => (
                  <TableRow hover key={item.id}>
                    <TableCell component="th" scope="row">{item.name}</TableCell>
                    <TableCell>{item.category || 'N/A'}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell align="right">{item.price ? `${item.price}` : 'N/A'}</TableCell>
                    <TableCell align="right">{item.minThreshold}</TableCell>
                    <TableCell>{item.brand || 'N/A'}</TableCell>
                    <TableCell>
                      {user?.role === 'admin' && (
                        <>
                          <IconButton onClick={() => handleOpen(item)} size="small"><Edit /></IconButton>
                          <IconButton onClick={() => handleOpenDeleteConfirm(item)} size="small"><Delete /></IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredItems.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Vendor Return Modal */}
      <Dialog open={vendorReturnOpen} onClose={() => setVendorReturnOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vendor Return</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Step 1: Select PO */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Purchase Order</Typography>
              <Autocomplete
                options={vendorReturnPOs}
                getOptionLabel={po => `PO #${po.id.slice(-6)} - ${po.supplier?.name || ''}`}
                value={selectedPO}
                onChange={(_, newValue) => setSelectedPO(newValue)}
                renderInput={params => <TextField {...params} label="Purchase Order" margin="normal" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ maxWidth: 400 }}
              />
              {selectedPO && (
                <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography><b>Supplier:</b> {selectedPO.supplier?.name}</Typography>
                      <Typography><b>Date:</b> {new Date(selectedPO.orderDate).toLocaleDateString()}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography><b>Status:</b> {getStatusChip(selectedPO.status)}</Typography>
                      <Typography><b>Total:</b> Ksh {Number(selectedPO.total).toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
            {/* Step 2: Select Items */}
            {selectedPO && poItems.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Items to Return</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Ordered Qty</TableCell>
                        <TableCell align="right">Return Qty</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell align="right">Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {poItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item?.name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              value={returnQuantities[item.id] ?? ''}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setReturnQuantities({ ...returnQuantities, [item.id]: val });
                              }}
                              sx={{ width: 80 }}
                              inputProps={{ min: 0, max: item.quantity }}
                              error={returnQuantities[item.id] > item.quantity}
                              helperText={returnQuantities[item.id] > item.quantity ? 'Exceeds ordered' : ''}
                            />
                          </TableCell>
                          <TableCell>{item.item?.unit || ''}</TableCell>
                          <TableCell align="right">{item.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            {/* Step 3: Reason and Summary */}
            {selectedPO && poItems.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Return Details</Typography>
                <TextField
                  label="Reason (optional)"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}><b>Summary:</b></Typography>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {poItems.filter((item: any) => (returnQuantities[item.id] ?? 0) > 0).map((item: any) => (
                      <li key={item.id}>
                        {item.item?.name}: {returnQuantities[item.id]} {item.item?.unit || ''}
                      </li>
                    ))}
                  </ul>
                  <Typography variant="body2" color="text.secondary">
                    Total items to return: {poItems.reduce((sum: number, item: any) => sum + (returnQuantities[item.id] || 0), 0)}
                  </Typography>
                </Paper>
              </Box>
            )}
            {returnError && <Alert severity="error">{returnError}</Alert>}
            {returnSuccess && <Alert severity="success">{returnSuccess}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorReturnOpen(false)} disabled={returnLoading}>Cancel</Button>
          <Button variant="contained" color="warning" disabled={returnLoading || !selectedPO || !poItems.some((item: any) => (returnQuantities[item.id] ?? 0) > 0)}
            onClick={async () => {
              setReturnLoading(true);
              setReturnError('');
              setReturnSuccess('');
              const items = poItems
                .filter((item: any) => (returnQuantities[item.id] ?? 0) > 0)
                .map((item: any) => ({ itemName: item.item?.name, quantity: returnQuantities[item.id] }));
              if (!selectedPO) {
                setReturnError('Select a purchase order');
                setReturnLoading(false);
                return;
              }
              if (items.length === 0) {
                setReturnError('Select at least one item to return');
                setReturnLoading(false);
                return;
              }
              try {
                await axios.post(`/api/purchase-orders/${selectedPO.id}/vendor-return`, { items, reason: returnReason }, { headers: { Authorization: `Bearer ${token}` } });
                setReturnSuccess('Vendor return submitted successfully!');
                setVendorReturnOpen(false);
              } catch (e: any) {
                setReturnError(e?.response?.data?.message || 'Failed to process return');
              }
              setReturnLoading(false);
            }}>
            Submit Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lower Section: Inventory Maintenance */}
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}><Alert severity="success">{success}</Alert></Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}><Alert severity="error">{error}</Alert></Snackbar>
    </Box>
  );
}; 
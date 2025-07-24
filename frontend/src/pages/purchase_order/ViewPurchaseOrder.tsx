import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Divider, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from '@mui/material';
import { Print, Edit, Mail, CheckCircle, Cancel, Send, Undo } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const getStatusChip = (status: string) => {
    switch (status) {
      case 'Submitted': return <Chip label={status} color="primary" />;
      case 'Completed': return <Chip label={status} color="success" />;
      case 'Draft': return <Chip label={status} color="default" />;
      default: return <Chip label={status} />;
    }
};

export const ViewPurchaseOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<{ [itemId: string]: number }>({});
  const [attachments, setAttachments] = useState<File[]>([]);

  // Vendor Return state
  const [vendorReturnOpen, setVendorReturnOpen] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<{ [itemId: string]: number }>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [vendorReturns, setVendorReturns] = useState<any[]>([]);

  const statusOptions = [
    'Draft',
    'Pending Approval',
    'Approved',
    'Rejected',
    'Submitted',
    'Completed',
    'Cancelled',
  ];

  const fetchPO = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPo(res.data);
    } catch (err) {
      setError('Failed to fetch purchase order');
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor returns
  const fetchVendorReturns = async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/purchase-orders/${id}/vendor-returns`, { headers: { Authorization: `Bearer ${token}` } });
      setVendorReturns(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchPO();
  }, [id, token]);

  useEffect(() => { fetchVendorReturns(); }, [id, token, vendorReturnOpen]);

  const handleStatusUpdate = async (status: string) => {
    try {
      await axios.patch(`/api/purchase-orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPO(); // Refetch to show updated status
    } catch (err) {
      setError('Failed to update status');
    }
    if (status === 'Cancelled') {
      setConfirmCancelOpen(false);
    }
  };

  // Placeholder: Approve/Reject (UI only, backend TODO)
  const handleApprove = async () => {
    try {
      await axios.patch(`/api/purchase-orders/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPO();
    } catch (err) {
      setError('Failed to approve purchase order');
    }
  };
  const handleReject = async () => {
    try {
      await axios.patch(`/api/purchase-orders/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchPO();
    } catch (err) {
      setError('Failed to reject purchase order');
    }
  };

  // Partial receiving (now functional)
  const handleReceive = async () => {
    try {
      await axios.post(`/api/purchase-orders/${id}/receive`, { received: receivedQuantities }, { headers: { Authorization: `Bearer ${token}` } });
      setReceiveModalOpen(false);
      fetchPO();
    } catch (err) {
      setError('Failed to record received items');
    }
  };

  // Placeholder: Attachments (UI only, backend TODO)
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments([...attachments, ...Array.from(e.target.files)]);
  };
  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleOpenReceive = () => {
    const initial: { [itemId: string]: number } = {};
    po.items.forEach((item: any) => { initial[item.id] = 0; });
    setReceivedQuantities(initial);
    setReceiveModalOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!po) {
    return <Typography>Purchase Order not found.</Typography>;
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Purchase Order #{po.id}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {/* Approval workflow actions */}
          {po.status === 'Draft' && (
            <Button variant="contained" color="primary" startIcon={<Send />} onClick={() => handleStatusUpdate('Pending Approval')}>
              Submit for Approval
            </Button>
          )}
          {po.status === 'Pending Approval' && (
            <>
              <Button variant="contained" color="success" onClick={handleApprove}>Approve</Button>
              <Button variant="outlined" color="error" onClick={handleReject}>Reject</Button>
            </>
          )}
          {po.status === 'Approved' && (
            <Button variant="contained" color="secondary" onClick={() => handleStatusUpdate('Submitted')}>
              Mark as Ordered
            </Button>
          )}
          {/* Partial receiving */}
          {(po.status === 'Submitted' || po.status === 'Approved') && (
            <Button variant="contained" color="success" onClick={handleOpenReceive}>
              Receive Items
            </Button>
          )}
          {(po.status === 'Completed' || po.status === 'Submitted') && (
            <Button variant="outlined" color="warning" startIcon={<Undo />} onClick={() => setVendorReturnOpen(true)}>
              Vendor Return
            </Button>
          )}
          {/* Print/Email */}
          <Button variant="outlined" startIcon={<Print />}>Print</Button>
          <Button variant="outlined" startIcon={<Mail />}>Email Supplier</Button>
        </Stack>
      </Stack>

      {/* Attachments section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2">Attachments (coming soon)</Typography>
        <Button component="label" variant="outlined" size="small" sx={{ mb: 1 }}>
          Upload File
          <input type="file" hidden multiple onChange={handleAttachmentUpload} />
        </Button>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {attachments.map((file, idx) => (
            <Chip key={file.name + idx} label={file.name} onDelete={() => handleRemoveAttachment(idx)} />
          ))}
        </Stack>
        <Typography color="text.secondary" fontSize={13}>Attach supplier quotes, invoices, or delivery notes here.</Typography>
      </Paper>

      {/* Audit trail/history placeholder */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2">Audit Trail (coming soon)</Typography>
        <Typography color="text.secondary" fontSize={13}>All status changes, comments, and receipts will be shown here.</Typography>
      </Paper>

      {/* Receive Items Modal */}
      <Dialog open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)}>
        <DialogTitle>Receive Items (Partial Receiving)</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter the quantity received for each item:</Typography>
          {po.items.map((item: any) => (
            <Stack direction="row" alignItems="center" spacing={2} key={item.id} sx={{ mb: 1 }}>
              <Typography sx={{ minWidth: 120 }}>{item.item?.name}</Typography>
              <TextField
                type="number"
                size="small"
                value={receivedQuantities[item.id] ?? 0}
                onChange={e => setReceivedQuantities({ ...receivedQuantities, [item.id]: Number(e.target.value) })}
                sx={{ width: 100 }}
                inputProps={{ min: 0, max: item.quantity }}
              />
              <Typography color="text.secondary">/ {item.quantity} ordered</Typography>
            </Stack>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiveModalOpen(false)}>Cancel</Button>
          <Button onClick={handleReceive} variant="contained" color="success">Confirm Receipt</Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Return Modal */}
      <Dialog open={vendorReturnOpen} onClose={() => setVendorReturnOpen(false)}>
        <DialogTitle>Vendor Return</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Select items and quantities to return:</Typography>
          {po.items.map((item: any) => (
            <Stack direction="row" alignItems="center" spacing={2} key={item.id} sx={{ mb: 1 }}>
              <Typography sx={{ minWidth: 120 }}>{item.item?.name}</Typography>
              <TextField
                type="number"
                size="small"
                value={returnQuantities[item.id] ?? 0}
                onChange={e => setReturnQuantities({ ...returnQuantities, [item.id]: Number(e.target.value) })}
                sx={{ width: 100 }}
                inputProps={{ min: 0, max: item.quantity }}
              />
              <Typography color="text.secondary">/ {item.quantity} ordered</Typography>
            </Stack>
          ))}
          <TextField
            label="Reason (optional)"
            value={returnReason}
            onChange={e => setReturnReason(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          {returnError && <Typography color="error">{returnError}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorReturnOpen(false)} disabled={returnLoading}>Cancel</Button>
          <Button variant="contained" color="warning" disabled={returnLoading}
            onClick={async () => {
              setReturnLoading(true);
              setReturnError('');
              const items = po.items
                .filter((item: any) => (returnQuantities[item.id] ?? 0) > 0)
                .map((item: any) => ({ itemName: item.item?.name, quantity: returnQuantities[item.id] }));
              if (items.length === 0) {
                setReturnError('Select at least one item to return');
                setReturnLoading(false);
                return;
              }
              try {
                await axios.post(`/api/purchase-orders/${id}/vendor-return`, { items, reason: returnReason }, { headers: { Authorization: `Bearer ${token}` } });
                setVendorReturnOpen(false);
                setReturnQuantities({});
                setReturnReason('');
                fetchPO();
                fetchVendorReturns();
              } catch (e: any) {
                setReturnError(e?.response?.data?.message || 'Failed to process return');
              }
              setReturnLoading(false);
            }}>
            Submit Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vendor Return History */}
      {vendorReturns.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2">Vendor Return History</Typography>
          {vendorReturns.map((vr, idx) => (
            <Box key={vr.id} sx={{ mb: 2 }}>
              <Typography fontWeight={600}>Return #{idx + 1} - {new Date(vr.createdAt).toLocaleString()}</Typography>
              <Typography color="text.secondary">Reason: {vr.reason || 'N/A'}</Typography>
              <Table size="small" sx={{ mt: 1, mb: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vr.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </Paper>
      )}

      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Grid container justifyContent="space-between" spacing={3} sx={{ mb: 3 }}>
          <Grid item>
            <Typography variant="h6">Supplier</Typography>
            <Typography>{po.supplier?.name}</Typography>
            <Typography>{po.supplier?.address}</Typography>
            <Typography>{po.supplier?.email}</Typography>
          </Grid>
          <Grid item textAlign="right">
            <Typography variant="h6">Details</Typography>
            <Typography><strong>Date:</strong> {new Date(po.orderDate).toLocaleDateString()}</Typography>
            <Typography><strong>Status:</strong> {getStatusChip(po.status)}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price (Ksh)</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {po.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.item?.name}</TableCell>
                  <TableCell>{item.item?.customSku}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{Number(item.price).toFixed(2)}</TableCell>
                  <TableCell align="right">{Number(item.total).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />

        <Grid container justifyContent="flex-end">
          <Grid item xs={12} md={4}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Subtotal</Typography>
                <Typography>Ksh {Number(po.subtotal).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography>Tax (16%)</Typography>
                <Typography>Ksh {Number(po.tax).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 'bold', mt: 1 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">Ksh {Number(po.total).toFixed(2)}</Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        
        {po.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>Notes</Typography>
            <Typography>{po.notes}</Typography>
          </>
        )}
      </Paper>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)}>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to cancel this purchase order? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancelOpen(false)}>Keep Order</Button>
          <Button onClick={() => handleStatusUpdate('Cancelled')} color="error">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 
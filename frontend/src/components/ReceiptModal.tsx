import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const ReceiptModal = ({ open, orderId, onClose, mode = 'open' }: { open: boolean, orderId?: number, onClose: () => void, mode?: 'open' | 'closed' }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      axios.get(`/api/orders/${orderId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setData(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open, orderId, token]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '', 'width=600,height=800');
    if (win) {
      win.document.write('<html><head><title>Receipt</title></head><body>' + printContents + '</body></html>');
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  };

  const calcSubtotal = (items: any[]) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const TAX_RATE = 0.16;
  const formatKsh = (amount: number) => `Ksh ${(amount).toLocaleString()}`;
  const formatAmount = (amount: number) => amount.toLocaleString();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Receipt</DialogTitle>
      <DialogContent>
        {/* Print-specific styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #thermal-receipt, #thermal-receipt * { visibility: visible; }
            #thermal-receipt { position: absolute; left: 0; top: 0; width: 300px !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          }
        `}</style>
        <div
          id="thermal-receipt"
          ref={printRef}
          style={{
            padding: '24px 0 24px 0',
            fontFamily: 'monospace',
            width: 300,
            margin: '0 auto',
            background: '#fff',
            color: '#000',
            fontSize: 12,
            lineHeight: 1.4,
            border: '1px dashed #eee',
            boxShadow: '0 0 2px #eee',
            minHeight: 200,
          }}
        >
          {loading && <Typography style={{ fontSize: 13 }}>Loading...</Typography>}
          {data && (
            <>
              <div style={{ textAlign: 'center', margin: '16px 0' }}>
                <img src="/chatgpt.png" alt="Hotel Logo" style={{ width: 48, height: 48, objectFit: 'contain', marginBottom: 2 }} />
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{data.hotel.name}</div>
                <div style={{ fontSize: 11 }}>{data.hotel.address}</div>
                <div style={{ fontSize: 11 }}>Tel: {data.hotel.phone}</div>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              <div style={{ fontSize: 11, marginBottom: 2 }}>
                Date: {new Date(data.order.createdAt).toLocaleString()}<br />
                Table: {data.order.tableNumber || '-'}<br />
                {data.order.room && <>Room: {data.order.room}<br /></>}
                {data.order.customerName && <>Customer: {data.order.customerName}<br /></>}
                Served by: {data.order.staff}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              {/* Order Details Section Header */}
              <div style={{ fontWeight: 'bold', fontSize: 13, margin: '12px 0 6px 0', textAlign: 'center', letterSpacing: 1 }}>ORDER DETAILS</div>
              {/* Table Headers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>
                <span style={{ width: 40, textAlign: 'left' }}>Qty</span>
                <span style={{ flex: 1, textAlign: 'left' }}>Item</span>
                <span style={{ width: 70, textAlign: 'right' }}>Total</span>
              </div>
              {/* Items */}
              <div style={{ fontSize: 11 }}>
                {data.order.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ width: 40, textAlign: 'left' }}>{item.quantity}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                    <span style={{ width: 70, textAlign: 'right' }}>{formatAmount(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              {/* Subtotal, VAT, Total */}
              <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatAmount(calcSubtotal(data.order.items))}</span>
              </div>
              {mode === 'closed' && <>
                <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                  <span>VAT (16%)</span>
                  <span>{formatAmount(calcSubtotal(data.order.items) * TAX_RATE)}</span>
                </div>
              </>}
              {mode === 'closed' && data.payments && data.payments.length > 0 && (
                <div style={{ fontSize: 11, margin: '4px 0' }}>
                  Payment Method: {data.payments[0].method}
                </div>
              )}
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              {/* Check Status Centered after dotted line */}
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
                  {mode === 'open' ? 'open check' : 'check closed'}
                </span>
              </div>
              {/* Thank you message */}
              <div style={{ fontSize: 12, textAlign: 'center', margin: '16px 0' }}>
                {mode === 'open' ? 'We hope you enjoyed your meal' : 'Thank you for dining with us!'}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
              {/* Footer */}
              <div style={{ fontSize: 10, textAlign: 'center', marginTop: 12 }}>---</div>
            </>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handlePrint} variant="contained" disabled={loading}>Print</Button>
      </DialogActions>
    </Dialog>
  );
}; 
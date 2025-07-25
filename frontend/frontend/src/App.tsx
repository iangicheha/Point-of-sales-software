import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Order } from './pages/Order';
import { OrderHistory } from './pages/OrderHistory';
import { Inventory } from './pages/Inventory';
import { Payments } from './pages/Payments';
import { Users } from './pages/Users';
import { Rooms } from './pages/Rooms';
import { Menu } from './pages/Menu';
import { Reports } from './pages/Reports';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { PaymentHistory } from './pages/PaymentHistory';
import { PurchaseOrder } from './pages/purchase_order/PurchaseOrder';
import { NewPurchaseOrder } from './pages/purchase_order/NewPurchaseOrder';
import { ViewPurchaseOrder } from './pages/purchase_order/ViewPurchaseOrder';
import { EditPurchaseOrder } from './pages/purchase_order/EditPurchaseOrder';

const theme = createTheme();

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="*"
              element={
                <PrivateRoute>
                  <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
                    {/* Fixed Sidebar */}
                    <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1200 }}>
                      <Sidebar />
                    </div>
                    {/* Main area with fixed Topbar and scrollable content */}
                    <div style={{
                      marginLeft: 220, // Sidebar width
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '100vh',
                      position: 'relative',
                    }}>
                      {/* Fixed Topbar */}
                      <div style={{ position: 'fixed', top: 0, left: 220, right: 0, zIndex: 1100, width: 'calc(100vw - 220px)' }}>
                        <Topbar />
                      </div>
                      {/* Scrollable content area */}
                      <div style={{
                        flex: 1,
                        marginTop: 64, // Topbar height
                        padding: 32,
                        overflowY: 'auto',
                        height: 'calc(100vh - 64px)',
                        background: '#f7f9fc',
                      }}>
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/order" element={<Order />} />
                          <Route path="/order-history" element={<OrderHistory />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/purchase-order" element={<PurchaseOrder />} />
                          <Route path="/purchase-order/new" element={<NewPurchaseOrder />} />
                          <Route path="/purchase-order/:id" element={<ViewPurchaseOrder />} />
                          <Route path="/purchase-order/:id/edit" element={<EditPurchaseOrder />} />
                          <Route path="/payments" element={<Payments />} />
                          <Route path="/users" element={<Users />} />
                          <Route path="/rooms" element={<Rooms />} />
                          <Route path="/menu" element={<Menu />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/payment-history" element={<PaymentHistory />} />
                          <Route path="*" element={<Navigate to="/dashboard" />} />
                        </Routes>
                      </div>
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 
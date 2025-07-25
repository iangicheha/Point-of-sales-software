import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { List, ListItem, ListItemText, Divider, Button } from '@mui/material';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/order', label: 'Order' },
  { to: '/order-history', label: 'Order History' },
  { to: '/inventory', label: 'Inventory', roles: ['admin'] },
  { to: '/payments', label: 'Payments', roles: ['admin', 'cashier'] },
  { to: '/payment-history', label: 'Payment History', roles: ['admin', 'cashier'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
  { to: '/rooms', label: 'Rooms', roles: ['admin', 'frontdesk'] },
  { to: '/menu', label: 'Menu', roles: ['admin'] },
  { to: '/reports', label: 'Reports', roles: ['admin'] },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div style={{
      width: 220,
      background: '#1976d2',
      borderRight: '1px solid #e0e0e0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      left: 0,
      zIndex: 1000,
      overflow: 'unset',
    }}>
      <img src="/chatgpt.png" alt="ChatGPT" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 16, margin: '32px 0 24px 0', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }} />
      <List style={{ width: '100%' }}>
        {navLinks.filter(link => !link.roles || link.roles.includes(user.role)).map(link => (
          <ListItem
            button
            key={link.to}
            component={Link}
            to={link.to}
            selected={location.pathname === link.to}
            style={{ color: '#fff' }}
          >
            <ListItemText primary={link.label} primaryTypographyProps={{ style: { color: '#fff' } }} />
          </ListItem>
        ))}
      </List>
      <Divider style={{ margin: 'auto 0 8px 0', width: '80%', background: 'rgba(255,255,255,0.3)' }} />
    </div>
  );
}; 
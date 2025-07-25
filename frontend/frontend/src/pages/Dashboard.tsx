import React, { useEffect, useRef, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, List, ListItem, ListItemText, Avatar, Chip, Divider, useTheme } from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StarIcon from '@mui/icons-material/Star';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

dayjs.extend(utc);
dayjs.extend(timezone);

// Mock data
// const roomsAvailable = 16; // total available rooms
// const roomsOccupied = 14;
const totalSalesToday = 24500;
const topSellers = [
  { name: 'Fish', sold: 32 },
  { name: 'Chicken', sold: 28 },
  { name: 'Soda', sold: 25 },
  { name: 'Fries', sold: 22 },
  { name: 'Coffee', sold: 18 },
];
// Notifications state
interface Notification {
  id: number;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const conferenceAvailable = true;

interface OrderItem {
  price: number;
  quantity: number;
  menuItem?: {
    name: string;
  };
}

interface Payment {
  status: string;
  method: string;
  amount: number;
  paidAt?: string;
  createdAt?: string;
}

interface Order {
  id: number;
  tableNumber: string | null;
  status: string;
  items?: OrderItem[];
  payments?: Payment[];
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    let start: number | null = null;
    function animate(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else setValue(target);
    }
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

export const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleToggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await axios.get('/api/orders', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        setOrders(res.data);
      } catch (err) {
        setOrders([]);
      }
      setLoadingOrders(false);
    };

    const fetchPayments = async () => {
      setLoadingPayments(true);
      try {
        const res = await axios.get('/api/payments', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        setPayments(res.data);
      } catch (err) {
        setPayments([]);
      }
      setLoadingPayments(false);
    };

    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await axios.get('/api/rooms', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        setRooms(res.data);
      } catch (err) {
        setRooms([]);
      }
      setLoadingRooms(false);
    };

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        setNotifications([]);
      }
    };
    fetchOrders();
    fetchPayments();
    fetchRooms();
    fetchNotifications();
  }, [token]);

  // DEBUG: Log payment timestamps and interpreted dates
  payments.forEach((p) => {
    const paidAt = p.paidAt || p.createdAt;
    if (paidAt) {
      const asUTC = dayjs(paidAt).utc().format();
      const asLocal = dayjs(paidAt).format('YYYY-MM-DD HH:mm:ss');
      const asNairobi = dayjs(paidAt).tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss');
      console.log(`Payment: amount=${p.amount}, status=${p.status}, paidAt(raw)=${paidAt}, UTC=${asUTC}, Local=${asLocal}, Nairobi=${asNairobi}`);
    }
  });

  // Split orders based on payment status
  const ongoingOrdersList = orders.filter(
    (order) => !order.payments?.some((p: Payment) => p.status === 'completed')
  );

  const completeOrdersList = orders.filter(
    (order) => order.payments?.some((p: Payment) => p.status === 'completed')
  );

  // Group complete orders by day
  const completeOrdersByDay: Record<string, Order[]> = {};
  completeOrdersList.forEach(order => {
    // Find the completed payment for this order
    const completedPayment = order.payments?.find((p: Payment) => p.status === 'completed');
    if (!completedPayment) return;
    // Use paidAt if available, otherwise fallback to createdAt, and group by local date
    const date = dayjs(completedPayment.paidAt || completedPayment.createdAt).format('YYYY-MM-DD');
    if (!completeOrdersByDay[date]) completeOrdersByDay[date] = [];
    completeOrdersByDay[date].push(order);
  });

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(completeOrdersByDay).sort((a, b) => dayjs(b).unix() - dayjs(a).unix());

  // Calculate daily stats
  const dailyStats = sortedDates.map((date, idx) => {
    const orders = completeOrdersByDay[date];
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => {
      const payment = order.payments?.find((p: Payment) => p.status === 'completed');
      return sum + (payment ? Number(payment.amount) : 0);
    }, 0);
    // Previous day
    let percentChange: number | null = null;
    if (idx < sortedDates.length - 1) {
      const prevOrders = completeOrdersByDay[sortedDates[idx + 1]];
      const prevTotalSales = prevOrders.reduce((sum, order) => {
        const payment = order.payments?.find((p: Payment) => p.status === 'completed');
        return sum + (payment ? Number(payment.amount) : 0);
      }, 0);
      if (prevTotalSales > 0) {
        percentChange = ((totalSales - prevTotalSales) / prevTotalSales) * 100;
      } else if (totalSales > 0) {
        percentChange = 100;
      } else {
        percentChange = 0;
      }
    }
    return { date, totalOrders, totalSales, percentChange };
  });

  // Calculate dynamic room stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room: any) => room.status === 'occupied').length;
  const availableRooms = rooms.filter((room: any) => room.status === 'vacant').length;

  // Animated numbers
  const animatedRoomsAvailable = useCountUp(availableRooms);
  const animatedRoomsOccupied = useCountUp(occupiedRooms);
  const animatedOngoingOrders = useCountUp(ongoingOrdersList.length);

  // Helper to get the payment date (paidAt or createdAt)
  const getPaymentDate = (payment: any) => payment.paidAt || payment.createdAt;

  // Calculate today's total sales (use Africa/Nairobi local time)
  const TIMEZONE = 'Africa/Nairobi';
  const today = dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
  const totalSalesTodayValue = payments
    .filter((p) => p.status === 'completed' && dayjs(getPaymentDate(p)).tz(TIMEZONE).format('YYYY-MM-DD') === today)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const animatedTotalSales = useCountUp(totalSalesTodayValue);

  const kpiCards = [
    {
      label: 'Rooms Available',
      value: animatedRoomsAvailable,
      icon: <HotelIcon fontSize="large" sx={{ color: '#1976d2' }} />, // blue
      chip: conferenceAvailable ? <Chip label="Conference Room Available" color="success" size="small" /> : <Chip label="Conference Room Not Available" color="error" size="small" />,
      color: '#e3f2fd',
      onClick: () => navigate('/rooms'),
    },
    {
      label: 'Rooms Occupied',
      value: animatedRoomsOccupied,
      icon: <MeetingRoomIcon fontSize="large" sx={{ color: '#43a047' }} />, // green
      color: '#e8f5e9',
      onClick: () => navigate('/rooms'),
    },
    {
      label: 'Ongoing F&B Orders',
      value: animatedOngoingOrders,
      icon: <RestaurantIcon fontSize="large" sx={{ color: '#ffa726' }} />, // orange
      color: '#fff3e0',
      onClick: () => navigate('/order'),
    },
    {
      label: 'Total Sales Today',
      value: `Ksh ${animatedTotalSales.toLocaleString()}`,
      icon: <MonetizationOnIcon fontSize="large" sx={{ color: '#e53935' }} />, // red
      color: '#ffebee',
      onClick: () => navigate('/payments'),
    },
  ];

  const notificationIcon = (type: string) => {
    if (type === 'warning') return <WarningAmberIcon color="warning" sx={{ mr: 1 }} />;
    if (type === 'error') return <ErrorIcon color="error" sx={{ mr: 1 }} />;
    return <InfoIcon color="info" sx={{ mr: 1 }} />;
  };

  // Clear all notifications
  const handleClearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await axios.delete('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications([]);
    } catch {}
  };

  // Clear a single notification
  const handleClearNotification = async (id: number) => {
    try {
      await axios.delete(`/api/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

  if (!user) return <div />;

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, width: '100%', maxWidth: 1300, margin: '0 auto' }}>
      <Grid container spacing={3}>
        {kpiCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 8 },
                borderRadius: 3,
                background: card.color,
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: 2,
              }}
              onClick={card.onClick}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>{card.icon}</Box>
              <Typography variant="subtitle2" color="textSecondary">{card.label}</Typography>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>{card.value}</Typography>
              {card.chip}
            </Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Ongoing Orders</Typography>
              {loadingOrders ? (
                <Typography>Loading...</Typography>
              ) : ongoingOrdersList.length === 0 ? (
                <Typography color="text.secondary">No ongoing orders.</Typography>
              ) : (
                <List dense>
                  {ongoingOrdersList.map((order, idx) => (
                    <ListItem key={order.id} divider={idx < ongoingOrdersList.length - 1}>
                      <ListItemText
                        primary={
                          <Typography component="span">
                            Table {order.tableNumber || '-'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Status: {order.status}
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              Items: {order.items?.length || 0} • Total: Ksh {
                                order.items?.reduce(
                                  (sum: number, item: OrderItem): number => 
                                    sum + (Number(item.price) * item.quantity), 
                                  0
                                ).toLocaleString() || 0
                              }
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Complete Orders</Typography>
              {loadingOrders ? (
                <Typography>Loading...</Typography>
              ) : sortedDates.length === 0 ? (
                <Typography color="text.secondary">No complete orders.</Typography>
              ) : (
                <List dense>
                  {dailyStats.map(({ date, totalOrders, totalSales, percentChange }) => (
                    <React.Fragment key={date}>
                      <ListItem sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mb: 1, cursor: 'pointer' }} onClick={() => handleToggleDay(date)}>
                        <ListItemText
                          primary={<Typography component="span" variant="subtitle1" sx={{ fontWeight: 600 }}>{dayjs(date).format('DD MMMM YYYY')}</Typography>}
                          secondary={
                            <>
                              <Typography component="span" variant="body2">Total Orders: {totalOrders}</Typography>
                              <Typography component="span" variant="body2">Total Sales: Ksh {totalSales.toLocaleString()}</Typography>
                              {percentChange !== null && (
                                <Typography component="span" variant="body2" sx={{ color: percentChange > 0 ? 'green' : percentChange < 0 ? 'red' : 'text.secondary', fontWeight: 600 }}>
                                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : ''} vs previous day
                                </Typography>
                              )}
                            </>
                          }
                        />
                        {expandedDays[date] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </ListItem>
                      {/* Collapsible list of orders for this day */}
                      {expandedDays[date] && completeOrdersByDay[date].map((order, idx) => {
                        const completedPayment = order.payments?.find((p: Payment) => p.status === 'completed');
                        return (
                          <ListItem key={order.id} sx={{ pl: 4 }} divider={idx < completeOrdersByDay[date].length - 1}>
                            <ListItemText
                              primary={<Typography component="span">Table {order.tableNumber || '-'}</Typography>}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    Payment: {completedPayment ? `${completedPayment.method.toUpperCase()} - Ksh ${Number(completedPayment.amount).toLocaleString()}` : 'N/A'}
                                  </Typography>
                                  <Typography component="span" variant="body2" color="text.secondary">
                                    Items: {order.items?.length || 0}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                Notifications
               {notifications.length > 0 && (
                 <DeleteIcon
                   onClick={handleClearAllNotifications}
                   sx={{ ml: 1, cursor: 'pointer', color: 'error.main' }}
                   titleAccess="Clear all notifications"
                 />
               )}
              </Typography>
              <Box sx={{ maxHeight: 260, overflowY: 'auto' }}>
                <List dense>
                 {notifications.length === 0 ? (
                   <ListItem alignItems="flex-start">
                     <ListItemText primary="No notifications." />
                   </ListItem>
                 ) : notifications.map((note, idx) => (
                    <ListItem key={note.id} alignItems="flex-start"
                      secondaryAction={
                        <DeleteIcon
                          onClick={() => handleClearNotification(note.id)}
                          sx={{ cursor: 'pointer', color: 'error.main' }}
                          titleAccess="Clear notification"
                        />
                      }
                    >
                      {notificationIcon(note.type)}
                      <ListItemText
                        primary={note.message}
                        secondary={dayjs(note.createdAt).format('DD MMM YYYY HH:mm')}
                        primaryTypographyProps={{
                          color:
                            note.type === 'error'
                              ? 'error'
                              : note.type === 'warning'
                              ? 'warning.main'
                              : 'textPrimary',
                          fontWeight: note.type === 'error' ? 700 : 500,
                        }}
                      />
                    </ListItem>
                 ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 
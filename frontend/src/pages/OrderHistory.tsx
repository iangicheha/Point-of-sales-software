import React, { useEffect, useState } from 'react';
import { Paper, List, ListItem, ListItemText, Typography, Chip, CircularProgress, Alert, Button, Grid, Stack, TextField, Tooltip, Box } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ReceiptModal } from '../components/ReceiptModal';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import StarIcon from '@mui/icons-material/Star';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export const OrderHistory = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ open: boolean, orderId?: number }>({ open: false });

  // Add state to track expanded days
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const handleToggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Add state to track expanded weeks
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const handleToggleWeek = (week: string) => {
    setExpandedWeeks(prev => ({ ...prev, [week]: !prev[week] }));
  };

  // Date range state
  const [from, setFrom] = useState(() => dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
        setOrders(res.data);
      } catch (err) {
        setError('Failed to load orders');
      }
      setLoading(false);
    }
    fetchOrders();
  }, [token]);

  if (!user) return <div />;
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  // Helper to get the payment date (paidAt or createdAt)
  const getPaymentDate = (payment: any) => payment.paidAt || payment.createdAt;
  const TIMEZONE = 'Africa/Nairobi';

  // Only completed orders
  const completedOrders = orders.filter(order => order.payments?.some((p: any) => p.status === 'completed'));

  // Filter orders by date range
  const filteredOrders = completedOrders.filter(order => {
    const completedPayment = order.payments?.find((p: any) => p.status === 'completed');
    if (!completedPayment) return false;
    const date = dayjs(getPaymentDate(completedPayment)).tz(TIMEZONE).format('YYYY-MM-DD');
    return date >= from && date <= to;
  });

  // Group by day (within range)
  const ordersByDay: Record<string, any[]> = {};
  let current = dayjs(from);
  const end = dayjs(to);
  const allDates: string[] = [];
  while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
    allDates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  filteredOrders.forEach(order => {
    const completedPayment = order.payments?.find((p: any) => p.status === 'completed');
    if (!completedPayment) return;
    const date = dayjs(getPaymentDate(completedPayment)).tz(TIMEZONE).format('YYYY-MM-DD');
    if (!ordersByDay[date]) ordersByDay[date] = [];
    ordersByDay[date].push(order);
  });

  // For each day, get stats or zero if none
  const dailyStats = allDates.map((date, idx) => {
    const dayOrders = ordersByDay[date] || [];
    const totalOrders = dayOrders.length;
    const totalSales = dayOrders.reduce((sum, order) => {
      const payment = order.payments?.find((p: any) => p.status === 'completed');
      return sum + (payment ? Number(payment.amount) : 0);
    }, 0);
    let percentChange: number | null = null;
    if (idx > 0) {
      const prevOrders = ordersByDay[allDates[idx - 1]] || [];
      const prevTotalSales = prevOrders.reduce((sum, order) => {
        const payment = order.payments?.find((p: any) => p.status === 'completed');
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

  // Summary calculations
  const totalSales = dailyStats.reduce((sum, d) => sum + d.totalSales, 0);
  const totalOrders = dailyStats.reduce((sum, d) => sum + d.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const bestDay = dailyStats.reduce((best, d) => d.totalSales > (best?.totalSales || 0) ? d : best, null as null | typeof dailyStats[0]);

  // Helper to get week start (Sunday) for a date
  function getWeekStart(date: string) {
    return dayjs(date).startOf('week'); // Sunday as start
  }
  // Helper to get month start for a date
  function getMonthStart(date: string) {
    return dayjs(date).startOf('month');
  }

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>Order History</Typography>
      {/* Date Range Picker */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          label="From"
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="To"
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
      </Stack>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#ffebee' }}>
            <MonetizationOnIcon color="error" fontSize="large" />
            <div>
              <Typography variant="subtitle2">Total Sales</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Ksh {totalSales.toLocaleString()}</Typography>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#e3f2fd' }}>
            <ListAltIcon color="primary" fontSize="large" />
            <div>
              <Typography variant="subtitle2">Total Orders</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{totalOrders}</Typography>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#e8f5e9' }}>
            <Tooltip title="Average value per order">
              <StarIcon color="success" fontSize="large" />
            </Tooltip>
            <div>
              <Typography variant="subtitle2">Avg Order Value</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Ksh {avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Typography>
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fffde7' }}>
            <Tooltip title="Day with highest sales in range">
              <StarIcon color="warning" fontSize="large" />
            </Tooltip>
            <div>
              <Typography variant="subtitle2">Best Sales Day</Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{bestDay ? dayjs(bestDay.date).format('DD MMM') + ': Ksh ' + bestDay.totalSales.toLocaleString() : '-'}</Typography>
            </div>
          </Paper>
        </Grid>
      </Grid>
      {/* Daily Breakdown Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Total Orders</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Total Sales</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>% Change</TableCell>
                <TableCell align="right" sx={{ width: 48 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
        {dailyStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>No completed orders.</TableCell>
              </TableRow>
            ) : (
              (() => {
                const rows: React.ReactNode[] = [];
                let weekOrders = 0, weekSales = 0, prevWeekSales: number | null = null, weekStart: string | null = null, weekEnd: string | null = null;
                let lastWeek: string | null = null;
                let weekDays: { date: string, totalOrders: number, totalSales: number, percentChange: number | null }[] = [];
                dailyStats.forEach((stat, idx) => {
                  const { date, totalOrders, totalSales, percentChange } = stat;
                  const week = getWeekStart(date).format('YYYY-MM-DD');
                  // Week logic
                  if (lastWeek !== week) {
                    if (lastWeek !== null) {
                      // Insert week summary row
                      const weekLabel = weekStart && weekEnd ? `${dayjs(weekStart).format('DD MMM')} - ${dayjs(weekEnd).format('DD MMM')}` : '';
                      const weekPercent = prevWeekSales !== null && prevWeekSales > 0 ? ((weekSales - prevWeekSales) / prevWeekSales) * 100 : null;
                      rows.push(
                        <React.Fragment key={`week-summary-${lastWeek}`}>
                          <TableRow sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>
                            <TableCell colSpan={1} sx={{ fontWeight: 700 }}>
                              <IconButton size="small" onClick={() => handleToggleWeek(lastWeek!)}>
                                {expandedWeeks[lastWeek!] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                              Week of {weekLabel}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{weekOrders}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>Ksh {weekSales.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {weekPercent !== null && (
                                <span style={{ color: weekPercent > 0 ? 'green' : weekPercent < 0 ? 'red' : 'gray' }}>
                                  {weekPercent > 0 ? '+' : ''}{weekPercent.toFixed(1)}% {weekPercent > 0 ? '↑' : weekPercent < 0 ? '↓' : ''}
                                </span>
                              )}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          {expandedWeeks[lastWeek!] && weekDays.map(({ date, totalOrders, totalSales, percentChange }) => (
            <React.Fragment key={date}>
                              <TableRow sx={{ opacity: totalOrders === 0 ? 0.5 : 1 }}>
                                <TableCell sx={{ fontWeight: 600, pl: 6 }}>{dayjs(date).format('DD MMM YYYY')}</TableCell>
                                <TableCell align="center">{totalOrders}</TableCell>
                                <TableCell align="center">Ksh {totalSales.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                  {percentChange !== null && (
                                    <span style={{ color: percentChange > 0 ? 'green' : percentChange < 0 ? 'red' : 'gray', fontWeight: 600 }}>
                                      {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : ''}
                                    </span>
                                  )}
                                  {totalOrders === 0 && <span style={{ color: '#888', fontStyle: 'italic' }}>No sales</span>}
                                </TableCell>
                                <TableCell align="right">
                                  {totalOrders > 0 && (
                                    <IconButton size="small" onClick={() => handleToggleDay(date)}>
                                      {expandedDays[date] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    </IconButton>
                                  )}
                                </TableCell>
                              </TableRow>
                              {/* Expandable order details */}
                              {totalOrders > 0 && expandedDays[date] && (
                                <TableRow>
                                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                    <Collapse in={expandedDays[date]} timeout="auto" unmountOnExit>
                                      <List sx={{ pl: 2 }}>
                                        {ordersByDay[date]?.map((order, idx) => {
                                          const completedPayment = order.payments?.find((p: any) => p.status === 'completed');
                                          return (
                                            <ListItem key={order.id} divider={idx < ordersByDay[date].length - 1} alignItems="flex-start">
                <ListItemText
                                                primary={<>
                                                  <b>Table {order.tableNumber || '-'}</b> <Chip label={order.status} size="small" style={{ marginLeft: 8 }} />
                                                </>}
                                                secondary={<>
                                                  <div>Date: {new Date(order.createdAt).toLocaleString()}</div>
                                                  <div>Items: {order.items?.map((item: any) => `${item.menuItem?.name || ''} x${item.quantity}`).join(', ')}</div>
                                                  <div>Amount: Ksh {completedPayment ? Number(completedPayment.amount).toLocaleString() : 'N/A'}</div>
                                                </>}
                                              />
                                              <Button variant="outlined" size="small" onClick={() => setReceipt({ open: true, orderId: order.id })} style={{ marginLeft: 16 }}>
                                                Print Receipt
                                              </Button>
                                              <Button variant="contained" size="small" color="primary" onClick={() => setReceipt({ open: true, orderId: order.id })} style={{ marginLeft: 8 }}>
                                                Preview
                                              </Button>
                                            </ListItem>
                                          );
                                        })}
                                      </List>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      );
                      prevWeekSales = weekSales;
                    }
                    weekOrders = 0;
                    weekSales = 0;
                    weekStart = date;
                    weekDays = [];
                  }
                  weekOrders += totalOrders;
                  weekSales += totalSales;
                  weekEnd = date;
                  lastWeek = week;
                  weekDays.push({ date, totalOrders, totalSales, percentChange });
                });
                // Push last week summary row
                if (weekOrders > 0) {
                  const weekLabel = weekStart && weekEnd ? `${dayjs(weekStart).format('DD MMM')} - ${dayjs(weekEnd).format('DD MMM')}` : '';
                  const weekPercent = prevWeekSales !== null && prevWeekSales > 0 ? ((weekSales - prevWeekSales) / prevWeekSales) * 100 : null;
                  rows.push(
                    <React.Fragment key={`week-summary-${lastWeek}`}>
                      <TableRow sx={{ bgcolor: '#f5f5f5', fontWeight: 700 }}>
                        <TableCell colSpan={1} sx={{ fontWeight: 700 }}>
                          <IconButton size="small" onClick={() => handleToggleWeek(lastWeek!)}>
                            {expandedWeeks[lastWeek!] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                          Week of {weekLabel}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{weekOrders}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Ksh {weekSales.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {weekPercent !== null && (
                            <span style={{ color: weekPercent > 0 ? 'green' : weekPercent < 0 ? 'red' : 'gray' }}>
                              {weekPercent > 0 ? '+' : ''}{weekPercent.toFixed(1)}% {weekPercent > 0 ? '↑' : weekPercent < 0 ? '↓' : ''}
                            </span>
                          )}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      {expandedWeeks[lastWeek!] && weekDays.map(({ date, totalOrders, totalSales, percentChange }) => (
                        <React.Fragment key={date}>
                          <TableRow sx={{ opacity: totalOrders === 0 ? 0.5 : 1 }}>
                            <TableCell sx={{ fontWeight: 600, pl: 6 }}>{dayjs(date).format('DD MMM YYYY')}</TableCell>
                            <TableCell align="center">{totalOrders}</TableCell>
                            <TableCell align="center">Ksh {totalSales.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {percentChange !== null && (
                                <span style={{ color: percentChange > 0 ? 'green' : percentChange < 0 ? 'red' : 'gray', fontWeight: 600 }}>
                                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : ''}
                                </span>
                              )}
                              {totalOrders === 0 && <span style={{ color: '#888', fontStyle: 'italic' }}>No sales</span>}
                            </TableCell>
                            <TableCell align="right">
                              {totalOrders > 0 && (
                                <IconButton size="small" onClick={() => handleToggleDay(date)}>
                                  {expandedDays[date] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                          {/* Expandable order details */}
                          {totalOrders > 0 && expandedDays[date] && (
                            <TableRow>
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                <Collapse in={expandedDays[date]} timeout="auto" unmountOnExit>
                                  <List sx={{ pl: 2 }}>
                                    {ordersByDay[date]?.map((order, idx) => {
                const completedPayment = order.payments?.find((p: any) => p.status === 'completed');
                return (
                                        <ListItem key={order.id} divider={idx < ordersByDay[date].length - 1} alignItems="flex-start">
                    <ListItemText
                      primary={<>
                        <b>Table {order.tableNumber || '-'}</b> <Chip label={order.status} size="small" style={{ marginLeft: 8 }} />
                      </>}
                      secondary={<>
                        <div>Date: {new Date(order.createdAt).toLocaleString()}</div>
                        <div>Items: {order.items?.map((item: any) => `${item.menuItem?.name || ''} x${item.quantity}`).join(', ')}</div>
                        <div>Amount: Ksh {completedPayment ? Number(completedPayment.amount).toLocaleString() : 'N/A'}</div>
                      </>}
                    />
                    <Button variant="outlined" size="small" onClick={() => setReceipt({ open: true, orderId: order.id })} style={{ marginLeft: 16 }}>
                      Print Receipt
                    </Button>
                    <Button variant="contained" size="small" color="primary" onClick={() => setReceipt({ open: true, orderId: order.id })} style={{ marginLeft: 8 }}>
                      Preview
                    </Button>
                  </ListItem>
                );
              })}
                                  </List>
                                </Collapse>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
            </React.Fragment>
                  );
                }
                return rows;
              })()
        )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <ReceiptModal open={receipt.open} orderId={receipt.orderId} onClose={() => setReceipt({ open: false })} mode="open" />
    </Paper>
  );
}; 
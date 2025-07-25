import React, { useState, useEffect } from 'react';
import { Paper, List, ListItem, ListItemText, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton, Button, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import dayjs from 'dayjs';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Payment {
  id: number;
  status: string;
  method: string;
  amount: number;
  transactionRef?: string;
  order?: {
    id: number;
    tableNumber?: string;
  };
  paidAt?: string;
  createdAt?: string;
}

export const PaymentHistory = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const handleToggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };
  const handleToggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get('/api/payments', { headers: { Authorization: `Bearer ${token}` } });
        setPayments(res.data);
      } catch {}
    };
    fetchPayments();
  }, [token]);

  // Group completed payments by day
  const completedPayments = payments.filter(p => p.status === 'completed');
  const paymentsByDay: Record<string, typeof completedPayments> = {};
  completedPayments.forEach(payment => {
    const date = dayjs(payment.paidAt || payment.createdAt).format('YYYY-MM-DD');
    if (!paymentsByDay[date]) paymentsByDay[date] = [];
    paymentsByDay[date].push(payment);
  });
  // Generate all dates in range
  const allDates = Object.keys(paymentsByDay).sort();
  // Helper to get month start for a date
  function getMonthStart(date: string) {
    return dayjs(date).startOf('month');
  }
  // For each day, get stats or zero if none
  const dailyStats = allDates.map((date, idx) => {
    const dayPayments = paymentsByDay[date] || [];
    const totalPayments = dayPayments.length;
    const totalAmount = dayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    let percentChange: number | null = null;
    if (idx > 0) {
      const prevPayments = paymentsByDay[allDates[idx - 1]] || [];
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

  return (
    <Paper style={{ padding: 24 }}>
      <Typography variant="h5" gutterBottom>Payment History</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Total Payments</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Total Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>% Change</TableCell>
              <TableCell align="right" sx={{ width: 48 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
        {dailyStats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>No completed payments.</TableCell>
              </TableRow>
            ) : (
              (() => {
                let rows: React.ReactNode[] = [];
                let monthPayments = 0, monthAmount = 0, prevMonthAmount: number | null = null, monthStart: string | null = null, monthEnd: string | null = null;
                let lastMonth: string | null = null;
                let monthDays: { date: string, totalPayments: number, totalAmount: number, percentChange: number | null }[] = [];
                dailyStats.forEach((stat, idx) => {
                  const { date, totalPayments, totalAmount, percentChange } = stat;
                  const month = getMonthStart(date).format('YYYY-MM');
                  if (lastMonth !== month) {
                    if (lastMonth !== null) {
                      // Insert month summary row
                      const monthLabel = monthStart && monthEnd ? dayjs(monthStart).format('MMMM YYYY') : '';
                      const monthPercent = prevMonthAmount !== null && prevMonthAmount > 0 ? ((monthAmount - prevMonthAmount) / prevMonthAmount) * 100 : null;
                      rows.push(
                        <React.Fragment key={`month-summary-${lastMonth}`}>
                          <TableRow sx={{ bgcolor: '#e3f2fd', fontWeight: 700 }}>
                            <TableCell colSpan={1} sx={{ fontWeight: 700 }}>
                              <IconButton size="small" onClick={() => handleToggleMonth(lastMonth!)}>
                                {expandedMonths[lastMonth!] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                              {monthLabel}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{monthPayments}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>KES {monthAmount.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {monthPercent !== null && (
                                <span style={{ color: monthPercent > 0 ? 'green' : monthPercent < 0 ? 'red' : 'gray' }}>
                                  {monthPercent > 0 ? '+' : ''}{monthPercent.toFixed(1)}% {monthPercent > 0 ? '↑' : monthPercent < 0 ? '↓' : ''}
                                </span>
                              )}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          {expandedMonths[lastMonth!] && monthDays.map(({ date, totalPayments, totalAmount, percentChange }) => (
            <React.Fragment key={date}>
                              <TableRow sx={{ opacity: totalPayments === 0 ? 0.5 : 1 }}>
                                <TableCell sx={{ fontWeight: 600, pl: 6 }}>{dayjs(date).format('DD MMM YYYY')}</TableCell>
                                <TableCell align="center">{totalPayments}</TableCell>
                                <TableCell align="center">KES {totalAmount.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                  {percentChange !== null && (
                                    <span style={{ color: percentChange > 0 ? 'green' : percentChange < 0 ? 'red' : 'gray', fontWeight: 600 }}>
                                      {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : ''}
                                    </span>
                                  )}
                                  {totalPayments === 0 && <span style={{ color: '#888', fontStyle: 'italic' }}>No payments</span>}
                                </TableCell>
                                <TableCell align="right">
                                  {totalPayments > 0 && (
                                    <IconButton size="small" onClick={() => handleToggleDay(date)}>
                                      {expandedDays[date] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    </IconButton>
                                  )}
                                </TableCell>
                              </TableRow>
                              {/* Expandable payment details */}
                              {totalPayments > 0 && expandedDays[date] && (
                                <TableRow>
                                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                    <Collapse in={expandedDays[date]} timeout="auto" unmountOnExit>
                                      <List sx={{ pl: 2 }}>
                                        {paymentsByDay[date]?.map((payment, idx) => (
                                          <ListItem key={payment.id} divider={idx < paymentsByDay[date].length - 1} alignItems="flex-start">
                <ListItemText
                                              primary={<>
                                                Table {payment.order?.tableNumber || '-'}
                                              </>}
                                              secondary={<>
                                                <div>Method: {payment.method.toUpperCase()}</div>
                                                <div>Amount: KES {Number(payment.amount).toLocaleString()}</div>
                                                <div>Status: {payment.status}</div>
                                              </>}
                                            />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      );
                      prevMonthAmount = monthAmount;
                    }
                    monthPayments = 0;
                    monthAmount = 0;
                    monthStart = date;
                    monthDays = [];
                  }
                  monthPayments += totalPayments;
                  monthAmount += totalAmount;
                  monthEnd = date;
                  lastMonth = month;
                  monthDays.push({ date, totalPayments, totalAmount, percentChange });
                });
                // Push last month summary row
                if (monthPayments > 0) {
                  const monthLabel = monthStart && monthEnd ? dayjs(monthStart).format('MMMM YYYY') : '';
                  const monthPercent = prevMonthAmount !== null && prevMonthAmount > 0 ? ((monthAmount - prevMonthAmount) / prevMonthAmount) * 100 : null;
                  rows.push(
                    <React.Fragment key={`month-summary-${lastMonth}`}>
                      <TableRow sx={{ bgcolor: '#e3f2fd', fontWeight: 700 }}>
                        <TableCell colSpan={1} sx={{ fontWeight: 700 }}>
                          <IconButton size="small" onClick={() => handleToggleMonth(lastMonth!)}>
                            {expandedMonths[lastMonth!] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                          {monthLabel}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{monthPayments}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>KES {monthAmount.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {monthPercent !== null && (
                            <span style={{ color: monthPercent > 0 ? 'green' : monthPercent < 0 ? 'red' : 'gray' }}>
                              {monthPercent > 0 ? '+' : ''}{monthPercent.toFixed(1)}% {monthPercent > 0 ? '↑' : monthPercent < 0 ? '↓' : ''}
                            </span>
                          )}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                      {expandedMonths[lastMonth!] && monthDays.map(({ date, totalPayments, totalAmount, percentChange }) => (
                        <React.Fragment key={date}>
                          <TableRow sx={{ opacity: totalPayments === 0 ? 0.5 : 1 }}>
                            <TableCell sx={{ fontWeight: 600, pl: 6 }}>{dayjs(date).format('DD MMM YYYY')}</TableCell>
                            <TableCell align="center">{totalPayments}</TableCell>
                            <TableCell align="center">KES {totalAmount.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              {percentChange !== null && (
                                <span style={{ color: percentChange > 0 ? 'green' : percentChange < 0 ? 'red' : 'gray', fontWeight: 600 }}>
                                  {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : ''}
                                </span>
                              )}
                              {totalPayments === 0 && <span style={{ color: '#888', fontStyle: 'italic' }}>No payments</span>}
                            </TableCell>
                            <TableCell align="right">
                              {totalPayments > 0 && (
                                <IconButton size="small" onClick={() => handleToggleDay(date)}>
                                  {expandedDays[date] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                          {/* Expandable payment details */}
                          {totalPayments > 0 && expandedDays[date] && (
                            <TableRow>
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                <Collapse in={expandedDays[date]} timeout="auto" unmountOnExit>
                                  <List sx={{ pl: 2 }}>
                                    {paymentsByDay[date]?.map((payment, idx) => (
                                      <ListItem key={payment.id} divider={idx < paymentsByDay[date].length - 1} alignItems="flex-start">
                  <ListItemText
                    primary={<>
                      Table {payment.order?.tableNumber || '-'}
                    </>}
                    secondary={<>
                      <div>Method: {payment.method.toUpperCase()}</div>
                      <div>Amount: KES {Number(payment.amount).toLocaleString()}</div>
                      <div>Status: {payment.status}</div>
                    </>}
                  />
                </ListItem>
                                    ))}
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
    </Paper>
  );
}; 
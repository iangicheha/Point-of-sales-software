import React, { useEffect, useState } from 'react';
import { Paper, Typography, Button, Stack, CircularProgress, Alert, Snackbar, Grid, Box, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, ToggleButton, ToggleButtonGroup } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import { DashboardCard } from '../components/DashboardCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export const Reports = () => {
  const [report, setReport] = useState<any>(null);
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const fetchReport = async (selectedPeriod = period) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/reports/summary?period=${selectedPeriod}`, { headers: { Authorization: `Bearer ${token}` } });
      setReport(res.data);
    } catch (err) {
      setError('Failed to load report');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Temporarily removed role check for demo purposes
    // if (user?.role === 'admin') fetchReport();
    fetchReport();
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    // Temporarily removed role check for demo purposes
    // if (user?.role === 'admin') fetchReport(period);
    fetchReport(period);
    // eslint-disable-next-line
  }, [period]);

  const download = async (type: 'pdf' | 'excel') => {
    const url = `/api/reports/daily/${type}?period=${period}`;
    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = type === 'pdf' ? 'report.pdf' : 'report.xlsx';
      link.click();
      setSuccess(type === 'pdf' ? 'PDF downloaded' : 'Excel downloaded');
    } catch {
      setError('Failed to download report');
    }
  };

  // Prepare chart data
  let chartData = null;
  if (report && report.daily) {
    const labels = Object.keys(report.daily);
    chartData = {
      labels,
      datasets: [
        {
          label: 'Orders',
          data: labels.map((d) => report.daily[d].orders),
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25,118,210,0.08)',
          tension: 0.3,
        },
        {
          label: 'Revenue',
          data: labels.map((d) => report.daily[d].revenue),
          borderColor: '#43a047',
          backgroundColor: 'rgba(67,160,71,0.08)',
          tension: 0.3,
        },
      ],
    };
  }

  const topProduct = report?.topProducts?.[0];

  // Temporarily removed role check for demo purposes
  // if (user?.role !== 'admin') return <div />;
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={1}>
          <TrendingUpIcon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Business Reports</Typography>
            <Typography variant="subtitle1" color="text.secondary">Sales, orders, and product performance overview</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        {/* Period Toggle & Download */}
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={12} sm={8} md={9}>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={(_, value) => value && setPeriod(value)}
              size="small"
              color="primary"
              sx={{ mb: { xs: 1, sm: 0 } }}
            >
              <ToggleButton value="today">Today</ToggleButton>
              <ToggleButton value="week">Weekly</ToggleButton>
              <ToggleButton value="month">Monthly</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button variant="outlined" onClick={() => download('pdf')}>Download PDF</Button>
              <Button variant="outlined" onClick={() => download('excel')}>Download Excel</Button>
            </Stack>
          </Grid>
        </Grid>
        {report ? (
          <>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={4}>
                <DashboardCard title="Total Orders" value={report.totalOrders} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DashboardCard title="Total Revenue" value={`Ksh${report.totalRevenue?.toLocaleString()}`} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DashboardCard title="Top Product" value={topProduct ? topProduct.name : '-'} />
              </Grid>
            </Grid>
            {/* Chart */}
            {chartData && (
              <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f5f7fa' }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Orders & Revenue Trend</Typography>
                <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                  <Line data={chartData} options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } },
                  }} />
                </Box>
              </Paper>
            )}
            {/* Top Products Table */}
            {report.topProducts && report.topProducts.length > 0 && (
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  <StarIcon color="warning" sx={{ verticalAlign: 'middle', mr: 1 }} />Top 5 Selling Products
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity Sold</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.topProducts.map((prod: any, idx: number) => (
                        <TableRow key={prod.name}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {/* If you have product images, show Avatar here. Example: <Avatar src={prod.image} /> */}
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#e3f2fd', color: '#1976d2', fontSize: 16 }}>{prod.name?.[0]}</Avatar>
                              <span>{prod.name}</span>
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{prod.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </>
        ) : (
          <Typography>Loading...</Typography>
        )}
        <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}><Alert severity="success">{success}</Alert></Snackbar>
      </Paper>
    </Box>
  );
}; 
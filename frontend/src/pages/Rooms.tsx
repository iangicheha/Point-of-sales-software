import React, { useEffect, useState, useRef } from 'react';
import {
  Paper, Grid, Card, CardContent, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Select, MenuItem as MuiMenuItem,
  InputLabel, FormControl, TextField, IconButton, CircularProgress,
  Snackbar, Alert, Box, Chip, Tabs, Tab, Divider
} from '@mui/material';
import {
  Edit, CleaningServices, Room as RoomIcon, Search,
  History, Restaurant, Build, CheckCircle, Cancel, Warning,
  Wifi, Tv, AcUnit, Deck, LocalCafe, Checkroom, Toys
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

interface Room {
  id: number;
  number: string;
  type: string;
  status: string;
  guestName?: string;
  reservationId?: number;
  maintenanceStatus?: string;
  lastCleaned?: string;
  notes?: string;
  description?: string;
  facilities?: string;
  bedType?: string;
  balcony?: boolean;
  view?: boolean;
  airConditioning?: boolean;
  flatScreenTV?: boolean;
  freeWifi?: boolean;
  electricKettle?: boolean;
  wardrobe?: boolean;
  clothesRack?: boolean;
  fan?: boolean;
  // New benefits
  freeParking?: boolean;
  fitnessCenter?: boolean;
  nonSmoking?: boolean;
  beachfront?: boolean;
  roomService?: boolean;
  familyRoom?: boolean;
  bar?: boolean;
  breakfast?: boolean;
}

interface RoomService {
  id: number;
  roomId: number;
  type: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  notes?: string;
}

export const Rooms = () => {
  const { token, user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [roomServices, setRoomServices] = useState<RoomService[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState({ guestName: '', checkIn: dayjs(), checkOut: dayjs().add(1, 'day'), contactInfo: '', email: '', specialRequests: '', paymentMethod: '', adults: 1, children: 0, pets: 0 });
  const [showBookingReceipt, setShowBookingReceipt] = useState(false);
  const bookingReceiptRef = useRef<HTMLDivElement>(null);
  const [switchingRoom, setSwitchingRoom] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Add the missing fetchRooms function above the useEffect that calls it
  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/rooms', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort rooms by number (as string or number)
      const sortedRooms = [...res.data].sort((a, b) => {
        // Try to compare as numbers, fallback to string
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.number.localeCompare(b.number);
      });
      setRooms(sortedRooms);
      setFilteredRooms(sortedRooms);
    } catch (err) {
      setError('Failed to load rooms');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'frontdesk')) return;
    fetchRooms();
  }, [token]);

  useEffect(() => {
    let filtered = rooms;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.guestName && room.guestName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(room => room.status === filterStatus);
    }
    
    setFilteredRooms(filtered);
  }, [searchTerm, filterStatus, rooms]);

  const handleOpen = (room: Room) => {
    setEditRoom(room);
    setStatus(room.status);
    setOpen(true);
  };

  const handleOpenService = (room: Room) => {
    setSelectedRoom(room);
    setServiceOpen(true);
  };

  const handleClose = () => setOpen(false);
  const handleServiceClose = () => setServiceOpen(false);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      if (!editRoom) return;
      await axios.put(
        `/api/rooms/${editRoom.id}`,
        { ...editRoom, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpen(false);
      setSuccess('Room status updated successfully');
      fetchRooms();
    } catch (err) {
      setError('Failed to update room status');
    }
    setLoading(false);
  };

  const handleRequestService = async (type: string) => {
    if (!selectedRoom) return;
    setLoading(true);
    try {
      await axios.post('/api/room-services', {
        roomId: selectedRoom.id,
        type,
        status: 'pending',
        requestedAt: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`${type} service requested for Room ${selectedRoom.number}`);
      setServiceOpen(false);
    } catch (err) {
      setError('Failed to request service');
    }
    setLoading(false);
  };

  const handleBookRoom = (room: Room) => {
    setBookingRoom(room);
    setBookingForm({
      guestName: '',
      checkIn: dayjs(),
      checkOut: dayjs().add(1, 'day'),
      contactInfo: '',
      email: '',
      specialRequests: '',
      paymentMethod: '',
      adults: 1,
      children: 0,
      pets: 0,
    });
    setBookingOpen(true);
  };

  const handleBookingSubmit = async () => {
    setBookingLoading(true);
    try {
      await axios.post('/api/reservations', {
        roomId: bookingRoom?.id,
        guestName: bookingForm.guestName,
        checkIn: bookingForm.checkIn.format('YYYY-MM-DD'),
        checkOut: bookingForm.checkOut.format('YYYY-MM-DD'),
        contactInfo: bookingForm.contactInfo,
        email: bookingForm.email,
        specialRequests: bookingForm.specialRequests,
        paymentMethod: bookingForm.paymentMethod,
        adults: bookingForm.adults,
        children: bookingForm.children,
        pets: bookingForm.pets,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Room booked successfully!');
      setBookingOpen(false);
      setShowBookingReceipt(true);
      fetchRooms();
    } catch (err) {
      setError('Failed to book room');
    }
    setBookingLoading(false);
  };

  // Print booking receipt
  const handlePrintBookingReceipt = () => {
    if (!bookingReceiptRef.current) return;
    const printContents = bookingReceiptRef.current.innerHTML;
    const win = window.open('', '', 'width=600,height=800');
    if (win) {
      win.document.write('<html><head><title>Booking Receipt</title></head><body>' + printContents + '</body></html>');
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  };

  // Handler for check out
  const handleCheckOut = async () => {
    if (!selectedRoom?.reservationId) {
      setError('No active reservation found for this room.');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`/api/reservations/${selectedRoom.reservationId}`, { status: 'checked_out' }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Checked out successfully!');
      setDetailsOpen(false);
      fetchRooms();
    } catch (err) {
      setError('Failed to check out.');
    }
    setLoading(false);
  };

  // Handler for switch room
  const handleSwitchRoom = async () => {
    if (!selectedRoom?.reservationId) {
      setError('No active reservation found for this room.');
      return;
    }
    setSwitchingRoom(true);
    try {
      // Check out current reservation
      await axios.put(`/api/reservations/${selectedRoom.reservationId}`, { status: 'checked_out' }, { headers: { Authorization: `Bearer ${token}` } });
      setDetailsOpen(false);
      // Pre-fill booking dialog with guest info
      setBookingForm({
        guestName: selectedRoom.guestName || '',
        checkIn: dayjs(),
        checkOut: dayjs().add(1, 'day'),
        contactInfo: '',
        email: '',
        specialRequests: '',
        paymentMethod: '',
        adults: 1,
        children: 0,
        pets: 0,
      });
      setBookingRoom(null); // User will select new room
      setBookingOpen(true);
      fetchRooms();
    } catch (err) {
      setError('Failed to switch room.');
    }
    setSwitchingRoom(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'vacant': return '#4caf50';
      case 'occupied': return '#f44336';
      case 'cleaning': return '#2196f3';
      case 'maintenance': return '#ff9800';
      default: return '#757575';
    }
  };

  const renderRoomCard = (room: Room) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.02)' },
        position: 'relative'
      }}
      onClick={() => { setSelectedRoom(room); setDetailsOpen(true); }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 8,
          height: '100%',
          backgroundColor: getStatusColor(room.status)
        }}
      />
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{room.type}</Typography>
          {(user?.role === 'admin' || user?.role === 'frontdesk') && (
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              handleOpen(room);
            }}>
              <Edit />
            </IconButton>
          )}
        </Box>
        <Typography color="textSecondary" gutterBottom>Room {room.number}</Typography>
        <Chip
          label={room.status.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: getStatusColor(room.status),
            color: 'white',
            mb: 1
          }}
        />
        {room.bedType && (
          <Typography variant="body2">{room.bedType}</Typography>
        )}
        {room.guestName && (
          <Typography variant="body2" component="span">Guest: {room.guestName}</Typography>
        )}
        <Box mt={1} display="flex" gap={1} flexWrap="wrap">
          {room.balcony && <Deck fontSize="small" titleAccess="Balcony" />}
          {room.view && <RoomIcon fontSize="small" titleAccess="View" />}
          {room.airConditioning && <AcUnit fontSize="small" titleAccess="Air Conditioning" />}
          {room.flatScreenTV && <Tv fontSize="small" titleAccess="Flat-screen TV" />}
          {room.freeWifi && <Wifi fontSize="small" titleAccess="Free Wifi" />}
          {room.electricKettle && <LocalCafe fontSize="small" titleAccess="Electric Kettle" />}
          {room.wardrobe && <Checkroom fontSize="small" titleAccess="Wardrobe or Closet" />}
          {room.clothesRack && <Checkroom fontSize="small" titleAccess="Clothes Rack" />}
          {room.fan && <Toys fontSize="small" titleAccess="Fan" />}
        </Box>
        {room.description && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }} component="div">{room.description}</Typography>
        )}
        <Box mt={1} display="flex" gap={1}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenService(room);
            }}
          >
            <Restaurant fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenService(room);
            }}
          >
            <CleaningServices fontSize="small" />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
            onClick={e => { e.stopPropagation(); handleBookRoom(room); }}
            disabled={room.status !== 'vacant'}
          >
            Book Room
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MuiMenuItem value="all">All Rooms</MuiMenuItem>
                <MuiMenuItem value="vacant">Vacant</MuiMenuItem>
                <MuiMenuItem value="occupied">Occupied</MuiMenuItem>
                <MuiMenuItem value="cleaning">Cleaning</MuiMenuItem>
                <MuiMenuItem value="maintenance">Maintenance</MuiMenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredRooms.length} of {rooms.length} rooms
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Room Grid */}
      <Grid container spacing={2}>
        {filteredRooms.map(room => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
            {renderRoomCard(room)}
          </Grid>
        ))}
      </Grid>

      {/* Edit Room Dialog */}
      <Dialog open={open} onClose={handleClose} fullScreen={isMobile}>
        <DialogTitle>Edit Room Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              label="Status"
            >
              <MuiMenuItem value="vacant">Vacant</MuiMenuItem>
              <MuiMenuItem value="occupied">Occupied</MuiMenuItem>
              <MuiMenuItem value="cleaning">Cleaning</MuiMenuItem>
              <MuiMenuItem value="maintenance">Maintenance</MuiMenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Guest Name"
            value={editRoom?.guestName || ''}
            onChange={(e) => setEditRoom(prev => prev ? {...prev, guestName: e.target.value} : null)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Notes"
            multiline
            rows={3}
            value={editRoom?.notes || ''}
            onChange={(e) => setEditRoom(prev => prev ? {...prev, notes: e.target.value} : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room Service Dialog */}
      <Dialog open={serviceOpen} onClose={handleServiceClose} fullScreen={isMobile}>
        <DialogTitle>Request Service for Room {selectedRoom?.number}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Restaurant />}
                onClick={() => handleRequestService('room_service')}
              >
                Request Room Service
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CleaningServices />}
                onClick={() => handleRequestService('housekeeping')}
              >
                Request Housekeeping
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Build />}
                onClick={() => handleRequestService('maintenance')}
              >
                Request Maintenance
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleServiceClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Room Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{selectedRoom?.type} - Room {selectedRoom?.number}</DialogTitle>
        <DialogContent>
          {selectedRoom?.bedType && <Typography component="div"><b>Beds:</b> {selectedRoom.bedType}</Typography>}
          {selectedRoom?.description && <Typography sx={{ mb: 1 }}>{selectedRoom.description}</Typography>}
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {selectedRoom?.balcony && <Chip icon={<Deck />} label="Balcony" />}
            {selectedRoom?.view && <Chip icon={<RoomIcon />} label="View" />}
            {selectedRoom?.airConditioning && <Chip icon={<AcUnit />} label="Air Conditioning" />}
            {selectedRoom?.flatScreenTV && <Chip icon={<Tv />} label="Flat-screen TV" />}
            {selectedRoom?.freeWifi && <Chip icon={<Wifi />} label="Free Wifi" />}
            {selectedRoom?.electricKettle && <Chip icon={<LocalCafe />} label="Electric Kettle" />}
            {selectedRoom?.wardrobe && <Chip icon={<Checkroom />} label="Wardrobe/Closet" />}
            {selectedRoom?.clothesRack && <Chip icon={<Checkroom />} label="Clothes Rack" />}
            {selectedRoom?.fan && <Chip icon={<Toys />} label="Fan" />}
          </Box>
          {selectedRoom?.facilities && (
            <Typography variant="body2"><b>Facilities:</b> {selectedRoom.facilities}</Typography>
          )}
          {selectedRoom?.notes && (
            <Typography variant="body2" color="textSecondary"><b>Notes:</b> {selectedRoom.notes}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {selectedRoom?.status === 'occupied' && (
            <>
              <Button onClick={handleCheckOut} color="primary" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Check Out'}
              </Button>
              <Button onClick={handleSwitchRoom} color="secondary" variant="outlined" disabled={switchingRoom || loading}>
                {switchingRoom ? <CircularProgress size={20} /> : 'Switch Room'}
              </Button>
            </>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>Book {bookingRoom?.type} - Room {bookingRoom?.number}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Guest Name"
              value={bookingForm.guestName}
              onChange={e => setBookingForm(f => ({ ...f, guestName: e.target.value }))}
              required
            />
            <Box display="flex" gap={2}>
              <DatePicker
                label="Check-in"
                value={bookingForm.checkIn}
                onChange={(date: Dayjs | null) => setBookingForm(f => ({ ...f, checkIn: date as Dayjs }))}
                minDate={dayjs()}
              />
              <DatePicker
                label="Check-out"
                value={bookingForm.checkOut}
                onChange={(date: Dayjs | null) => setBookingForm(f => ({ ...f, checkOut: date as Dayjs }))}
                minDate={bookingForm.checkIn.add(1, 'day')}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                type="number"
                label="Adults"
                value={bookingForm.adults}
                onChange={e => setBookingForm(f => ({ ...f, adults: Math.max(1, Number(e.target.value)) }))}
                inputProps={{ min: 1 }}
                margin="normal"
                required
                sx={{ flex: 1 }}
              />
              <TextField
                type="number"
                label="Children"
                value={bookingForm.children}
                onChange={e => setBookingForm(f => ({ ...f, children: Math.max(0, Number(e.target.value)) }))}
                inputProps={{ min: 0 }}
                margin="normal"
                sx={{ flex: 1 }}
              />
              <TextField
                type="number"
                label="Pets"
                value={bookingForm.pets}
                onChange={e => setBookingForm(f => ({ ...f, pets: Math.max(0, Number(e.target.value)) }))}
                inputProps={{ min: 0 }}
                margin="normal"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              fullWidth
              margin="normal"
              label="Contact Info"
              value={bookingForm.contactInfo}
              onChange={e => setBookingForm(f => ({ ...f, contactInfo: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              value={bookingForm.email}
              onChange={e => setBookingForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={bookingForm.paymentMethod}
                onChange={e => setBookingForm(f => ({ ...f, paymentMethod: e.target.value }))}
                label="Payment Method"
                required
              >
                <MuiMenuItem value="cash">Cash</MuiMenuItem>
                <MuiMenuItem value="mpesa">Mpesa</MuiMenuItem>
                <MuiMenuItem value="card">Card</MuiMenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              label="Special Requests"
              value={bookingForm.specialRequests}
              onChange={e => setBookingForm(f => ({ ...f, specialRequests: e.target.value }))}
              multiline
              rows={2}
            />
            {/* Room Benefits */}
            {bookingRoom && (
              <Box mt={2}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Room Benefits</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {bookingRoom.balcony && <Chip icon={<Deck />} label="Balcony" />}
                  {bookingRoom.view && <Chip icon={<RoomIcon />} label="View" />}
                  {bookingRoom.airConditioning && <Chip icon={<AcUnit />} label="Air Conditioning" />}
                  {bookingRoom.flatScreenTV && <Chip icon={<Tv />} label="Flat-screen TV" />}
                  {bookingRoom.freeWifi && <Chip icon={<Wifi />} label="Free Wifi" />}
                  {bookingRoom.electricKettle && <Chip icon={<LocalCafe />} label="Electric Kettle" />}
                  {bookingRoom.wardrobe && <Chip icon={<Checkroom />} label="Wardrobe/Closet" />}
                  {bookingRoom.clothesRack && <Chip icon={<Checkroom />} label="Clothes Rack" />}
                  {bookingRoom.fan && <Chip icon={<Toys />} label="Fan" />}
                  {/* New benefits */}
                  {bookingRoom.freeParking && <Chip label="Free Parking" />}
                  {bookingRoom.fitnessCenter && <Chip label="Fitness Center" />}
                  {bookingRoom.nonSmoking && <Chip label="Non-smoking Rooms" />}
                  {bookingRoom.beachfront && <Chip label="Beachfront" />}
                  {bookingRoom.roomService && <Chip label="Room Service" />}
                  {bookingRoom.familyRoom && <Chip label="Family Rooms" />}
                  {bookingRoom.bar && <Chip label="Bar" />}
                  {bookingRoom.breakfast && <Chip label="Breakfast" />}
                </Box>
                {bookingRoom.facilities && (
                  <Typography variant="body2" sx={{ mt: 1 }}>{bookingRoom.facilities}</Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBookingSubmit}
              variant="contained"
              disabled={bookingLoading || !bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut || !bookingForm.contactInfo || !bookingForm.email || !bookingForm.paymentMethod}
            >
              {bookingLoading ? <CircularProgress size={24} /> : 'Book & Print Receipt'}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>

      {/* Booking Receipt Dialog */}
      <Dialog open={showBookingReceipt} onClose={() => setShowBookingReceipt(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Booking Receipt</DialogTitle>
        <DialogContent>
          <div ref={bookingReceiptRef} style={{ fontFamily: 'monospace', width: 300, margin: '0 auto', background: '#fff', color: '#000', fontSize: 12, lineHeight: 1.4, border: '1px dashed #eee', boxShadow: '0 0 2px #eee', minHeight: 200 }}>
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
              Room: {bookingRoom?.number}<br />
              Type: {bookingRoom?.type}<br />
              Guest: {bookingForm.guestName}<br />
              Contact: {bookingForm.contactInfo}<br />
              Email: {bookingForm.email}<br />
              Adults: {bookingForm.adults} &nbsp; Children: {bookingForm.children} &nbsp; Pets: {bookingForm.pets}<br />
              Check-in: {bookingForm.checkIn.format('YYYY-MM-DD')}<br />
              Check-out: {bookingForm.checkOut.format('YYYY-MM-DD')}<br />
              Payment: {bookingForm.paymentMethod.charAt(0).toUpperCase() + bookingForm.paymentMethod.slice(1)}
            </div>
            <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
            <div style={{ fontWeight: 'bold', fontSize: 13, margin: '12px 0 6px 0', textAlign: 'center', letterSpacing: 1 }}>ROOM BENEFITS</div>
            <div style={{ fontSize: 11, marginBottom: 8 }}>
              {bookingRoom?.balcony && <span>Balcony • </span>}
              {bookingRoom?.view && <span>View • </span>}
              {bookingRoom?.airConditioning && <span>Air Conditioning • </span>}
              {bookingRoom?.flatScreenTV && <span>Flat-screen TV • </span>}
              {bookingRoom?.freeWifi && <span>Free Wifi • </span>}
              {bookingRoom?.electricKettle && <span>Electric Kettle • </span>}
              {bookingRoom?.wardrobe && <span>Wardrobe/Closet • </span>}
              {bookingRoom?.clothesRack && <span>Clothes Rack • </span>}
              {bookingRoom?.fan && <span>Fan • </span>}
              {/* New benefits */}
              {bookingRoom?.freeParking && <span>Free Parking • </span>}
              {bookingRoom?.fitnessCenter && <span>Fitness Center • </span>}
              {bookingRoom?.nonSmoking && <span>Non-smoking Rooms • </span>}
              {bookingRoom?.beachfront && <span>Beachfront • </span>}
              {bookingRoom?.roomService && <span>Room Service • </span>}
              {bookingRoom?.familyRoom && <span>Family Rooms • </span>}
              {bookingRoom?.bar && <span>Bar • </span>}
              {bookingRoom?.breakfast && <span>Breakfast • </span>}
              {bookingRoom?.facilities && <span>{bookingRoom.facilities}</span>}
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
                Booking Confirmed
              </span>
            </div>
            <div style={{ fontSize: 12, textAlign: 'center', margin: '16px 0' }}>
              We look forward to your stay!
            </div>
            <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
            <div style={{ fontSize: 10, textAlign: 'center', marginTop: 12 }}>---</div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBookingReceipt(false)}>Close</Button>
          <Button onClick={handlePrintBookingReceipt} variant="contained">Print</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError('')}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
}; 
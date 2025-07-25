import React, { useEffect, useState, useRef } from 'react';
import { AppBar, Toolbar, Typography, Button, TextField, InputAdornment, Paper, List, ListItem, ListItemText } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchIcon from '@mui/icons-material/Search';

// Add prop types for stylability and search handler
interface TopbarProps {
  onSearch?: (query: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearch, className, style }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dateTime, setDateTime] = useState(new Date());
  const [search, setSearch] = useState('');

  // Map keywords to routes
  const keywordRouteMap: { [key: string]: string } = {
    rooms: '/rooms',
    room: '/rooms',
    payments: '/payments',
    payment: '/payments',
    users: '/users',
    user: '/users',
    menu: '/menu',
    order: '/order',
    orders: '/order-history',
    dashboard: '/dashboard',
    report: '/reports',
    reports: '/reports',
    inventory: '/inventory',
  };

  // List of search options
  const searchOptions = [
    { label: 'Dashboard', keywords: ['dashboard', 'home'], route: '/dashboard' },
    { label: 'Rooms', keywords: ['rooms', 'room'], route: '/rooms' },
    { label: 'Payments', keywords: ['payments', 'payment'], route: '/payments' },
    { label: 'Users', keywords: ['users', 'user', 'staff'], route: '/users' },
    { label: 'Menu', keywords: ['menu', 'food', 'items'], route: '/menu' },
    { label: 'Order', keywords: ['order'], route: '/order' },
    { label: 'Order History', keywords: ['orders', 'order history', 'history'], route: '/order-history' },
    { label: 'Reports', keywords: ['reports', 'report'], route: '/reports' },
    { label: 'Inventory', keywords: ['inventory', 'stock'], route: '/inventory' },
  ];

  // Fuzzy/partial match function
  function getSuggestions(query: string) {
    if (!query) return [];
    const q = query.toLowerCase();
    return searchOptions.filter(opt =>
      opt.keywords.some(k => k.includes(q) || q.includes(k)) ||
      opt.label.toLowerCase().includes(q)
    );
  }

  const [suggestions, setSuggestions] = useState<typeof searchOptions>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search) {
      setSuggestions(getSuggestions(search));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setActiveSuggestion(-1);
  }, [search]);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  // Handle Enter, ArrowUp, ArrowDown, Escape
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        navigate(suggestions[activeSuggestion].route);
        setSearch('');
        setShowSuggestions(false);
      } else if (suggestions.length === 1) {
        navigate(suggestions[0].route);
        setSearch('');
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (route: string) => {
    navigate(route);
    setSearch('');
    setShowSuggestions(false);
  };

  // Highlight match
  function highlight(text: string, query: string) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return <>
      {text.slice(0, idx)}<span style={{ background: '#ffe082', borderRadius: 2 }}>{text.slice(idx, idx + query.length)}</span>{text.slice(idx + query.length)}
    </>;
  }

  // Add time-based greeting
  function getGreeting() {
    const hour = dateTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <AppBar position="static" elevation={0} style={{ background: '#1976d2', boxShadow: 'none', marginLeft: 0, ...style }} className={className}>
      <Toolbar style={{ background: '#1976d2', minHeight: 64, paddingLeft: 0 }}>
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            inputRef={searchRef}
            onFocus={() => search && setShowSuggestions(true)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: '#1976d2' }} />
                </InputAdornment>
              ),
              style: { background: '#fff', borderRadius: 8 },
            }}
            style={{ width: 250 }}
            autoComplete="off"
          />
          {showSuggestions && (
            <Paper style={{ position: 'absolute', top: 40, left: 0, width: 250, zIndex: 10, maxHeight: 250, overflowY: 'auto' }}>
              <List dense>
                {suggestions.length === 0 && (
                  <ListItem>
                    <ListItemText primary={<span style={{ color: '#888' }}>No results found.</span>} />
                  </ListItem>
                )}
                {suggestions.map((opt, idx) => (
                  <ListItem
                    button
                    key={opt.route}
                    selected={idx === activeSuggestion}
                    onMouseDown={() => handleSuggestionClick(opt.route)}
                    style={{ background: idx === activeSuggestion ? '#e3f2fd' : undefined }}
                  >
                    <ListItemText primary={highlight(opt.label, search)} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </div>
        {user && (
          <Typography variant="body1" style={{ marginRight: 16, color: '#fff' }}>
            {`${getGreeting()}${user.name ? ', ' + user.name : ''}`}
          </Typography>
        )}
        <Typography variant="body2" style={{ marginRight: 16, color: '#fff' }}>
          {dateTime.toLocaleString()}
        </Typography>
        <Button color="inherit" onClick={handleLogout} component={Link} to="/login">
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}; 
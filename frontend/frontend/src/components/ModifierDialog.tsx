import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { MenuItem, CartItem } from '../types/menu';

interface ModifierDialogProps {
  open: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSubmit: (item: MenuItem, quantity: number, modifiers: NonNullable<CartItem['modifiers']>, specialInstructions: string) => void;
}

export const ModifierDialog: React.FC<ModifierDialogProps> = ({
  open,
  item,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState('medium');
  const [extras, setExtras] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleExtraToggle = (extra: string) => {
    setExtras(prev =>
      prev.includes(extra)
        ? prev.filter(e => e !== extra)
        : [...prev, extra]
    );
  };

  const handleSubmit = () => {
    if (!item) return;
    
    onSubmit(item, quantity, {
      spiceLevel,
      extras,
    }, specialInstructions);
    
    // Reset form
    setQuantity(1);
    setSpiceLevel('medium');
    setExtras([]);
    setSpecialInstructions('');
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6">{item.name}</Typography>
        <Typography variant="subtitle1" color="primary">
          ${Number(item.price).toFixed(2)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Quantity Selector */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1">Quantity:</Typography>
          <IconButton onClick={() => handleQuantityChange(-1)} size="small">
            <RemoveIcon />
          </IconButton>
          <Typography variant="h6">{quantity}</Typography>
          <IconButton onClick={() => handleQuantityChange(1)} size="small">
            <AddIcon />
          </IconButton>
        </Box>

        {/* Spice Level */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel>Spice Level</FormLabel>
          <RadioGroup
            value={spiceLevel}
            onChange={(e) => setSpiceLevel(e.target.value)}
          >
            <FormControlLabel value="mild" control={<Radio />} label="Mild" />
            <FormControlLabel value="medium" control={<Radio />} label="Medium" />
            <FormControlLabel value="hot" control={<Radio />} label="Hot" />
          </RadioGroup>
        </FormControl>

        {/* Extras */}
        <FormControl component="fieldset" sx={{ mb: 3 }}>
          <FormLabel>Extras</FormLabel>
          <Box>
            {['Cheese', 'Bacon', 'Mushrooms', 'Extra Sauce'].map((extra) => (
              <FormControlLabel
                key={extra}
                control={
                  <Checkbox
                    checked={extras.includes(extra)}
                    onChange={() => handleExtraToggle(extra)}
                  />
                }
                label={extra}
              />
            ))}
          </Box>
        </FormControl>

        {/* Special Instructions */}
        <TextField
          label="Special Instructions"
          multiline
          rows={3}
          fullWidth
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Add any special requests here..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add to Order (${(Number(item.price) * quantity).toFixed(2)})
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 
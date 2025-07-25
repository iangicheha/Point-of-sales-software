import React from 'react';
import { Button, Card, Grid } from '@mui/material';

const menuItems = [
  { id: 1, name: 'Burger', price: 10 },
  { id: 2, name: 'Pizza', price: 15 },
];

export const OrderMenu = ({ onAdd }: { onAdd: (item: any) => void }) => (
  <Grid container spacing={2}>
    {menuItems.map(item => (
      <Grid item xs={6} md={3} key={item.id}>
        <Card>
          <h3>{item.name}</h3>
          <p>${item.price}</p>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onAdd(item)}
            style={{ fontSize: 24, padding: 16 }}
          >
            Add
          </Button>
        </Card>
      </Grid>
    ))}
  </Grid>
); 
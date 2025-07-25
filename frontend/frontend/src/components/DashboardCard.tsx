import React from 'react';
import { Card } from '@mui/material';

export const DashboardCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card style={{ padding: 24, textAlign: 'center' }}>
    <h3>{title}</h3>
    <h1>{value}</h1>
  </Card>
); 
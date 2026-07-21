import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, Typography } from '@mui/material';
import { Package, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import api from '../api/axios';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    total_products: 0,
    entries_month: 0,
    exits_month: 0,
    total_transactions: 0
  });

  useEffect(() => {
    api.get('/api/inventory/metrics')
      .then(res => setMetrics(res.data))
      .catch(console.error);
  }, []);

  const metricCards = [
    { title: 'Total Productos', value: metrics.total_products, icon: <Package />, color: '#3b82f6' },
    { title: 'Entradas (Mes)', value: `+${metrics.entries_month}`, icon: <ArrowUpRight />, color: '#10b981' },
    { title: 'Salidas (Mes)', value: `-${metrics.exits_month}`, icon: <ArrowDownRight />, color: '#ef4444' },
    { title: 'Transacciones', value: metrics.total_transactions, icon: <Activity />, color: '#8b5cf6' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={4}>Visión General</Typography>
      
      <Grid container spacing={3}>
        {metricCards.map((m, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" mb={1}>{m.title}</Typography>
                <Typography variant="h4" fontWeight="bold">{m.value}</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${m.color}20`, color: m.color, display: 'flex' }}>
                {m.icon}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

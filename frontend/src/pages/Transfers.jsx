import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { Truck, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const { showSnackbar } = useSnackbar();

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/api/inventory/transfers/pending');
      setTransfers(res.data);
    } catch (error) {
      console.error("Error fetching transfers", error);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleReceive = async (id) => {
    try {
      await api.put(`/api/inventory/transfers/${id}/receive`);
      showSnackbar('Traslado recibido y sumado al inventario.', 'success');
      fetchTransfers();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error al recibir', 'error');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={4} gap={2}>
        <Truck size={28} />
        <Typography variant="h4" fontWeight="bold">En Tránsito</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', backgroundImage: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha de Emisión</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Destino</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="right">Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay mercancía en tránsito en este momento.</TableCell>
              </TableRow>
            ) : (
              transfers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell fontWeight="500">{row.product?.sku} - {row.product?.name}</TableCell>
                  <TableCell>{row.source_warehouse?.name}</TableCell>
                  <TableCell fontWeight="bold" color="primary.main">{row.destination_warehouse?.name}</TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color="secondary.main">
                      {row.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="contained" 
                      color="success" 
                      size="small"
                      startIcon={<CheckCircle size={16} />}
                      onClick={() => handleReceive(row.id)}
                    >
                      Recibir Mercancía
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';
import api from '../api/axios';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function TransferDialog({ open, onClose, onSuccess }) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    product_id: '',
    source_warehouse_id: '',
    destination_warehouse_id: '',
    quantity: '',
    reference: ''
  });

  useEffect(() => {
    if (open) {
      api.get('/api/inventory/products').then(res => setProducts(res.data)).catch(console.error);
      api.get('/api/inventory/warehouses').then(res => setWarehouses(res.data)).catch(console.error);
    }
  }, [open]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/inventory/transfers', {
        ...formData,
        product_id: parseInt(formData.product_id),
        source_warehouse_id: parseInt(formData.source_warehouse_id),
        destination_warehouse_id: parseInt(formData.destination_warehouse_id),
        quantity: parseFloat(formData.quantity)
      });
      showSnackbar('Traslado enviado a tránsito exitosamente.', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error al iniciar el traslado', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Traslado (Tránsito)</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            
            <TextField select label="Producto" name="product_id" value={formData.product_id} onChange={handleChange} fullWidth required>
              {products.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.sku} - {p.name}</MenuItem>
              ))}
            </TextField>
            
            <Box display="flex" gap={2}>
              <TextField select label="Almacén Origen" name="source_warehouse_id" value={formData.source_warehouse_id} onChange={handleChange} fullWidth required>
                {warehouses.map(w => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
              
              <TextField select label="Almacén Destino" name="destination_warehouse_id" value={formData.destination_warehouse_id} onChange={handleChange} fullWidth required>
                {warehouses.map(w => (
                  <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                ))}
              </TextField>
            </Box>
            
            <TextField label="Cantidad a Trasladar" name="quantity" type="number" inputProps={{ step: "any", min: "0.1" }} value={formData.quantity} onChange={handleChange} fullWidth required />
            <TextField label="Referencia (Ej: Guía de Remisión)" name="reference" value={formData.reference} onChange={handleChange} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" color="secondary" disabled={loading}>
            {loading ? 'Procesando...' : 'Enviar Traslado'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

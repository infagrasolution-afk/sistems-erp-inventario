import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, MenuItem } from '@mui/material';
import api from '../api/axios';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function ProductDialog({ open, onClose, onSuccess }) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: 0,
    category_id: ''
  });

  useEffect(() => {
    if (open) {
      api.get('/api/inventory/categories').then(res => setCategories(res.data)).catch(console.error);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/inventory/products', {
        ...formData,
        price: parseFloat(formData.price),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      });
      showSnackbar('Producto creado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error al crear producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo Producto</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField label="SKU (Código único)" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} fullWidth required />
            <TextField label="Nombre del Producto" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} fullWidth required />
            <TextField label="Precio Base" type="number" inputProps={{ step: "any", min: "0" }} value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} fullWidth required />
            <TextField select label="Categoría" value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} fullWidth>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>Guardar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

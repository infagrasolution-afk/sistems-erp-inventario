import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import api from '../api/axios';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function GenericDialog({ open, onClose, onSuccess, type }) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', detail: '' }); // detail is description for category, location for warehouse

  const isCategory = type === 'category';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isCategory ? '/api/inventory/categories' : '/api/inventory/warehouses';
      const payload = isCategory 
        ? { name: formData.name, description: formData.detail }
        : { name: formData.name, location: formData.detail };
        
      await api.post(endpoint, payload);
      showSnackbar(`${isCategory ? 'Categoría' : 'Almacén'} creado exitosamente`);
      onSuccess();
      onClose();
    } catch (error) {
      showSnackbar(`Error al crear ${isCategory ? 'categoría' : 'almacén'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo {isCategory ? 'Categoría' : 'Almacén'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={isCategory ? "Descripción (Opcional)" : "Ubicación (Opcional)"}
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
              fullWidth
            />
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

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material';
import api from '../api/axios';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function MovementDialog({ open, onClose, onSuccess }) {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    type: 'ENTRADA',
    quantity: '',
    unit_cost: 0,
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
      const res = await api.post('/api/inventory/movement', {
        ...formData,
        product_id: parseInt(formData.product_id),
        warehouse_id: parseInt(formData.warehouse_id),
        quantity: parseFloat(formData.quantity),
        unit_cost: parseFloat(formData.unit_cost)
      });
      showSnackbar(`Movimiento registrado. Nuevo stock total: ${res.data.new_stock}`, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showSnackbar(error.response?.data?.detail || 'Error al procesar el movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField select label="Tipo de Movimiento" name="type" value={formData.type} onChange={handleChange} fullWidth required>
              <MenuItem value="ENTRADA">ENTRADA (Ajuste o Compra)</MenuItem>
              <MenuItem value="SALIDA">SALIDA (Ajuste o Venta)</MenuItem>
              <MenuItem value="DEVOLUCION_CLIENTE">DEVOLUCIÓN DE CLIENTE (+)</MenuItem>
              <MenuItem value="DEVOLUCION_PROVEEDOR">DEVOLUCIÓN A PROVEEDOR (-)</MenuItem>
              <MenuItem value="MERMA">MERMA / PÉRDIDA (-)</MenuItem>
            </TextField>
            
            <TextField select label="Producto" name="product_id" value={formData.product_id} onChange={handleChange} fullWidth required>
              {products.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.sku} - {p.name} (Stock: {p.total_stock})</MenuItem>
              ))}
            </TextField>
            
            <TextField select label="Almacén" name="warehouse_id" value={formData.warehouse_id} onChange={handleChange} fullWidth required>
              {warehouses.map(w => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </TextField>
            
            <Box display="flex" gap={2}>
              <TextField label="Cantidad" name="quantity" type="number" inputProps={{ step: "any", min: "0.1" }} value={formData.quantity} onChange={handleChange} fullWidth required />
              <TextField label="Costo Unitario (Opcional)" name="unit_cost" type="number" inputProps={{ step: "any", min: "0" }} value={formData.unit_cost} onChange={handleChange} fullWidth />
            </Box>
            
            <TextField label="Referencia (Ej: Factura 123)" name="reference" value={formData.reference} onChange={handleChange} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

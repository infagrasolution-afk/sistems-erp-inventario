import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Plus, ArrowLeftRight, Settings, MapPin } from 'lucide-react';
import MovementDialog from '../components/MovementDialog';
import ProductDialog from '../components/ProductDialog';
import GenericDialog from '../components/GenericDialog';
import TransferDialog from '../components/TransferDialog';
import api from '../api/axios';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  
  // Modals state
  const [openMovement, setMovement] = useState(false);
  const [openTransfer, setTransfer] = useState(false);
  const [openProduct, setProduct] = useState(false);
  const [openCategory, setCategory] = useState(false);
  const [openWarehouse, setWarehouse] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/inventory/products');
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">Gestión de Inventario</Typography>
        <Box gap={2} display="flex" flexWrap="wrap">
          <Button variant="outlined" color="inherit" startIcon={<Settings size={18} />} onClick={() => setCategory(true)}>
            Nueva Categoría
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<MapPin size={18} />} onClick={() => setWarehouse(true)}>
            Nuevo Almacén
          </Button>
          <Button variant="outlined" startIcon={<Plus size={18} />} onClick={() => setProduct(true)}>
            Nuevo Producto
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
            onClick={() => setTransfer(true)}
          >
            Traslado
          </Button>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<ArrowLeftRight size={18} />}
            onClick={() => setMovement(true)}
          >
            Movimiento
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', backgroundImage: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Precio Base</TableCell>
              <TableCell align="right">Stock Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay productos registrados.</TableCell>
              </TableRow>
            ) : (
              products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell fontWeight="500">{row.name}</TableCell>
                  <TableCell>{row.category?.name || 'Sin Categoría'}</TableCell>
                  <TableCell>${row.price}</TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={row.total_stock > 0 ? 'success.main' : 'error.main'}
                    >
                      {row.total_stock}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <MovementDialog open={openMovement} onClose={() => setMovement(false)} onSuccess={fetchProducts} />
      <TransferDialog open={openTransfer} onClose={() => setTransfer(false)} onSuccess={fetchProducts} />
      <ProductDialog open={openProduct} onClose={() => setProduct(false)} onSuccess={fetchProducts} />
      <GenericDialog open={openCategory} onClose={() => setCategory(false)} type="category" onSuccess={() => {}} />
      <GenericDialog open={openWarehouse} onClose={() => setWarehouse(false)} type="warehouse" onSuccess={() => {}} />
    </Box>
  );
}

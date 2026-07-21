import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { ShieldAlert, Plus } from 'lucide-react';
import api from '../api/axios';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function AdminPanel() {
  const [empresas, setEmpresas] = useState([]);
  const { showSnackbar } = useSnackbar();

  const fetchEmpresas = async () => {
    try {
      const res = await api.get('/api/admin/empresas');
      setEmpresas(res.data);
    } catch (error) {
      console.error(error);
      showSnackbar("Error al cargar inquilinos (Solo Súper Admin)", 'error');
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldAlert color="#ef4444" size={32} /> Panel de Control Súper Admin
        </Typography>
        <Button variant="contained" color="error" startIcon={<Plus />} onClick={() => alert("Próximamente: Crear Empresa")}>
          Nuevo Cliente
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nombre Empresa</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>RUT/NIT</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Usuario Administrador</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map((emp) => (
              <TableRow key={emp.id} hover>
                <TableCell>{emp.id}</TableCell>
                <TableCell>{emp.nombre}</TableCell>
                <TableCell>{emp.rut_o_nit}</TableCell>
                <TableCell>{emp.admin_username}</TableCell>
                <TableCell>
                  <Chip 
                    label={emp.is_active ? "Activo" : "Inactivo"} 
                    color={emp.is_active ? "success" : "default"} 
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
            {empresas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay empresas registradas.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

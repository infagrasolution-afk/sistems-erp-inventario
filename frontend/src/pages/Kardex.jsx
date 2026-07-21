import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, Button, Tooltip, Chip } from '@mui/material';
import { Search, FileText, Download } from 'lucide-react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Kardex() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, ENTRADA, SALIDA, TRASLADO, DEVOLUCION, MERMA

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/inventory/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'TRASLADO') matchesType = t.type.includes('TRASLADO');
      else if (typeFilter === 'DEVOLUCION') matchesType = t.type.includes('DEVOLUCION');
      else matchesType = t.type === typeFilter;
    }
    
    return matchesSearch && matchesType;
  });

  const exportToExcel = () => {
    const wsData = filteredTransactions.map(t => ({
      'Fecha': new Date(t.created_at).toLocaleString(),
      'Operador': t.user.username,
      'SKU': t.product.sku,
      'Producto': t.product.name,
      'Almacén': t.warehouse.name,
      'Tipo': t.type,
      'Cantidad': t.quantity,
      'Referencia': t.reference || '-'
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kardex");
    XLSX.writeFile(wb, "Reporte_Kardex.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Reporte de Auditoría (Kardex)', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de exportación: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Fecha", "Operador", "SKU", "Producto", "Almacén", "Tipo", "Cantidad", "Referencia"];
    const tableRows = [];

    filteredTransactions.forEach(t => {
      const rowData = [
        new Date(t.created_at).toLocaleString(),
        t.user.username,
        t.product.sku,
        t.product.name,
        t.warehouse.name,
        t.type,
        t.quantity,
        t.reference || '-'
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save("Reporte_Kardex.pdf");
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">Kardex (Historial de Movimientos)</Typography>
        
        <Box display="flex" gap={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar producto o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
            }}
            sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}
          />
          <Tooltip title="Exportar a Excel">
            <Button variant="outlined" color="success" onClick={exportToExcel} sx={{ minWidth: '40px', p: 1 }}>
              <Download size={20} />
            </Button>
          </Tooltip>
          <Tooltip title="Exportar a PDF">
            <Button variant="outlined" color="error" onClick={exportToPDF} sx={{ minWidth: '40px', p: 1 }}>
              <FileText size={20} />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        <Chip label="Todos" onClick={() => setTypeFilter('ALL')} color={typeFilter === 'ALL' ? 'primary' : 'default'} clickable />
        <Chip label="Entradas" onClick={() => setTypeFilter('ENTRADA')} color={typeFilter === 'ENTRADA' ? 'success' : 'default'} clickable />
        <Chip label="Salidas" onClick={() => setTypeFilter('SALIDA')} color={typeFilter === 'SALIDA' ? 'error' : 'default'} clickable />
        <Chip label="Traslados" onClick={() => setTypeFilter('TRASLADO')} color={typeFilter === 'TRASLADO' ? 'warning' : 'default'} clickable />
        <Chip label="Devoluciones" onClick={() => setTypeFilter('DEVOLUCION')} color={typeFilter === 'DEVOLUCION' ? 'secondary' : 'default'} clickable />
        <Chip label="Mermas" onClick={() => setTypeFilter('MERMA')} color={typeFilter === 'MERMA' ? 'error' : 'default'} variant={typeFilter === 'MERMA' ? 'filled' : 'outlined'} clickable />
      </Box>

      <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.02)', backgroundImage: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha y Hora</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Almacén</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Referencia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay movimientos registrados.</TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                  <TableCell>{row.user?.username}</TableCell>
                  <TableCell fontWeight="500">{row.product?.sku} - {row.product?.name}</TableCell>
                  <TableCell>{row.warehouse?.name}</TableCell>
                  <TableCell>
                    <Box 
                      component="span" 
                      px={1} py={0.5} 
                      borderRadius={1} 
                      bgcolor={row.type === 'ENTRADA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                      color={row.type === 'ENTRADA' ? '#10b981' : '#ef4444'}
                      fontWeight="bold"
                      fontSize="0.75rem"
                    >
                      {row.type}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={row.type === 'ENTRADA' ? 'success.main' : 'error.main'}
                    >
                      {row.type === 'ENTRADA' ? '+' : '-'}{row.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.reference || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

import { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  TextField,
  Button,
  Chip,
  Skeleton,
  Snackbar,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import { serviceCategories } from '../../data/services';
import { setServiceDiscount, removeServiceDiscount } from '../../lib/adminService';

const fontFamily = '"Georgia", serif';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

export default function ServiceDiscountsSection({ serviceDiscounts, loading, onRefresh }) {
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState({});
  const [snack, setSnack] = useState('');

  const getEdit = (serviceId) => {
    if (edits[serviceId]) return edits[serviceId];
    const existing = serviceDiscounts?.[serviceId];
    return {
      enabled: existing?.enabled || false,
      discountPrice: existing?.discountPrice ?? '',
      discountLabel: existing?.discountLabel ?? '',
    };
  };

  const updateEdit = (serviceId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [serviceId]: { ...getEdit(serviceId), [field]: value },
    }));
  };

  const handleSave = async (serviceId) => {
    const edit = getEdit(serviceId);
    setSaving((prev) => ({ ...prev, [serviceId]: true }));
    try {
      if (!edit.enabled) {
        await removeServiceDiscount(serviceId);
      } else {
        await setServiceDiscount(serviceId, {
          enabled: true,
          discountPrice: parseFloat(edit.discountPrice) || 0,
          discountLabel: edit.discountLabel || '',
        });
      }
      setSnack('Discount saved');
      await onRefresh();
      setEdits((prev) => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
    } catch (err) {
      console.error('Save service discount error:', err);
      setSnack('Error saving discount');
    } finally {
      setSaving((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, mb: 3 }}>
        Service Discounts
      </Typography>

      {serviceCategories.map((cat) => {
        const activeCount = cat.services.filter(
          (s) => serviceDiscounts?.[s.id]?.enabled
        ).length;

        return (
          <Accordion key={cat.id} sx={{ mb: 1, borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Typography sx={{ fontFamily, fontWeight: 700, flex: 1 }}>
                  {cat.title}
                </Typography>
                <Chip
                  label={`${cat.services.length} services`}
                  size="small"
                />
                {activeCount > 0 && (
                  <Chip
                    label={`${activeCount} on sale`}
                    size="small"
                    sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      {['Service', 'Original Price', 'Discount', 'Sale Price', 'Label', ''].map((h) => (
                        <TableCell key={h} sx={{ fontFamily, fontWeight: 700 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cat.services.map((service) => {
                      const edit = getEdit(service.id);
                      const isSaving = saving[service.id];
                      const hasChanges = !!edits[service.id];

                      return (
                        <TableRow key={service.id} hover>
                          <TableCell sx={{ fontFamily, fontWeight: 600 }}>
                            {service.name}
                          </TableCell>
                          <TableCell sx={{ fontFamily }}>
                            {formatNaira(service.price)}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={edit.enabled}
                              onChange={(e) => updateEdit(service.id, 'enabled', e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2e7d32' },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {edit.enabled ? (
                              <TextField
                                size="small"
                                type="number"
                                value={edit.discountPrice}
                                onChange={(e) => updateEdit(service.id, 'discountPrice', e.target.value)}
                                sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                InputProps={{ sx: { fontFamily, fontSize: '0.85rem' } }}
                              />
                            ) : (
                              <Typography sx={{ color: '#999', fontSize: '0.85rem' }}>—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {edit.enabled ? (
                              <TextField
                                size="small"
                                placeholder="e.g. Easter Sale"
                                value={edit.discountLabel}
                                onChange={(e) => updateEdit(service.id, 'discountLabel', e.target.value)}
                                sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                InputProps={{ sx: { fontFamily, fontSize: '0.85rem' } }}
                              />
                            ) : (
                              <Typography sx={{ color: '#999', fontSize: '0.85rem' }}>—</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant={hasChanges ? 'contained' : 'outlined'}
                              startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
                              disabled={isSaving}
                              onClick={() => handleSave(service.id)}
                              sx={{
                                fontFamily,
                                fontSize: '0.75rem',
                                textTransform: 'none',
                                ...(hasChanges
                                  ? { backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }
                                  : { borderColor: '#ccc', color: '#777' }),
                              }}
                            >
                              {isSaving ? 'Saving…' : 'Save'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack('')} severity="success" sx={{ borderRadius: 2 }}>
          {snack}
        </Alert>
      </Snackbar>
    </Box>
  );
}

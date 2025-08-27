import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../utils/api';

const HolidayManagementScreen = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState(null);
  
  const [name, setName] = useState('');
  const [date, setDate] = useState(null);
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      fetchHolidays();
    }
  }, [userInfo, navigate]);
  
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await api.get('/holidays', config);
      setHolidays(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch holidays');
      setLoading(false);
    }
  };
  
  const validateHoliday = () => {
    const errors = {};
    let hasError = false;
    
    if (!name.trim()) {
      errors.name = 'Holiday name is required';
      hasError = true;
    }
    
    if (!date) {
      errors.date = 'Date is required';
      hasError = true;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        errors.date = 'Cannot add holidays for past dates';
        hasError = true;
      }
    }
    
    setValidationErrors(errors);
    return !hasError;
  };
  
  const deleteHandler = (id) => {
    setHolidayToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await api.delete(`/holidays/${holidayToDelete}`, config);
      setShowDeleteModal(false);
      setSuccess('Holiday deleted successfully');
      fetchHolidays();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete holiday');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };
  
  const addHolidayHandler = async () => {
    if (!validateHoliday()) {
      return;
    }
    
    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await api.post('/holidays', { 
          name, 
          date: date.toISOString().split('T')[0], 
          description 
      }, config);
      
      setShowAddModal(false);
      setName('');
      setDate(null);
      setDescription('');
      setValidationErrors({});
      setSuccess('Holiday added successfully');
      fetchHolidays();
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add holiday');
    } finally {
      setLoading(false);
    }
  };
  
  const handleModalClose = () => {
    setShowAddModal(false);
    setName('');
    setDate(null);
    setDescription('');
    setValidationErrors({});
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/schedules')}
          sx={{ mb: 2 }}
        >
          Back to Schedules
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Holiday Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Add holidays to prevent attendance being recorded on non-school days.
          Students scanned on holidays will not be marked as absent.
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              School Holidays
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              Add Holiday
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>HOLIDAY</TableCell>
                    <TableCell>DATE</TableCell>
                    <TableCell>DESCRIPTION</TableCell>
                    <TableCell align="right">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No holidays found
                      </TableCell>
                    </TableRow>
                  ) : (
                    holidays.map((holiday) => (
                      <TableRow key={holiday._id}>
                        <TableCell>{holiday.name}</TableCell>
                        <TableCell>
                          {new Date(holiday.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{holiday.description || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="error"
                            onClick={() => deleteHandler(holiday._id)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Add Holiday Dialog */}
      <Dialog open={showAddModal} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Holiday</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Holiday Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
            />
            
              <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!validationErrors.date}
                    helperText={validationErrors.date}
                  />
                )}
              />
            
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={addHolidayHandler}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Adding...' : 'Add Holiday'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this holiday? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HolidayManagementScreen; 
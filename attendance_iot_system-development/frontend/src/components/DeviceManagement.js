import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormHelperText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const DeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    deviceId: '',
    class: '',
    active: true
  });

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    } else {
      fetchDevices();
      fetchClasses();
    }
  }, [user, navigate]);

  const fetchDevices = async () => {
    try {
      setError(null);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/rfid-devices', config);
      setDevices(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch devices');
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/classes', config);
      setClasses(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.deviceId || !formData.name || !formData.location) {
      setError('Device ID, Name, and Location are required fields');
      return;
    }

    try {
      setError(null);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const deviceData = {
        deviceId: formData.deviceId.trim(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        class: formData.class || null,
        active: formData.active
      };

      if (editDevice) {
        const { data } = await axios.put(
          `http://localhost:5000/api/rfid-devices/${editDevice._id}`,
          deviceData,
          config
        );
        setSuccess('Device updated successfully');
        setDevices(devices.map(d => d._id === editDevice._id ? data : d));
      } else {
        const { data } = await axios.post('http://localhost:5000/api/rfid-devices', deviceData, config);
        setSuccess('Device created successfully');
        setDevices([...devices, data]);
      }

      setDialogOpen(false);
      setEditDevice(null);
      setFormData({
        name: '',
        location: '',
        deviceId: '',
        class: '',
        active: true
      });
    } catch (err) {
      console.error('Save device error:', err);
      if (err.response?.data?.message?.includes('duplicate key')) {
        setError('A device with this Device ID already exists. Please use a different Device ID.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to save device. Please check your input and try again.');
      }
    }
  };

  const handleEdit = (device) => {
    setEditDevice(device);
    setFormData({
      name: device.name || '',
      location: device.location || '',
      deviceId: device.deviceId || '',
      class: device.class?._id || '',
      active: device.active !== undefined ? device.active : true
    });
    setDialogOpen(true);
  };

  const handleDelete = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        setError(null);
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.delete(`http://localhost:5000/api/rfid-devices/${deviceId}`, config);
        setSuccess('Device deleted successfully');
        fetchDevices();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete device');
      }
    }
  };

  if (!user) {
    return <Alert severity="error">Please log in to view devices</Alert>;
  }

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">RFID Device Management</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setEditDevice(null);
            setFormData({
              name: '',
              location: '',
              deviceId: '',
              class: '',
              active: true
            });
            setDialogOpen(true);
          }}
        >
          Add New Device
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Assigned Class</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No devices found
                </TableCell>
              </TableRow>
            ) : (
              devices.map((device) => (
                <TableRow key={device._id}>
                  <TableCell>{device.deviceId}</TableCell>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>{device.class?.name || 'Not Assigned'}</TableCell>
                  <TableCell>{device.active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(device)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(device._id)}
                      size="small"
                      color="error"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Device Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  error={!formData.name}
                  helperText={!formData.name ? 'Device name is required' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Device ID"
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  required
                  error={!formData.deviceId}
                  helperText={!formData.deviceId ? 'Device ID is required' : 'This must be unique'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  error={!formData.location}
                  helperText={!formData.location ? 'Location is required' : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="class-label">Assigned Class</InputLabel>
                  <Select
                    labelId="class-label"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    label="Assigned Class"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {!formData.class ? 'Device must be assigned to a class for attendance tracking' : ''}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.name || !formData.deviceId || !formData.location}
            >
              {editDevice ? 'Update' : 'Add'} Device
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DeviceManagement; 
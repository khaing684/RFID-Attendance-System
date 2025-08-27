import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Container,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Alert,
    Box,
    Switch,
    FormControlLabel,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DevicesIcon from '@mui/icons-material/Devices';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import axios from 'axios';

const DeviceEditScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        deviceId: '',
        name: '',
        location: '',
        class: '',
        active: true
    });
    
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        
        fetchClasses();
        if (id && id !== 'create') {
            fetchDeviceDetails();
        }
    }, [id, userInfo, navigate]);

    const fetchClasses = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            
            const { data } = await axios.get(
                'http://localhost:5000/api/classes',
                config
            );
            
            setClasses(data);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };
    
    const fetchDeviceDetails = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            
            const { data } = await axios.get(
                `http://localhost:5000/api/rfid-devices/${id}`,
                config
            );
            
            setFormData({
                deviceId: data.deviceId || '',
                name: data.name || '',
                location: data.location || '',
                class: data.class?._id || '',
                active: data.active !== undefined ? data.active : true
            });
            setLoading(false);
        } catch (err) {
            setError('Error fetching device details');
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.deviceId.trim()) errors.deviceId = 'Device ID is required';
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.location.trim()) errors.location = 'Location is required';
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear validation error for the changed field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            
            const deviceData = {
                deviceId: formData.deviceId.trim(),
                name: formData.name.trim(),
                location: formData.location.trim(),
                class: formData.class || null,
                active: formData.active
            };
            
            if (id && id !== 'create') {
                await axios.put(
                    `http://localhost:5000/api/rfid-devices/${id}`,
                    deviceData,
                    config
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/rfid-devices',
                    deviceData,
                    config
                );
            }
            
            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/devices');
            }, 1500);
        } catch (err) {
            console.error('Error saving device:', err);
            setError(
                err.response?.data?.message || 'Error saving device. Please check all fields and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Button
                    onClick={() => navigate('/admin/devices')}
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    Back to Devices
                </Button>
                <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
                    {id && id !== 'create' ? 'Edit RFID Device' : 'Add RFID Device'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {id && id !== 'create' 
                        ? 'Update device details, location, and class assignment' 
                        : 'Register a new RFID device in the system'
                    }
                </Typography>
            </Box>

            <Card elevation={3}>
                <CardContent>
                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 3 }}>Device saved successfully!</Alert>}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Device Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <DevicesIcon color="primary" />
                                    Device Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Device ID"
                                            name="deviceId"
                                            value={formData.deviceId}
                                            onChange={handleChange}
                                            error={!!validationErrors.deviceId}
                                            helperText={validationErrors.deviceId || 'Unique identifier for the RFID reader'}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Device Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            error={!!validationErrors.name}
                                            helperText={validationErrors.name || 'A descriptive name for the device'}
                                            required
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            {/* Location */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon color="primary" />
                                    Location
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    error={!!validationErrors.location}
                                    helperText={validationErrors.location || 'E.g., "Building A, Room 101 Door"'}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            {/* Class Assignment */}
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupIcon color="primary" />
                                    Class Assignment
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Assigned Class</InputLabel>
                                            <Select
                                                name="class"
                                                value={formData.class}
                                                onChange={handleChange}
                                                label="Assigned Class"
                                            >
                                                <MenuItem value="">
                                                    <em>No Class Assignment</em>
                                                </MenuItem>
                                                {classes.map((cls) => (
                                                    <MenuItem key={cls._id} value={cls._id}>
                                                        {cls.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.active}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        active: e.target.checked
                                                    }))}
                                                    name="active"
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="body1">Device Active</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Toggle to enable/disable device
                                                    </Typography>
                                                </Box>
                                            }
                                            sx={{ mt: 1 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => navigate('/admin/devices')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (id && id !== 'create' ? 'Update Device' : 'Add Device')}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
};

export default DeviceEditScreen; 
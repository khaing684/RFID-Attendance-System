import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Grid,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import EventIcon from '@mui/icons-material/Event';
import axios from 'axios';

const SubjectEditScreen = () => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        weeklyHours: 1,
        totalHours: 0,
        semester: 1,
        year: new Date().getFullYear(),
        classes: []
    });
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const navigate = useNavigate();
    const { id } = useParams();
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }
        fetchClasses();
        if (id && id !== 'create') {
            fetchSubject();
        }
    }, [id, userInfo, navigate]);

    const fetchClasses = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.get('http://localhost:5000/api/classes', config);
            setClasses(data);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };

    const fetchSubject = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `http://localhost:5000/api/subjects/${id}`,
                config
            );

            setFormData({
                name: data.name || '',
                code: data.code || '',
                description: data.description || '',
                weeklyHours: data.weeklyHours || 1,
                totalHours: data.totalHours || 0,
                semester: data.semester || 1,
                year: data.year || new Date().getFullYear(),
                classes: data.classes?.map(c => c._id) || []
            });
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching subject');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Subject name is required';
        if (!formData.code.trim()) errors.code = 'Subject code is required';
        if (!formData.weeklyHours || formData.weeklyHours < 1) errors.weeklyHours = 'Weekly hours must be at least 1';
        if (!formData.totalHours || formData.totalHours < 0) errors.totalHours = 'Total hours must be at least 0';
        if (!formData.semester) errors.semester = 'Semester is required';
        if (!formData.year) errors.year = 'Year is required';
        
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

            const subjectData = {
                name: formData.name.trim(),
                code: formData.code.trim(),
                description: formData.description.trim(),
                weeklyHours: Number(formData.weeklyHours),
                totalHours: Number(formData.totalHours),
                semester: Number(formData.semester),
                year: Number(formData.year),
                classes: formData.classes
            };

            if (id && id !== 'create') {
                await axios.put(
                    `http://localhost:5000/api/subjects/${id}`,
                    subjectData,
                    config
                );
            } else {
                await axios.post(
                    'http://localhost:5000/api/subjects',
                    subjectData,
                    config
                );
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/subjects');
            }, 2000);
        } catch (err) {
            console.error('Error saving subject:', err);
            setError(err.response?.data?.message || 'Error saving subject');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
        </Box>
    );

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    to="/admin/subjects"
                    startIcon={<ArrowBackIcon />}
                    sx={{ mb: 2 }}
                >
                    Back to Subjects
                </Button>
                <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
                    {id && id !== 'create' ? 'Edit Subject' : 'Create Subject'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {id && id !== 'create' 
                        ? 'Update subject details, hours, and class assignments' 
                        : 'Add a new subject to your curriculum'
                    }
                </Typography>
            </Box>

            <Card elevation={3}>
                <CardContent>
                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Subject successfully {id ? 'updated' : 'created'}!
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon color="primary" />
                                    Basic Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Subject Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            error={!!validationErrors.name}
                                            helperText={validationErrors.name}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="Subject Code"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleChange}
                                            error={!!validationErrors.code}
                                            helperText={validationErrors.code}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Description"
                                            name="description"
                                            multiline
                                            rows={3}
                                            value={formData.description}
                                            onChange={handleChange}
                                            placeholder="Enter subject description (optional)"
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon color="primary" />
                                    Hours
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            type="number"
                                            label="Weekly Hours"
                                            name="weeklyHours"
                                            value={formData.weeklyHours}
                                            onChange={handleChange}
                                            error={!!validationErrors.weeklyHours}
                                            helperText={validationErrors.weeklyHours}
                                            inputProps={{ min: 1 }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            type="number"
                                            label="Total Hours"
                                            name="totalHours"
                                            value={formData.totalHours}
                                            onChange={handleChange}
                                            error={!!validationErrors.totalHours}
                                            helperText={validationErrors.totalHours}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EventIcon color="primary" />
                                    Term Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth required error={!!validationErrors.semester}>
                                            <InputLabel>Semester</InputLabel>
                                            <Select
                                                name="semester"
                                                value={formData.semester}
                                                label="Semester"
                                                onChange={handleChange}
                                            >
                                                <MenuItem value={1}>First Semester</MenuItem>
                                                <MenuItem value={2}>Second Semester</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            type="number"
                                            label="Year"
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            error={!!validationErrors.year}
                                            helperText={validationErrors.year}
                                            inputProps={{ min: 2000 }}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SchoolIcon color="primary" />
                                    Class Assignment
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Assigned Classes</InputLabel>
                                    <Select
                                        multiple
                                        name="classes"
                                        value={formData.classes}
                                        onChange={handleChange}
                                        label="Assigned Classes"
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => {
                                                    const cls = classes.find(c => c._id === value);
                                                    return (
                                                        <Chip 
                                                            key={value} 
                                                            label={cls ? cls.name : value}
                                                            size="small"
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {classes.map((cls) => (
                                            <MenuItem key={cls._id} value={cls._id}>
                                                {cls.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="large"
                                onClick={() => navigate('/admin/subjects')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (id && id !== 'create' ? 'Update Subject' : 'Create Subject')}
                            </Button>
                        </Box>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
};

export default SubjectEditScreen; 
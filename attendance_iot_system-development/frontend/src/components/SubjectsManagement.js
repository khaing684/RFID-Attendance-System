import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
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
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
// eslint-disable-next-line no-unused-vars
import api from '../utils/api';

const SubjectsManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        classes: [],
        weeklyHours: '',
        totalHours: '',
        semester: '',
        year: '',
    });
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);

    const fetchClasses = useCallback(async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const response = await api.get('/classes', config);
            setClasses(response.data);
        } catch (error) {
            showAlert('Error fetching classes', 'error');
        }
    }, [userInfo]);

    const fetchSubjects = useCallback(async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const response = await api.get('/subjects', config);
            setSubjects(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                showAlert(error.response?.data?.message || 'Error fetching subjects', 'error');
            }
        }
    }, [userInfo, navigate]);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
        } else {
            fetchSubjects();
            fetchClasses();
        }
    }, [userInfo, navigate, fetchSubjects, fetchClasses]);

    const handleOpen = () => {
        setOpen(true);
        setEditingSubject(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            classes: [],
            weeklyHours: '',
            totalHours: '',
            semester: '',
            year: '',
        });
    };

    const handleClose = () => {
        setOpen(false);
        setEditingSubject(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            classes: [],
            weeklyHours: '',
            totalHours: '',
            semester: '',
            year: '',
        });
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            code: subject.code,
            description: subject.description || '',
            classes: subject.classes.map(c => c._id),
            weeklyHours: subject.weeklyHours || '',
            totalHours: subject.totalHours || '',
            semester: subject.semester || '',
            year: subject.year || '',
        });
        setOpen(true);
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ open: true, message, severity });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            if (editingSubject) {
                await api.put(`/subjects/${editingSubject._id}`, formData, config);
                showAlert('Subject updated successfully');
            } else {
                await api.post('/subjects', formData, config);
                showAlert('Subject created successfully');
            }
            handleClose();
            fetchSubjects();
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                showAlert(error.response?.data?.message || 'Error saving subject', 'error');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                };
                await api.delete(`/subjects/${id}`, config);
                showAlert('Subject deleted successfully');
                fetchSubjects();
            } catch (error) {
                if (error.response?.status === 401) {
                    navigate('/login');
                } else {
                    showAlert(error.response?.data?.message || 'Error deleting subject', 'error');
                }
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!userInfo) {
        return null;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Subjects Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpen}
                >
                    Add Subject
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Classes</TableCell>
                            <TableCell>Hours (Weekly/Total)</TableCell>
                            <TableCell>Semester</TableCell>
                            <TableCell>Year</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subjects.map((subject) => (
                            <TableRow key={subject._id}>
                                <TableCell>{subject.code}</TableCell>
                                <TableCell>{subject.name}</TableCell>
                                <TableCell>
                                    <Stack direction="row" spacing={1}>
                                        {subject.classes.map((cls) => (
                                            <Chip key={cls._id} label={cls.name} size="small" />
                                        ))}
                                    </Stack>
                                </TableCell>
                                <TableCell>{subject.weeklyHours}/{subject.totalHours}</TableCell>
                                <TableCell>{subject.semester}</TableCell>
                                <TableCell>{subject.year}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleEdit(subject)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(subject._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Subject Code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Subject Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={3}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Classes</InputLabel>
                            <Select
                                multiple
                                name="classes"
                                value={Array.isArray(formData.classes) ? formData.classes : []}
                                onChange={handleChange}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const cls = classes.find(c => c._id === value);
                                            return cls ? (
                                                <Chip key={value} label={cls.name} />
                                            ) : null;
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
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="number"
                                label="Weekly Hours"
                                name="weeklyHours"
                                value={formData.weeklyHours}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                            <TextField
                                type="number"
                                label="Total Hours"
                                name="totalHours"
                                value={formData.totalHours}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="number"
                                label="Semester"
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                            <TextField
                                type="number"
                                label="Year"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingSubject ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
            >
                <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SubjectsManagement; 
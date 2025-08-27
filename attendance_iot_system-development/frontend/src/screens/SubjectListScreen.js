import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    TextField,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Checkbox,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Chip,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from 'axios';

const SubjectListScreen = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
        } else {
        fetchSubjects();
        }
    }, [userInfo, navigate]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.get('http://localhost:5000/api/subjects', config);
            setSubjects(data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setSubjectToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            await axios.delete(`http://localhost:5000/api/subjects/${subjectToDelete}`, config);
            setSuccess('Subject deleted successfully');
            fetchSubjects();
            setDeleteDialogOpen(false);
            setSubjectToDelete(null);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete subject');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedSubjects(filteredSubjects.map(subject => subject._id));
        } else {
            setSelectedSubjects([]);
        }
    };

    const handleSelectSubject = (subjectId) => {
        setSelectedSubjects(prev => {
            if (prev.includes(subjectId)) {
                return prev.filter(id => id !== subjectId);
            } else {
                return [...prev, subjectId];
            }
        });
    };

    const handleBulkDelete = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            await axios.post('http://localhost:5000/api/subjects/bulk-delete', 
                { subjectIds: selectedSubjects }, 
                config
            );
            setSuccess('Selected subjects deleted successfully');
            setSelectedSubjects([]);
            fetchSubjects();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete subjects');
        } finally {
            setLoading(false);
        }
    };

    const filteredSubjects = subjects.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
                    Subjects Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your school subjects, assign classes, and track hours
                </Typography>
            </Box>

            {/* Action Bar */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2 
                    }}>
                        <TextField
                            placeholder="Search subjects..."
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ minWidth: 300 }}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {selectedSubjects.length > 0 && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={handleBulkDelete}
                                    disabled={loading}
                                    startIcon={<DeleteIcon />}
                                >
                                    Delete Selected ({selectedSubjects.length})
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/admin/subjects/create')}
                            >
                                Add Subject
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            {/* Subjects Table */}
            <Card>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedSubjects.length === filteredSubjects.length && filteredSubjects.length > 0}
                                                onChange={handleSelectAll}
                                                indeterminate={selectedSubjects.length > 0 && selectedSubjects.length < filteredSubjects.length}
                                            />
                                        </TableCell>
                                        <TableCell>Subject Details</TableCell>
                                        <TableCell>Hours</TableCell>
                                        <TableCell>Term</TableCell>
                                        <TableCell>Classes</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredSubjects.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                                    <Typography variant="h6" gutterBottom>
                                                        No subjects found
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Add your first subject to get started
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredSubjects.map((subject) => (
                                            <TableRow key={subject._id} hover>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedSubjects.includes(subject._id)}
                                                        onChange={() => handleSelectSubject(subject._id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                            {subject.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Code: {subject.code}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AccessTimeIcon fontSize="small" color="action" />
                                                        <Box>
                                                            <Typography variant="body2">
                                                                Weekly: {subject.weeklyHours}h
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Total: {subject.totalHours}h
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <EventIcon fontSize="small" color="action" />
                                                        <Box>
                                                            <Chip 
                                                                label={subject.semester === 1 ? '1st Semester' : '2nd Semester'}
                                                                size="small"
                                                                color="primary"
                                                                variant="outlined"
                                                            />
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                                {subject.year}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {subject.classes?.length > 0 ? (
                                                            subject.classes.map((cls, index) => (
                                                                <Chip
                                                                    key={cls._id}
                                                                    label={cls.name}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            ))
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary">
                                                                No classes assigned
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                onClick={() => navigate(`/admin/subjects/${subject._id}/edit`)}
                                                                color="primary"
                                                                size="small"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                onClick={() => handleDelete(subject._id)}
                                                                color="error"
                                                                size="small"
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this subject? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SubjectListScreen; 
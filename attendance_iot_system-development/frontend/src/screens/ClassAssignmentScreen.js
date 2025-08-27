import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const ClassAssignmentScreen = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchClasses();
      fetchStudents();
    }
  }, [user, navigate]);

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
      setError('Failed to fetch classes');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/students', config);
      setStudents(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const filteredStudents = filterStudents().map(student => student._id);
      setSelectedStudents(filteredStudents);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const filterStudents = () => {
    return students.filter(student => {
      const matchesSearch = (
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesSearch;
    });
  };

  const handleAssignClass = async () => {
    if (!selectedClass || selectedStudents.length === 0) {
      setError('Please select a class and at least one student');
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.post(
        'http://localhost:5000/api/students/assign-class',
        {
          classId: selectedClass,
          studentIds: selectedStudents
        },
        config
      );

      setSuccess(true);
      setSelectedStudents([]);
      fetchStudents();
      setConfirmDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assign Students to Class
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Students successfully assigned to class!
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Select Class"
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
          </FormControl>

          <TextField
            label="Search Students"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            disabled={!selectedClass || selectedStudents.length === 0}
            onClick={() => setConfirmDialogOpen(true)}
          >
            Assign to Class
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedStudents.length === filterStudents().length && filterStudents().length > 0}
                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < filterStudents().length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Current Class</TableCell>
                <TableCell>RFID Tag</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filterStudents().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filterStudents().map((student) => (
                  <TableRow key={student._id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => handleSelectStudent(student._id)}
                      />
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.class?.name || 'No Class'}</TableCell>
                    <TableCell>{student.rfidTag || 'Not Set'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>
          Assign {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} to class?
        </DialogTitle>
        <DialogContent>
          Are you sure you want to assign the selected students to {classes.find(c => c._id === selectedClass)?.name}?
          {selectedStudents.some(id => students.find(s => s._id === id)?.class) && (
            <Typography color="error" sx={{ mt: 2 }}>
              Note: Some selected students are already assigned to other classes. Their assignments will be updated.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignClass}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Assigning...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClassAssignmentScreen; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert
} from '@mui/material';

const ImportStudents = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch available classes
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        setClasses(response.data);
      } catch (err) {
        setError('Failed to fetch classes');
      }
    };
    fetchClasses();
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file || !selectedClass) {
      setError('Please select both a class and a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', selectedClass);

    try {
      const response = await axios.post('/api/students/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage('Students imported successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import students');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Import Students
      </Typography>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={handleClassChange}
            required
          >
            {classes.map((cls) => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.className}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mb: 2 }}>
          <input
            accept=".csv"
            type="file"
            onChange={handleFileChange}
            style={{ marginBottom: '1rem' }}
          />
          <Typography variant="caption" display="block">
            The CSV file should have the following columns: name, studentId, rfidId, email
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={!file || !selectedClass}
        >
          Upload and Import
        </Button>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">CSV Format Instructions:</Typography>
        <ul>
          <li>File must be in CSV format</li>
          <li>First row must be the header row</li>
          <li>Required columns: name, studentId, rfidId, email</li>
          <li>Each student must have a unique studentId and rfidId</li>
        </ul>
      </Box>
    </Container>
  );
};

export default ImportStudents;
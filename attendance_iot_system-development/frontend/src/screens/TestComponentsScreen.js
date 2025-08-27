import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import axios from 'axios';
import ClassGridView from '../components/ClassGridView';
import AttendanceStats from '../components/AttendanceStats';
import DeviceManagement from '../components/DeviceManagement';

const TestComponentsScreen = () => {
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    // Fetch first student ID from the database
    const fetchFirstStudent = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/students');
        if (data && data.length > 0) {
          setStudentId(data[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch student:', error);
      }
    };

    fetchFirstStudent();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Component Test Page
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Class Grid View
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <ClassGridView />
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Attendance Stats
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {studentId ? (
            <AttendanceStats studentId={studentId} />
          ) : (
            <Typography color="text.secondary">Loading student data...</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Device Management
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <DeviceManagement />
        </Paper>
      </Box>
    </Container>
  );
};

export default TestComponentsScreen;
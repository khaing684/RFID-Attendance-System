import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import AttendanceStats from './AttendanceStats';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        // Fetch student details including their class
        const { data } = await axios.get(
          `http://localhost:5000/api/students/me`,
          config
        );

        setStudentData(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student data');
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Container sx={{ mt: 4 }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );

  if (!studentData) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Student Info Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                {studentData.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Student ID: {studentData.studentId}
              </Typography>
              <Typography color="textSecondary">
                Class: {studentData.class?.name || 'Not Assigned'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    bgcolor: studentData.active ? 'success.light' : 'error.light',
                    color: 'white'
                  }}
                >
                  <Typography variant="h6">
                    Status: {studentData.active ? 'Active' : 'Inactive'}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 4 }} />

      {/* Attendance Statistics */}
      {studentData.class ? (
        <AttendanceStats 
          studentId={studentData._id} 
          classId={studentData.class._id} 
        />
      ) : (
        <Alert severity="info">
          You are not assigned to any class. Please contact your administrator.
        </Alert>
      )}
    </Container>
  );
};

export default StudentDashboard; 
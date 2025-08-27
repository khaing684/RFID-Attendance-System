import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import AttendanceStats from '../components/AttendanceStats';

const StudentAttendanceScreen = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get(`http://localhost:5000/api/students/${id}`, config);
      setStudent(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student details');
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!student) return <Alert severity="info">Student not found</Alert>;

  return (
    <Container>
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          {student.name}'s Attendance
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <AttendanceStats studentId={student._id} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default StudentAttendanceScreen; 
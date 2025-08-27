import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Link,
  Alert
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import api from '../utils/api';

const ClassGridView = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState('students');
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const { userInfo } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      fetchClasses();
    }
  }, [userInfo, navigate]);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classes');
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const { data } = await api.get(`/students?class=${classId}`);
      setStudents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    }
  };

  const fetchSchedules = async (classId) => {
    try {
      const { data } = await api.get(`/schedules/class/${classId}`);
      setSchedules(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedules');
    }
  };

  const handleClassClick = async (classData, content) => {
    setSelectedClass(classData);
    setDialogContent(content);
    if (content === 'students') {
      setStudents(classData.students || []);
    } else {
      await fetchSchedules(classData._id);
    }
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedClass(null);
    setStudents([]);
    setSchedules([]);
  };

  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <>
      <Grid container spacing={3}>
        {classes.map((classData) => (
          <Grid item xs={12} sm={6} md={4} key={classData._id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  {classData.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="textSecondary">
                    Teacher: {classData.teacher?.name || 'Not Assigned'}
                  </Typography>
                  <Chip 
                    label={`${classData.students?.length || 0} Students`} 
                    color="primary" 
                    size="small" 
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {classData.description || 'No description available'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<PeopleIcon />}
                    variant="outlined"
                    onClick={() => handleClassClick(classData, 'students')}
                  >
                    View Students
                  </Button>
                  <Button
                    startIcon={<ScheduleIcon />}
                    variant="outlined"
                    onClick={() => handleClassClick(classData, 'schedule')}
                  >
                    Schedule
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedClass?.name} - {dialogContent === 'students' ? 'Students' : 'Schedule'}
        </DialogTitle>
        <DialogContent>
          {dialogContent === 'students' ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>RFID ID</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No students in this class
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.rfidId}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={() => navigate(`/admin/attendance/student/${student._id}`)}
                          >
                            View Attendance
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No schedules for this class
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((schedule) => (
                      <TableRow key={schedule._id}>
                        <TableCell>{schedule.day}</TableCell>
                        <TableCell>{schedule.subject}</TableCell>
                        <TableCell>{formatTime(schedule.startTime)}</TableCell>
                        <TableCell>{formatTime(schedule.endTime)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClassGridView; 
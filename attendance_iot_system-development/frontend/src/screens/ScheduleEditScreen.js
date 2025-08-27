import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Box
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DEFAULT_TIME_SLOTS } from '../utils/scheduleDefaults';

const ScheduleEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    day: '',
    startTime: DEFAULT_TIME_SLOTS[0].startTime,
    endTime: DEFAULT_TIME_SLOTS[0].endTime,
    room: '',
  });
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchClasses();
    fetchSubjects();
    if (id && id !== 'create') {
      fetchSchedule();
    }
  }, [id, userInfo, navigate]);

  const fetchClasses = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('/api/classes', config);
      setClasses(data);
    } catch (err) {
      setError('Failed to fetch classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('/api/subjects', config);
      console.log('Fetched subjects:', data);
      setSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to fetch subjects');
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get(`api/schedules/${id}`, config);
      setFormData({
        class: data.class._id,
        subject: data.subject._id,
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch schedule details');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeChange = (field, value) => {
    if (!value) return;
    const timeString = value.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    setFormData(prev => ({
      ...prev,
      [field]: timeString
    }));
  };

  const validateForm = () => {
    if (!formData.class) return 'Please select a class';
    if (!formData.day) return 'Please select a day';
    if (!formData.subject) return 'Please select a subject';
    if (!formData.room) return 'Please enter a room';
    if (!formData.startTime) return 'Please select start time';
    if (!formData.endTime) return 'Please select end time';
    if (formData.startTime >= formData.endTime) return 'End time must be after start time';
    return null;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
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

      if (id && id !== 'create') {
        await axios.put(
          `/api/schedules/${id}`,
          formData,
          config
        );
      } else {
        await axios.post(
          '/api/schedules',
          formData,
          config
        );
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/schedules');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4, mt: 2 }}>
          <Button
            component={Link}
            to="/admin/schedules"
            variant="outlined"
            sx={{ mb: 2 }}
          >
            Go Back
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {id && id !== 'create' ? 'Edit Schedule' : 'Create Schedule'}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Schedule saved successfully!</Alert>}

        <Paper sx={{ p: 3 }}>
          <form onSubmit={submitHandler}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    label="Class"
                    required
                  >
                    <MenuItem value="">Select Class</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    label="Subject"
                    required
                  >
                    <MenuItem value="">Select Subject</MenuItem>
                    {subjects && subjects.length > 0 ? (
                      subjects.map((subject) => (
                        <MenuItem key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No subjects available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Day</InputLabel>
                  <Select
                    name="day"
                    value={formData.day}
                    onChange={handleChange}
                    label="Day"
                    required
                  >
                    <MenuItem value="">Select Day</MenuItem>
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Room"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Start Time"
                  value={new Date(`2024-01-01T${formData.startTime}`)}
                  onChange={(newValue) => handleTimeChange('startTime', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TimePicker
                  label="End Time"
                  value={new Date(`2024-01-01T${formData.endTime}`)}
                  onChange={(newValue) => handleTimeChange('endTime', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Saving...' : (id && id !== 'create' ? 'Update Schedule' : 'Create Schedule')}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default ScheduleEditScreen; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestoreIcon from '@mui/icons-material/Restore';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { generateEmptyScheduleData, DEFAULT_TIME_SLOTS, isValidTimeFormat, formatTime, isValidTimeRange } from '../utils/scheduleDefaults';
import ScheduleCSVUpload from '../components/ScheduleCSVUpload';

const ScheduleBulkCreateScreen = () => {
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Initialize schedule data with default time slots
  const [scheduleData, setScheduleData] = useState(generateEmptyScheduleData());
  
  const [activeTab, setActiveTab] = useState(0);
  
  const navigate = useNavigate();
  const { userInfo } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      fetchClasses();
      fetchSubjects();
    }
  }, [userInfo, navigate]);
  
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      const { data } = await axios.get('http://localhost:5000/api/classes', config);
      setClasses(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classes');
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      const { data } = await axios.get('http://localhost:5000/api/subjects', config);
      setSubjects(data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(false);
  };
  
  const handleCSVUploadSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      navigate('/admin/schedules');
    }, 1500);
  };
  
  const validateSchedule = () => {
    const errors = {};
    let hasError = false;
    
    Object.entries(scheduleData).forEach(([day, periods]) => {
      periods.forEach((period, index) => {
        // Validate subject
        if (!period.subject) {
          errors[`${day}-${index}-subject`] = 'Subject is required';
          hasError = true;
        }
        
        // Validate time format
        if (!isValidTimeFormat(period.startTime)) {
          errors[`${day}-${index}-startTime`] = 'Invalid time format (HH:MM)';
          hasError = true;
        }
        if (!isValidTimeFormat(period.endTime)) {
          errors[`${day}-${index}-endTime`] = 'Invalid time format (HH:MM)';
          hasError = true;
        }
        
        // Validate time range
        if (isValidTimeFormat(period.startTime) && isValidTimeFormat(period.endTime)) {
          if (!isValidTimeRange(period.startTime, period.endTime)) {
            errors[`${day}-${index}-timeRange`] = 'End time must be after start time';
            hasError = true;
          }
        }
      });
    });
    
    setValidationErrors(errors);
    return !hasError;
  };
  
  const handleScheduleChange = (day, periodIndex, field, value) => {
    setScheduleData(prevData => {
      const newData = { ...prevData };
      newData[day][periodIndex] = {
        ...newData[day][periodIndex],
        [field]: field.includes('Time') ? formatTime(value) : value
      };
      return newData;
    });
    
    // Clear validation errors for the changed field
    if (validationErrors[`${day}-${periodIndex}-${field}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${day}-${periodIndex}-${field}`];
        delete newErrors[`${day}-${periodIndex}-timeRange`];
        return newErrors;
      });
    }
  };

  const resetTimeSlot = (day, periodIndex) => {
    const defaultSlot = DEFAULT_TIME_SLOTS[periodIndex];
    handleScheduleChange(day, periodIndex, 'startTime', defaultSlot.startTime);
    handleScheduleChange(day, periodIndex, 'endTime', defaultSlot.endTime);
  };
  
  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!classId) {
      setError('Please select a class');
      return;
    }
    
    if (!validateSchedule()) {
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const schedulesToCreate = [];
      
      Object.entries(scheduleData).forEach(([day, periods]) => {
        const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
        schedulesToCreate.push({
          day: formattedDay,
          periods: periods.map(period => ({
            startTime: period.startTime,
            endTime: period.endTime,
            room: period.room || 'Default Room',
            subject: period.subject
          }))
        });
      });
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        }
      };
      
      await axios.post(
        'http://localhost:5000/api/schedules/bulk',
        { 
          class: classId,
          schedules: schedulesToCreate
        },
        config
      );
      
      setSuccess(true);
      setLoading(false);
      
      setTimeout(() => {
        navigate('/admin/schedules');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create schedules');
      setLoading(false);
    }
  };
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').slice(0, 6);
        setPreviewData(rows);
      };
      reader.readAsText(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
      setPreviewData(null);
    }
  };

  const downloadTemplate = () => {
    // Create header row and sample data
    const template = `subject_code,day,startTime,endTime,room
401,Monday,09:00,10:00,Room 101
402,Monday,10:00,11:00,Room 101
403,Monday,11:00,12:00,Room 101
404,Monday,13:00,14:00,Room 101
405,Monday,14:00,16:00,Room 101`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !classId) {
      setError('Please select both a class and a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', classId);

    try {
      setLoading(true);
      setError(null);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      };

      await axios.post(
        'http://localhost:5000/api/schedules/upload-csv',
        formData,
        config
      );
      
      setSuccess(true);
      setError(null);
      
      // Clear form
      setFile(null);
      setPreviewData(null);
      setClassId('');
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }

      setTimeout(() => {
        navigate('/admin/schedules');
      }, 1500);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err);
      setError(err.response?.data?.message || 'Error uploading file');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/schedules')}
          sx={{ mb: 2 }}
        >
          Back to Schedules
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Bulk Create Schedules
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>Schedules imported successfully! Redirecting...</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Select Class</InputLabel>
                  <Select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    label="Select Class"
                    required
                  >
                    <MenuItem value="">Choose a class...</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box>
                  <input
                    accept=".csv"
                    style={{ display: 'none' }}
                    id="csv-file"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="csv-file">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                    >
                      Upload CSV File
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Required columns: subject_code, day, startTime, endTime, room
                  </Typography>
                </Box>

                {loading && (
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Upload Progress: {uploadProgress}%
                    </Typography>
                  </Box>
                )}

                {previewData && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Preview:
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        maxHeight: '200px',
                        overflow: 'auto',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      <pre style={{ margin: 0 }}>{previewData.join('\n')}</pre>
                    </Paper>
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!file || !classId || loading}
                  startIcon={<CloudUploadIcon />}
                >
                  {loading ? 'Uploading...' : 'Upload and Import'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              CSV Format Instructions
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <li>File must be in CSV format</li>
              <li>First row must be the header row</li>
              <li>Required columns: subject_code, day, startTime, endTime, room</li>
              <li>Time format: HH:MM (24-hour)</li>
              <li>Days: Monday, Tuesday, Wednesday, Thursday, Friday</li>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                fullWidth
              >
                Download Template
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Subjects
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Box component="ul" sx={{ pl: 2 }}>
                {subjects.map((subject) => (
                  <li key={subject._id}>
                    {subject.name} - <code>{subject.code}</code>
                  </li>
                ))}
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Classes
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <Box component="ul" sx={{ pl: 2 }}>
                {classes.map((cls) => (
                  <li key={cls._id}>
                    {cls.name} - <code>{cls._id}</code>
                  </li>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ScheduleBulkCreateScreen; 
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const AttendanceStats = ({ studentId, classId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(
          `http://localhost:5000/api/attendance/stats?studentId=${studentId}&classId=${classId}`,
          config
        );

        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch attendance statistics');
        setLoading(false);
      }
    };

    if (studentId && classId) {
      fetchStats();
    }
  }, [studentId, classId, user]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  return (
    <Box sx={{ py: 3 }}>
      {/* Overall Statistics Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overall Attendance
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(stats.overall.percentage)}
                  size={120}
                  thickness={4}
                  sx={{
                    color: parseFloat(stats.overall.percentage) >= 75 ? 'success.main' : 'warning.main',
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div" color="text.secondary">
                    {`${Math.round(parseFloat(stats.overall.percentage))}%`}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Timeline>
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="primary">
                      <SchoolIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {stats.overall.totalClasses}
                    </Typography>
                    <Typography>Total Classes</Typography>
                  </TimelineContent>
                </TimelineItem>
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="success">
                      <CheckCircleIcon />
                    </TimelineDot>
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {stats.overall.present}
                    </Typography>
                    <Typography>Classes Attended</Typography>
                  </TimelineContent>
                </TimelineItem>
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="warning">
                      <WarningIcon />
                    </TimelineDot>
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      {stats.overall.late}
                    </Typography>
                    <Typography>Late Arrivals</Typography>
                  </TimelineContent>
                </TimelineItem>
              </Timeline>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Subject-wise Statistics */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subject-wise Attendance
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="center">Total Classes</TableCell>
                  <TableCell align="center">Present</TableCell>
                  <TableCell align="center">Percentage</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stats.subjectWise).map(([subject, data]) => (
                  <TableRow key={subject}>
                    <TableCell component="th" scope="row">
                      {subject}
                    </TableCell>
                    <TableCell align="center">{data.total}</TableCell>
                    <TableCell align="center">{data.present}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={data.percentage}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: data.percentage >= 75 ? 'success.main' : 'warning.main',
                                borderRadius: 5,
                              },
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {`${Math.round(data.percentage)}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={data.percentage >= 75 ? 'Good' : 'Warning'}
                        color={data.percentage >= 75 ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Period Information */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <EventIcon color="action" />
        <Typography variant="body2" color="text.secondary">
          Statistics for period: {new Date(stats.period.start).toLocaleDateString()} to{' '}
          {new Date(stats.period.end).toLocaleDateString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default AttendanceStats; 
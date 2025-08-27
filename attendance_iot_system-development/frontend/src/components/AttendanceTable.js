import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

const AttendanceTable = ({ attendance = [], onUpdate, canEdit }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Student</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Device</TableCell>
            <TableCell>Notes</TableCell>
            {canEdit && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {attendance.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit ? 10 : 9} align="center">
                <Typography variant="body1" color="textSecondary">
                  No attendance records found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            attendance.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{formatTime(record.checkinTime)}</TableCell>
                <TableCell>{record.student?.name || 'N/A'}</TableCell>
                <TableCell>{record.student?.studentId || 'N/A'}</TableCell>
                <TableCell>{record.class?.name || 'N/A'}</TableCell>
                <TableCell>
                  {record.schedule?.subject ? (
                    <>
                      <Typography variant="body2">
                        {record.schedule.subject.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        ({record.schedule.subject.code})
                      </Typography>
                    </>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {record.schedule ? (
                    <>
                      <Typography variant="body2">
                        {record.schedule.day}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {record.schedule.startTime} - {record.schedule.endTime}
                        <br />
                        Room: {record.schedule.room}
                      </Typography>
                    </>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.status}
                    color={getStatusColor(record.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{record.rfidDevice?.location || '-'}</TableCell>
                <TableCell>{record.notes || '-'}</TableCell>
                {canEdit && (
                  <TableCell>
                    <Tooltip title="Edit Record">
                      <IconButton
                        size="small"
                        onClick={() => onUpdate(record._id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AttendanceTable; 
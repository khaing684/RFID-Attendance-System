import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Form, Card, Container, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { fetchAttendances } from '../slices/attendanceSlice';
import api from '../utils/api';

const AttendanceScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const { attendances, loading: attendanceLoading } = useSelector((state) => state.attendance);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      fetchClasses();
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (selectedDate || selectedClass) {
      fetchAttendance();
    }
  }, [selectedDate, selectedClass]);

  // Add auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedDate || selectedClass) {
        fetchAttendance();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedDate, selectedClass]);

  const fetchClasses = async () => {
    try {
      if (!userInfo?.token) {
        setError('Authentication required');
        return;
      }

      const { data } = await api.get('/classes');
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err.response?.data?.message || 'Failed to fetch classes');
    }
  };

  const fetchAttendance = async () => {
    try {
      if (!userInfo?.token) {
        setError('Authentication required');
        return;
      }

      let url = '/attendance?';
      if (selectedDate) url += `date=${selectedDate}&`;
      if (selectedClass) url += `classId=${selectedClass}`;

      dispatch(fetchAttendances());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
    }
  };

  const getStatusBadge = (status) => {
    let variant = 'success';
    if (status === 'late') variant = 'warning';
    if (status === 'absent') variant = 'danger';
    return <Badge bg={variant}>{status}</Badge>;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString();
  };

  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Attendance Management</h1>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={fetchAttendance} className="me-2">
            <i className="fas fa-sync-alt"></i> Refresh
          </Button>
          <Link to="/admin/attendance/report">
            <Button variant="primary">
              <i className="fas fa-file-export"></i> Generate Reports
            </Button>
          </Link>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group controlId="date">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="class">
                <Form.Label>Class</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Message variant="danger">{error}</Message>}
      
      {attendanceLoading ? (
        <Loader />
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>TIME</th>
                <th>STUDENT</th>
                <th>ID</th>
                <th>CLASS</th>
                <th>SUBJECT</th>
                <th>SCHEDULE</th>
                <th>STATUS</th>
                <th>DEVICE</th>
                <th>NOTES</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center">No attendance records found</td>
                </tr>
              ) : (
                attendances.map((record) => (
                  <tr key={record._id}>
                    <td>{formatTime(record.checkinTime)}</td>
                    <td>{record.student?.name || 'N/A'}</td>
                    <td>{record.student?.studentId || 'N/A'}</td>
                    <td>{record.class?.name || 'N/A'}</td>
                    <td>
                      {record.schedule?.subject ? (
                        <>
                          {record.schedule.subject.name}
                          <br />
                          <small className="text-muted">({record.schedule.subject.code})</small>
                        </>
                      ) : '-'}
                    </td>
                    <td>
                      {record.schedule ? (
                        <>
                          {record.schedule.day}
                          <br />
                          <small>
                            {record.schedule.startTime} - {record.schedule.endTime}
                            <br />
                            Room: {record.schedule.room || '-'}
                          </small>
                        </>
                      ) : '-'}
                    </td>
                    <td>{getStatusBadge(record.status)}</td>
                    <td>{record.rfidDevice?.location || '-'}</td>
                    <td>{record.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default AttendanceScreen;
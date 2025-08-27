import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Form, Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { format } from 'date-fns';

const TeacherClassAttendanceScreen = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'teacher') {
      navigate('/');
    } else if (classId) {
      fetchClassAndAttendance();
    }
  }, [userInfo, navigate, classId, filterDate]);

  const fetchClassAndAttendance = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Fetch class details to display class name
      const classRes = await axios.get(`http://localhost:5000/api/classes/${classId}`, config);
      setClassName(classRes.data.name);

      // Fetch attendance records for the class
      const { data } = await axios.get(
        `http://localhost:5000/api/attendance/class/${classId}?date=${filterDate}`,
        config
      );
      setAttendanceRecords(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  return (
    <Container>
      <Row className="align-items-center my-3">
        <Col>
          <h1>Attendance for {className}</h1>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group controlId="filterDate">
            <Form.Label>Filter by Date</Form.Label>
            <Form.Control
              type="date"
              value={filterDate}
              onChange={handleDateChange}
            />
          </Form.Group>
        </Col>
        <Col md={8} className="d-flex align-items-end justify-content-end">
          <Button onClick={() => navigate(-1)} variant="secondary">
            Go Back to My Classes
          </Button>
        </Col>
      </Row>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : attendanceRecords.length === 0 ? (
        <Message variant="info">No attendance records found for this class on {filterDate}.</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Subject</th>
              <th>Time</th>
              <th>Date</th>
              <th>Status</th>
              <th>Check-in Time</th>
              <th>RFID Device</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record._id}>
                <td>{record.student?.name}</td>
                <td>{record.student?.studentId}</td>
                <td>{record.schedule?.subject?.name || 'N/A'}</td>
                <td>{`${record.schedule?.startTime} - ${record.schedule?.endTime}` || 'N/A'}</td>
                <td>{format(new Date(record.date), 'dd-MM-yyyy')}</td>
                <td>{record.status}</td>
                <td>{record.checkinTime ? format(new Date(record.checkinTime), 'HH:mm:ss') : 'N/A'}</td>
                <td>{record.rfidDevice?.name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default TeacherClassAttendanceScreen; 
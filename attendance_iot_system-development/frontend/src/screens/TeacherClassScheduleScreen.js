import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';

const TeacherClassScheduleScreen = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'teacher') {
      navigate('/');
    } else if (classId) {
      fetchClassAndSchedule();
    }
  }, [userInfo, navigate, classId]);

  const fetchClassAndSchedule = async () => {
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

      // Fetch schedules for the class
      const { data } = await axios.get(
        `http://localhost:5000/api/schedules/class/${classId}`,
        config
      );
      setSchedules(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    // Assuming time is in HH:mm format
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <Container>
      <Row className="align-items-center my-3">
        <Col>
          <h1>Schedule for {className}</h1>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="d-flex justify-content-end">
          <Button onClick={() => navigate(-1)} variant="secondary">
            Go Back to My Classes
          </Button>
        </Col>
      </Row>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : schedules.length === 0 ? (
        <Message variant="info">No schedules found for this class.</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>Day</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Room</th>
              <th>Subject</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule._id}>
                <td>{schedule.day}</td>
                <td>{formatTime(schedule.startTime)}</td>
                <td>{formatTime(schedule.endTime)}</td>
                <td>{schedule.room || 'N/A'}</td>
                <td>{schedule.subject?.name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default TeacherClassScheduleScreen; 
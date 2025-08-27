import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ClassCard from '../components/ClassCard';

const HomeScreen = () => {
  const { userInfo: user } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchTeacherClasses();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/classes/myclasses?populate=students', config);
      setClasses(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assigned classes');
    } finally {
      setLoading(false);
    }
  };

  const onViewAttendance = (classData) => {
    navigate(`/teacher/classes/${classData._id}/attendance`);
  };
  const onViewStudents = (classData) => {
    navigate(`/teacher/classes/${classData._id}/students`);
  };
  const onGenerateReport = (classData) => {
    navigate(`/teacher/classes/${classData._id}/report`);
  };
  const onViewSchedule = (classData) => {
    navigate(`/teacher/classes/${classData._id}/schedule`);
  };

  return (
    <div className="py-5">
      <Container>
        <h1 className="text-center mb-4">Welcome to RFID Attendance System</h1>
        
        {!user ? (
          <Row className="justify-content-md-center">
            <Col md={6}>
              <Card className="p-4">
                <Card.Body>
                  <Card.Title>Get Started</Card.Title>
                  <Card.Text>
                    Please login to access the attendance system
                  </Card.Text>
                  <Link to="/login">
                    <Button variant="primary">Login</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : user.role === 'student' ? (
          <Row className="justify-content-md-center">
            <Col md={6}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>My Attendance Dashboard</Card.Title>
                  <Card.Text>View your attendance statistics and records</Card.Text>
                  <Link to="/dashboard">
                    <Button variant="primary">Go to Dashboard</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : user.role === 'teacher' ? (
          <>
            <Row className="my-3">
              <Col>
                <h1>My Assigned Classes</h1>
                <p className="text-muted">View classes you are assigned to.</p>
              </Col>
            </Row>
            {loading ? (
              <Loader />
            ) : error ? (
              <Message variant="danger">{error}</Message>
            ) : classes.length === 0 ? (
              <Message variant="info">You are not currently assigned to any classes.</Message>
            ) : (
              <Row xs={1} md={2} lg={3} className="g-4">
                {classes.map((cls) => (
                  <Col key={cls._id}>
                    <ClassCard
                      classData={cls}
                      userRole={user.role}
                      onViewAttendance={onViewAttendance}
                      onViewStudents={onViewStudents}
                      onGenerateReport={onGenerateReport}
                      onViewSchedule={onViewSchedule}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </>
        ) : (
          <Row>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Students</Card.Title>
                  <Card.Text>Manage student records and RFID cards</Card.Text>
                  <Link to="/admin/students">
                    <Button variant="outline-primary" className="me-2">Manage Students</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Attendance</Card.Title>
                  <Card.Text>Record and view attendance data</Card.Text>
                  <Link to="/admin/attendance">
                    <Button variant="outline-primary">View Attendance</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Reports</Card.Title>
                  <Card.Text>Generate attendance reports</Card.Text>
                  <Link to="/admin/attendance/report">
                    <Button variant="outline-primary">Generate Reports</Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default HomeScreen; 
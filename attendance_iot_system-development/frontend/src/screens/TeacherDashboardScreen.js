import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ClassCard from '../components/ClassCard';

const TeacherDashboardScreen = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'teacher') {
      navigate('/'); // Redirect if not a teacher or not logged in
    } else {
      fetchTeacherClasses();
    }
  }, [userInfo, navigate]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
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
    console.log('View attendance for class:', classData.name);
    navigate(`/teacher/classes/${classData._id}/attendance`);
  };

  const onViewStudents = (classData) => {
    console.log('View students for class:', classData.name);
    navigate(`/teacher/classes/${classData._id}/students`);
  };

  const onGenerateReport = (classData) => {
    console.log('Generate report for class:', classData.name);
    navigate(`/teacher/classes/${classData._id}/report`);
  };

  const onViewSchedule = (classData) => {
    console.log('View schedule for class:', classData.name);
    navigate(`/teacher/classes/${classData._id}/schedule`);
  };

  return (
    <Container>
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
                userRole={userInfo.role} 
                onViewAttendance={onViewAttendance} 
                onViewStudents={onViewStudents} 
                onGenerateReport={onGenerateReport}
                onViewSchedule={onViewSchedule}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default TeacherDashboardScreen; 
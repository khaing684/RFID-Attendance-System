import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';

const TeacherClassStudentsScreen = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [className, setClassName] = useState('');

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'teacher') {
      navigate('/');
    } else if (classId) {
      fetchClassAndStudents();
    }
  }, [userInfo, navigate, classId]);

  const fetchClassAndStudents = async () => {
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

      // Fetch students for the class
      const { data } = await axios.get(
        `http://localhost:5000/api/students?class=${classId}`,
        config
      );
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="align-items-center my-3">
        <Col>
          <h1>Students in {className}</h1>
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
      ) : students.length === 0 ? (
        <Message variant="info">No students found in this class.</Message>
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>RFID ID</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td>{student.studentId}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.rfidId}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default TeacherClassStudentsScreen; 
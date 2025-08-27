import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentById, createStudent, updateStudent, reset } from '../slices/studentSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';

const StudentEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    rfidId: '',
    email: '',
    class: ''
  });

  const [classes, setClasses] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const { loading, error, success, student } = useSelector((state) => state.student);
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('http://localhost:5000/api/classes', config);
        setClasses(data);
      } catch (error) {
        setFetchError('Failed to fetch classes');
      }
    };

    if (!userInfo) {
      navigate('/login');
    } else if (userInfo.role !== 'admin') {
      navigate('/');
    } else {
      fetchClasses();
      
      if (id && id !== 'create') {
        dispatch(getStudentById(id));
      } else {
        dispatch(reset());
      }
    }
  }, [dispatch, navigate, id, userInfo]);

  useEffect(() => {
    if (success) {
      dispatch(reset());
      navigate('/admin/students');
      return;
    }

    if (id && id !== 'create' && student) {
      setFormData({
        name: student.name || '',
        studentId: student.studentId || '',
        rfidId: student.rfidId || '',
        email: student.email || '',
        class: student.class?._id || student.class || ''
      });
    }
  }, [id, student, success, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setValidationError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.studentId.trim()) errors.studentId = 'Student ID is required';
    if (!formData.rfidId.trim()) errors.rfidId = 'RFID ID is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.class) errors.class = 'Class is required';
    
    if (Object.keys(errors).length > 0) {
      setValidationError(errors);
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (id && id !== 'create') {
      dispatch(updateStudent(id, formData));
    } else {
      dispatch(createStudent(formData));
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          <Link to="/admin/students" className="btn btn-light my-3">
            Go Back
          </Link>
          <h1 className="text-center mb-4">
            {id && id !== 'create' ? 'Edit Student' : 'Create Student'}
          </h1>
          
          {error && <Message variant="danger">{error}</Message>}
          {fetchError && <Message variant="danger">{fetchError}</Message>}
          
          {loading ? (
            <Loader />
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="name" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={validationError?.name}
                />
                <Form.Control.Feedback type="invalid">
                  {validationError?.name}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="studentId" className="mb-3">
                <Form.Label>Student ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter student ID"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  isInvalid={validationError?.studentId}
                />
                <Form.Control.Feedback type="invalid">
                  {validationError?.studentId}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="rfidId" className="mb-3">
                <Form.Label>RFID ID</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter RFID ID"
                  name="rfidId"
                  value={formData.rfidId}
                  onChange={handleChange}
                  isInvalid={validationError?.rfidId}
                />
                <Form.Control.Feedback type="invalid">
                  {validationError?.rfidId}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  isInvalid={validationError?.email}
                />
                <Form.Control.Feedback type="invalid">
                  {validationError?.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="class" className="mb-3">
                <Form.Label>Class</Form.Label>
                <Form.Select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  isInvalid={validationError?.class}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {validationError?.class}
                </Form.Control.Feedback>
              </Form.Group>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-100 mt-4" 
                disabled={loading}
              >
                {loading ? 'Saving...' : (id && id !== 'create' ? 'Update Student' : 'Create Student')}
              </Button>
            </Form>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default StudentEditScreen; 
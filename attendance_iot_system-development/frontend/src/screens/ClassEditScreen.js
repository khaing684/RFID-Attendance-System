import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Message from '../components/Message';
import Loader from '../components/Loader';

const ClassEditScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    description: ''
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    if (userInfo.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchTeachers = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('http://localhost:5000/api/users?role=teacher', config);
        setTeachers(data);
      } catch (err) {
        setError('Failed to fetch teachers');
      }
    };

    const fetchClass = async () => {
      if (!id || id === 'create') return;

      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get(`http://localhost:5000/api/classes/${id}`, config);
        setFormData({
          name: data.name,
          teacherId: data.teacher?._id || '',
          description: data.description || ''
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch class details');
        setLoading(false);
      }
    };

    fetchTeachers();
    fetchClass();
  }, [id, userInfo, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      if (id && id !== 'create') {
        await axios.put(
          `http://localhost:5000/api/classes/${id}`,
          formData,
          config
        );
      } else {
        await axios.post(
          'http://localhost:5000/api/classes',
          formData,
          config
        );
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/classes');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs={12} md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/admin/classes" className="btn btn-light">
              Go Back
            </Link>
            <h1>{id && id !== 'create' ? 'Edit Class' : 'Create Class'}</h1>
          </div>

          {error && <Message variant="danger">{error}</Message>}
          {success && <Message variant="success">Class saved successfully!</Message>}

          {loading ? (
            <Loader />
          ) : (
            <Form onSubmit={submitHandler}>
              <Form.Group controlId="name" className="mb-3">
                <Form.Label>Class Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter class name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="teacherId" className="mb-3">
                <Form.Label>Teacher</Form.Label>
                <Form.Select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="description" className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-100 mt-3"
                disabled={loading}
              >
                {loading ? 'Saving...' : (id && id !== 'create' ? 'Update Class' : 'Create Class')}
              </Button>
            </Form>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ClassEditScreen; 
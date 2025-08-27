import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { format } from 'date-fns';

const TeacherClassReportScreen = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const [className, setClassName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'teacher') {
      navigate('/');
    } else if (classId) {
      fetchClassDetails();
    }
  }, [userInfo, navigate, classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get(`http://localhost:5000/api/classes/${classId}`, config);
      setClassName(data.name);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch class details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        responseType: 'blob', // Important for file downloads
      };

      const response = await axios.get(
        `http://localhost:5000/api/attendance/export?classId=${classId}&startDate=${startDate}&endDate=${endDate}`,
        config
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${className.replace(/\s/g, '_')}_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Report generated successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to generate report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="align-items-center my-3">
        <Col>
          <h1>Generate Attendance Report for {className}</h1>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {loading ? (
        <Loader />
      ) : (
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="startDate">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="endDate">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col>
              <Button
                variant="primary"
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-100"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button onClick={() => navigate(-1)} variant="secondary" className="w-100">
                Go Back to My Classes
              </Button>
            </Col>
          </Row>
        </Form>
      )}
    </Container>
  );
};

export default TeacherClassReportScreen; 
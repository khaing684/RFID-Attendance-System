import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Message from '../components/Message';
import Loader from '../components/Loader';

const AttendanceReportScreen = () => {
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [success, setSuccess] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  useEffect(() => {
    fetchClasses();
  }, [userInfo]);

  const fetchClasses = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/classes', config);
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const generateReportHandler = async (e) => {
    e.preventDefault();
    
    if (!classId || !startDate || !endDate) {
      setError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        responseType: 'blob',
      };

      const response = await axios.get(
        `http://localhost:5000/api/attendance/export?classId=${classId}&startDate=${startDate}&endDate=${endDate}`,
        config
      );

      // Create a blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const className = classes.find(c => c._id === classId)?.name || 'class';
      link.setAttribute('download', `attendance_${className}_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Error generating report'
      );
    }
  };

  return (
    <Container>
      <h1 className="mb-4">Attendance Reports</h1>
      <Card>
        <Card.Body>
          <Card.Title>Generate Attendance Report</Card.Title>
          {error && <Message variant="danger">{error}</Message>}
          {success && <Message variant="success">Report generated successfully!</Message>}
          {loading && <Loader />}
          <Form onSubmit={generateReportHandler}>
            <Row>
              <Col md={4}>
                <Form.Group controlId="classId" className="mb-3">
                  <Form.Label>Class <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="select"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="startDate" className="mb-3">
                  <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="endDate" className="mb-3">
                  <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Report Format</Card.Title>
          <p>The generated report will include:</p>
          <ul>
            <li>Student details (Name, ID)</li>
            <li>Class information</li>
            <li>Daily attendance status</li>
            <li>Check-in times</li>
            <li>Subject-wise attendance</li>
            <li>Overall attendance percentage</li>
          </ul>
          <p className="text-muted">
            Note: The report will be downloaded as a CSV file which can be opened in Excel or similar spreadsheet software.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AttendanceReportScreen; 
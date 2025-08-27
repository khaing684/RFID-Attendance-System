import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Row, Col, Modal, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import ClassCard from '../components/ClassCard';
import api from '../utils/api';

const ClassListScreen = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClassForModal, setSelectedClassForModal] = useState(null);
  const [modalStudents, setModalStudents] = useState([]);
  const [modalSchedules, setModalSchedules] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDeleteId, setClassToDeleteId] = useState(null);

  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/');
    } else {
      fetchClasses();
    }
  }, [userInfo, navigate]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // Ensure the backend populates students when fetching classes for admin view
      const { data } = await api.get('/classes?populate=students'); 
      setClasses(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      console.log(`Fetching students for class ID: ${classId}`);
      const { data } = await api.get(`/students?class=${classId}`);
      setModalStudents(data);
      console.log('Students fetched:', data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students for class');
    }
  };

  const fetchSchedules = async (classId) => {
    try {
      console.log(`Fetching schedules for class ID: ${classId}`);
      const { data } = await api.get(`/schedules/class/${classId}`);
      setModalSchedules(data);
      console.log('Schedules fetched:', data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err.response?.data?.message || 'Failed to fetch schedules for class');
    }
  };

  const onViewStudents = async (classData) => {
    setSelectedClassForModal(classData);
    setModalStudents(classData.students || []); // Use already populated students if available
    // If students are not populated, fetch them
    if (!classData.students || classData.students.length === 0) {
        await fetchStudents(classData._id);
    }
    setShowStudentsModal(true);
  };

  const onViewSchedule = async (classData) => {
    setSelectedClassForModal(classData);
    await fetchSchedules(classData._id);
    setShowScheduleModal(true);
  };

  const onEditClass = (id) => {
    navigate(`/admin/class/${id}/edit`);
  };

  const onDeleteClass = (id) => {
    setClassToDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    try {
      setError(null);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.delete(`http://localhost:5000/api/classes/${classToDeleteId}`, config);
      setSuccess(data.message || 'Class deleted successfully');
      fetchClasses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete class');
      setTimeout(() => setError(null), 5000);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Classes</h1>
        </Col>
        <Col className="text-end">
          <Button onClick={() => navigate('/admin/class/create')}>
            Create Class
          </Button>
        </Col>
      </Row>

      {error && <Message variant="danger">{error}</Message>}
      {success && <Message variant="success">{success}</Message>}

      {loading ? (
        <Loader />
      ) : classes.length === 0 ? (
        <Message variant="info">No classes found.</Message>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {classes.map((cls) => (
            <Col key={cls._id}>
              <ClassCard
                classData={cls}
                userRole={userInfo.role}
                onViewStudents={onViewStudents}
                onViewSchedule={onViewSchedule}
                onEditClass={onEditClass}
                onDeleteClass={onDeleteClass}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Students Modal */}
      <Modal show={showStudentsModal} onHide={() => setShowStudentsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedClassForModal?.name} - Students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalStudents.length === 0 ? (
            <Message variant="info">No students assigned to this class.</Message>
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
                {modalStudents.map((student) => (
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
        </Modal.Body>
      </Modal>

      {/* Schedule Modal */}
      <Modal show={showScheduleModal} onHide={() => setShowScheduleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedClassForModal?.name} - Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalSchedules.length === 0 ? (
            <Message variant="info">No schedules found for this class.</Message>
          ) : (
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {modalSchedules.map((schedule) => (
                  <tr key={schedule._id}>
                    <td>{schedule.day}</td>
                    <td>{formatTime(schedule.startTime)}</td>
                    <td>{formatTime(schedule.endTime)}</td>
                    <td>{schedule.subject?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the class "{selectedClassForModal?.name}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClassListScreen; 
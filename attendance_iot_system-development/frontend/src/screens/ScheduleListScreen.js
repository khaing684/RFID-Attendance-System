import React, { useEffect, useState } from 'react';
import { Table, Button, Row, Col, Form, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Message from '../components/Message';
import Loader from '../components/Loader';
import Modal from 'react-bootstrap/Modal';

const ScheduleListScreen = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [classes, setClasses] = useState([]);
  
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else if (userInfo.role !== 'admin') {
      navigate('/');
    } else {
      fetchClasses();
      fetchSchedules();
    }
  }, [userInfo, navigate]);
  

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
  
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      let url = 'http://localhost:5000/api/schedules';
      const params = new URLSearchParams();
      if (filterClass) params.append('class', filterClass);
      if (filterDay) params.append('day', filterDay);
      if (params.toString()) url += `?${params.toString()}`;
      
      const { data } = await axios.get(url, config);
      setSchedules(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteHandler = (id) => {
    setScheduleToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      await axios.delete(`http://localhost:5000/api/schedules/${scheduleToDelete}`, config);
      setShowDeleteModal(false);
      setError(null);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule');
      setShowDeleteModal(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSchedules(schedules.map(s => s._id));
    } else {
      setSelectedSchedules([]);
    }
  };

  const handleSelectSchedule = (scheduleId) => {
    setSelectedSchedules(prev => {
      if (prev.includes(scheduleId)) {
        return prev.filter(id => id !== scheduleId);
      } else {
        return [...prev, scheduleId];
      }
    });
  };

  const confirmBulkDelete = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        data: { scheduleIds: selectedSchedules }
      };
      
      await axios.delete('http://localhost:5000/api/schedules/bulk-delete', config);
      setShowBulkDeleteModal(false);
      setSelectedSchedules([]);
      setError(null);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedules');
      setShowBulkDeleteModal(false);
    }
  };

  const handleFilter = () => {
    fetchSchedules();
  };

  const clearFilter = () => {
    setFilterClass('');
    setFilterDay('');
    fetchSchedules();
  };
  
  return (
    <Container fluid>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Class Schedules</h1>
        </Col>
        <Col className="text-end">
          {selectedSchedules.length > 0 && (
            <Button 
              variant="danger" 
              className="me-2"
              onClick={() => setShowBulkDeleteModal(true)}
            >
              Delete Selected ({selectedSchedules.length})
            </Button>
          )}
          <Link to="/admin/schedule/create">
            <Button variant="primary" className="me-2">
              <i className="fas fa-plus"></i> Create Schedule
            </Button>
          </Link>
          <Link to="/admin/schedule/bulk">
            <Button variant="success">
              <i className="fas fa-list"></i> Bulk Create
            </Button>
          </Link>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Class</Form.Label>
            <Form.Select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Filter by Day</Form.Label>
            <Form.Select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="">All Days</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button variant="primary" onClick={handleFilter} className="me-2">
            Apply Filters
          </Button>
          <Button variant="secondary" onClick={clearFilter}>
            Clear Filters
          </Button>
        </Col>
      </Row>
      
      {error && <Message variant="danger">{error}</Message>}
      
      {loading ? (
        <Loader />
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedSchedules.length === schedules.length && schedules.length > 0}
                  />
                </th>
                <th>CLASS</th>
                <th>DAY</th>
                <th>TIME</th>
                <th>ROOM</th>
                <th>SUBJECT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">No schedules found</td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule._id}>
                    <td>
                      <Form.Check
                        type="checkbox"
                        onChange={() => handleSelectSchedule(schedule._id)}
                        checked={selectedSchedules.includes(schedule._id)}
                      />
                    </td>
                    <td>{schedule.class?.name || '-'}</td>
                    <td>{schedule.day}</td>
                    <td>{schedule.startTime} - {schedule.endTime}</td>
                    <td>{schedule.room}</td>
                    <td>{schedule.subject?.code || '-'}</td>
                    <td>
                      <Link to={`/admin/schedule/${schedule._id}/edit`}>
                        <Button variant="primary" className="btn-sm me-2">
                          <i className="fas fa-edit"></i>
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        className="btn-sm"
                        onClick={() => deleteHandler(schedule._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}
      
      {/* Single Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this schedule? This action cannot be undone.
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

      {/* Bulk Delete Modal */}
      <Modal show={showBulkDeleteModal} onHide={() => setShowBulkDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Bulk Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedSchedules.length} schedules? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmBulkDelete}>
            Delete {selectedSchedules.length} Schedules
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ScheduleListScreen; 
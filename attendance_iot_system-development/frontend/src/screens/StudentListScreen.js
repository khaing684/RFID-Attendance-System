import React, { useEffect, useState } from 'react';
import { Table, Button, Row, Col, Modal, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getStudents, deleteStudent, reset } from '../slices/studentSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import axios from 'axios';

const StudentListScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { students, loading, error, success } = useSelector((state) => state.student);
  const { userInfo } = useSelector((state) => state.auth);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkDeleteError, setBulkDeleteError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [classes, setClasses] = useState([]);
  
  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
    } else {
      dispatch(getStudents());
      fetchClasses();
    }
  }, [dispatch, navigate, userInfo]);
    
  // Separate effect for handling success
  useEffect(() => {
    if (success) {
      dispatch(reset());
    }
  }, [success, dispatch]);

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
      console.error('Failed to fetch classes:', err);
    }
  };
  
  const deleteHandler = (id) => {
    setStudentToDelete(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    dispatch(deleteStudent(studentToDelete));
    setShowDeleteModal(false);
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      setBulkDeleteError('Please select students to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) {
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.delete('http://localhost:5000/api/students/bulk-delete', {
          data: { studentIds: selectedStudents },
          ...config,
        });

        setBulkDeleteError(null);
        setSelectedStudents([]);
        dispatch(getStudents());

        if (data.invalidCount > 0) {
          alert(`Deleted ${data.deletedCount} students. ${data.invalidCount} invalid IDs were skipped.`);
        } else {
          alert(`Successfully deleted ${data.deletedCount} students.`);
        }
      } catch (err) {
        setBulkDeleteError(err.response?.data?.message || 'Failed to delete students');
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filteredStudents = students
        .filter(student => 
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(student => 
          !filterClass || student.class?._id === filterClass
        )
        .map(student => student._id);
      setSelectedStudents(filteredStudents);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const filteredStudents = students
    .filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(student => 
      !filterClass || student.class?._id === filterClass
    );

  return (
    <Container>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Students</h1>
        </Col>
        <Col className="text-end">
          <Link to="/admin/students/import">
            <Button variant="info" className="mx-2">
              <i className="fas fa-file-import"></i> Import Students
            </Button>
          </Link>
          <Link to="/admin/students/create">
            <Button variant="primary">
              <i className="fas fa-plus"></i> Create Student
            </Button>
          </Link>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="Search by name or student ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Form.Select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4} className="text-end">
          {selectedStudents.length > 0 && (
            <Button variant="danger" onClick={handleBulkDelete}>
              Delete Selected ({selectedStudents.length})
            </Button>
          )}
        </Col>
      </Row>
      
      {error && <Message variant="danger">{error}</Message>}
      {bulkDeleteError && <Message variant="danger">{bulkDeleteError}</Message>}
      {success && <Message variant="success">Operation completed successfully</Message>}
      
      {loading ? (
        <Loader />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr className="table-secondary">
              <th>
                <Form.Check
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                />
              </th>
              <th>ID</th>
              <th>NAME</th>
              <th>STUDENT ID</th>
              <th>RFID ID</th>
              <th>EMAIL</th>
              <th>CLASS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {!filteredStudents || filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-3">No students found</td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => handleSelectStudent(student._id)}
                    />
                  </td>
                  <td>{student._id}</td>
                  <td>{student.name}</td>
                  <td>{student.studentId}</td>
                  <td>{student.rfidId}</td>
                  <td>{student.email}</td>
                  <td>{student.class?.name || '-'}</td>
                  <td>
                    <Link to={`/admin/students/${student._id}/edit`}>
                      <Button variant="outline-primary" className="btn-sm mx-1" title="Edit">
                        <i className="fas fa-edit"></i>
                      </Button>
                    </Link>
                    <Button 
                      variant="outline-danger" 
                      className="btn-sm"
                      onClick={() => deleteHandler(student._id)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this student? This action cannot be undone.
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

export default StudentListScreen; 
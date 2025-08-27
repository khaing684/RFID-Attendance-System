import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert, Table, ProgressBar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import axios from 'axios';

const StudentImportScreen = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicateEntries, setDuplicateEntries] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassesLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const response = await axios.get('http://localhost:5000/api/classes', config);
        setClasses(response.data);
      } catch (error) {
        setError('Failed to fetch classes. Please try again.');
      } finally {
        setClassesLoading(false);
      }
    };

    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const response = await axios.get('http://localhost:5000/api/students', config);
        setStudents(response.data);
      } catch (error) {
        setError('Failed to fetch students. Please try again.');
      } finally {
        setStudentsLoading(false);
      }
    };

    if (userInfo) {
      fetchClasses();
      fetchStudents();
    }
  }, [userInfo]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check if file is a CSV by extension
      const isCSV = selectedFile.name.toLowerCase().endsWith('.csv');
      if (isCSV) {
        // Store the original file for upload
      setFile(selectedFile);
        
        // Create a copy for preview only
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
        const text = event.target.result;
        const rows = text.split('\n').slice(0, 6);
        setPreviewData(rows);
        
        // Validate CSV format
        const headers = rows[0].split(',').map(h => h.trim());
        const requiredHeaders = ['name', 'studentId', 'rfidId', 'email'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(', ')}`);
          setFile(null);
          setPreviewData(null);
          return;
        }
            setError(null);
          } catch (error) {
            console.error('Error reading file:', error);
            setError('Error reading file. Please make sure it is a valid CSV file.');
            setFile(null);
            setPreviewData(null);
          }
        };
        
        reader.onerror = () => {
          setError('Error reading file. Please try again.');
          setFile(null);
          setPreviewData(null);
      };
        
      reader.readAsText(selectedFile);
      setValidationErrors([]);
      setDuplicateEntries(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
      setPreviewData(null);
      }
    }
  };

  const downloadTemplate = () => {
    const headers = 'name,studentId,rfidId,email\n';
    const sampleData = 'John Doe,STU001,RFID001,john@example.com\n';
    const blob = new Blob([headers, sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedClass) {
      setError('Please select both a class and a CSV file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);
      setDuplicateEntries(null);
      
      const formData = new FormData();
      // Ensure we're using the original file with the correct field name
      formData.append('file', file, file.name);
      formData.append('classId', selectedClass);

      // Log the form data for debugging
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
      }
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
        maxContentLength: 5 * 1024 * 1024, // 5MB
        maxBodyLength: 5 * 1024 * 1024, // 5MB
        transformRequest: [(data) => data], // Prevent axios from transforming the FormData
      };

      const response = await axios.post('http://localhost:5000/api/students/import', formData, config);
      
      // Refresh the students list to show new students
      const updatedStudentsResponse = await axios.get('http://localhost:5000/api/students', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setStudents(updatedStudentsResponse.data);
      
      // Show success message
      setError(null);
      alert(`Successfully imported ${response.data.count} students to class ${response.data.class.name}`);
      
      // Clear form
      setFile(null);
      setPreviewData(null);
      setSelectedClass('');
      
      // Navigate back to students list
      navigate('/admin/students');
    } catch (error) {
      console.error('Import error:', error);
      
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setError('Validation errors found in CSV file');
      } else if (error.response?.data?.duplicates) {
        setDuplicateEntries(error.response.data.duplicates);
        setError('Duplicate entries found');
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (error.message.includes('Unexpected end of form')) {
        setError('Error uploading file. Please make sure the file is not corrupted and try again.');
      } else {
        setError(error.response?.data?.message || 'Error uploading file. Please try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSelectAllStudents = (e) => {
    if (e.target.checked) {
      setSelectedStudents(students.map(student => student._id));
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

  const handleDeleteSelected = async () => {
    if (!selectedStudents.length) return;

    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} selected students?`)) {
      try {
        setDeleteLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
          data: { studentIds: selectedStudents }
        };

        await axios.delete('http://localhost:5000/api/students/bulk-delete', config);
        
        // Refresh students list
        setStudents(prev => prev.filter(student => !selectedStudents.includes(student._id)));
        setSelectedStudents([]);
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || 'Error deleting students');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col xs={12} lg={10} xl={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Link to="/admin/students" className="btn btn-light">
              Go Back
            </Link>
            {selectedStudents.length > 0 && (
              <Button 
                variant="danger" 
                onClick={handleDeleteSelected}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : `Delete Selected (${selectedStudents.length})`}
              </Button>
            )}
          </div>

          <h1 className="text-center mb-4">Import Students</h1>

          {error && <Message variant="danger">{error}</Message>}

          {validationErrors.length > 0 && (
            <Alert variant="danger" className="mt-3">
              <Alert.Heading>Validation Errors</Alert.Heading>
              <ul className="mb-0">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {duplicateEntries && (
            <Alert variant="warning" className="mt-3">
              <Alert.Heading>Duplicate Entries Found</Alert.Heading>
              <p>The following entries already exist in the system:</p>
              {duplicateEntries.studentIds.length > 0 && (
                <div>
                  <strong>Student IDs:</strong>
                  <ul>
                    {duplicateEntries.studentIds.map((id, index) => (
                      <li key={`student-${index}`}>{id}</li>
                    ))}
                  </ul>
                </div>
              )}
              {duplicateEntries.rfidIds.length > 0 && (
                <div>
                  <strong>RFID IDs:</strong>
                  <ul>
                    {duplicateEntries.rfidIds.map((id, index) => (
                      <li key={`rfid-${index}`}>{id}</li>
                    ))}
                  </ul>
                </div>
              )}
              {duplicateEntries.emails.length > 0 && (
                <div>
                  <strong>Emails:</strong>
                  <ul>
                    {duplicateEntries.emails.map((email, index) => (
                      <li key={`email-${index}`}>{email}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="mb-4">
            <Row>
              <Col xs={12} md={6}>
                <Form.Group controlId="classSelect" className="mb-3">
                  <Form.Label>Select Class</Form.Label>
                  <Form.Select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                  >
                    <option value="">Choose a class...</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>Upload CSV File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={loading}
                    required
                  />
                  <Form.Text className="text-muted">
                    Required columns: name, studentId, rfidId, email
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {loading && (
              <div className="mb-3">
                <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                <div className="text-center mt-2">Uploading and processing...</div>
              </div>
            )}

            {previewData && (
              <div className="mb-3">
                <h5>Preview:</h5>
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        {previewData[0].split(',').map((header, index) => (
                          <th key={index}>{header.trim()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.split(',').map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell.trim()}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={!file || !selectedClass || loading}
            >
              {loading ? 'Uploading...' : 'Upload and Import'}
            </Button>
          </Form>

          <div className="mt-4">
            <Row>
              <Col xs={12} md={6}>
                <div className="mb-4">
                  <h5>CSV Format Instructions:</h5>
                  <ul>
                    <li>File must be in CSV format</li>
                    <li>First row must be the header row</li>
                    <li>Required columns: name, studentId, rfidId, email</li>
                    <li>Each student must have a unique studentId and rfidId</li>
                    <li>StudentId and rfidId must be alphanumeric</li>
                    <li>Email must be in valid format</li>
                  </ul>

                  <Alert variant="info">
                    <Alert.Heading>Need a template?</Alert.Heading>
                    <p>
                      Download our{' '}
                      <Button variant="link" className="p-0" onClick={downloadTemplate}>
                        CSV template
                      </Button>{' '}
                      to get started.
                    </p>
                  </Alert>
                </div>
              </Col>

              <Col xs={12} md={6}>
                <div className="mb-4">
                  <h5>Available Classes:</h5>
                  {classesLoading ? (
                    <Loader />
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Class Name</th>
                            <th>Class ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classes.map((cls) => (
                            <tr key={cls._id}>
                              <td>{cls.name}</td>
                              <td><code>{cls._id}</code></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <div className="mt-4">
              <h5>Current Students:</h5>
              {studentsLoading ? (
                <Loader />
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>
                          <Form.Check
                            type="checkbox"
                            onChange={handleSelectAllStudents}
                            checked={selectedStudents.length === students.length && students.length > 0}
                          />
                        </th>
                        <th>Name</th>
                        <th>Student ID</th>
                        <th>RFID ID</th>
                        <th>Email</th>
                        <th>Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              onChange={() => handleSelectStudent(student._id)}
                              checked={selectedStudents.includes(student._id)}
                            />
                          </td>
                          <td>{student.name}</td>
                          <td>{student.studentId}</td>
                          <td>{student.rfidId}</td>
                          <td>{student.email}</td>
                          <td>{student.class?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentImportScreen; 
import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Image } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { setCredentials } from '../slices/authSlice';

const ProfileScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [variant, setVariant] = useState('info');
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name);
      setEmail(userInfo.email);
    }
  }, [userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setVariant('danger');
      return;
    }
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const body = { name, email };
      if (password) body.password = password;
      const { data } = await axios.put(
        '/api/users/profile',
        body,
        config
      );
      setMessage('Profile updated successfully');
      setVariant('success');
      setPassword('');
      setConfirmPassword('');
      dispatch(setCredentials(data));
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Failed to update profile'
      );
      setVariant('danger');
    }
  };

  return (
    <Row className="justify-content-center mt-4">
      <Col md={4}>
        <Card className="shadow p-4 mb-4 bg-light rounded-4 border-0">
          <Card.Body>
            <div className="d-flex flex-column align-items-center mb-3">
              <Image
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=0D8ABC&color=fff&size=96`}
                roundedCircle
                alt="User Avatar"
                width={96}
                height={96}
                className="mb-2"
              />
              <h3 className="mb-1">Hello, {name || 'User'}!</h3>
              <div className="text-muted mb-2" style={{ fontSize: '0.95rem' }}>
                Welcome to your profile. You can update your details below.
              </div>
            </div>
        
            {message && <Alert variant={variant}>{message}</Alert>}
            <Form onSubmit={submitHandler}>
              <Form.Group controlId='name' className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type='text'
                  placeholder='Enter name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                ></Form.Control>
              </Form.Group>

              <Form.Group controlId='email' className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type='email'
                  placeholder='Enter email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></Form.Control>
              </Form.Group>

              <Form.Group controlId='password' className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Enter password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                ></Form.Control>
              </Form.Group>

              <Form.Group controlId='confirmPassword' className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type='password'
                  placeholder='Confirm password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                ></Form.Control>
              </Form.Group>

              <div className="d-grid">
                <Button type='submit' variant='primary' className="rounded-pill py-2">
                  <i className="fas fa-save me-2"></i>Update Profile
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default ProfileScreen; 
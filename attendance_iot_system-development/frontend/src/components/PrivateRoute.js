import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, roles = [] }) => {
  const { userInfo } = useSelector((state) => state.auth);

  if (!userInfo) {
    // Not logged in, redirect to login page
    return <Navigate to='/login' />;
  }

  if (roles.length > 0 && !roles.includes(userInfo.role)) {
    // Role not authorized, redirect to home page
    return <Navigate to='/' />;
  }

  // Authorized, render component
  return children;
};

export default PrivateRoute; 
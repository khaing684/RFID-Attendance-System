import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MonitorIcon from '@mui/icons-material/Monitor';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventIcon from '@mui/icons-material/Event';
import DevicesIcon from '@mui/icons-material/Devices';
import Link from '@mui/material/Link';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';


const Header = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [adminAnchorEl, setAdminAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAdminMenu = (event) => {
    setAdminAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAdminClose = () => {
    setAdminAnchorEl(null);
  };

  const logoutHandler = () => {
    dispatch(logout());
    handleClose();
  };

  return (
    <AppBar position="sticky" elevation={3} sx={{
      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
      boxShadow: 3,
    }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 72 }}>
          <SchoolIcon sx={{ fontSize: 36, mr: 1, color: 'white' }} />
          <Typography
            variant="h5"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'white',
              fontWeight: 700,
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            RFID Attendance System
          </Typography>

          {userInfo ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {userInfo.role === 'admin' && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/admin/attendance"
                  startIcon={<EventNoteIcon />}
                  sx={{ mr: 1, color: 'white', fontWeight: 500 }}
                >
                  Attendance
                </Button>
              )}

              {userInfo.role === 'teacher' && (
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/teacher/dashboard"
                  startIcon={<ClassIcon />}
                  sx={{ mr: 1, color: 'white', fontWeight: 500 }}
                >
                  My Classes
                </Button>
              )}

              {userInfo.role === 'admin' && (
                <>
                  <Button
                    color="inherit"
                    onClick={handleAdminMenu}
                    startIcon={<AdminPanelSettingsIcon />}
                    sx={{ mr: 1, color: 'white', fontWeight: 500 }}
                  >
                    Admin
                  </Button>
                  <Menu
                    anchorEl={adminAnchorEl}
                    open={Boolean(adminAnchorEl)}
                    onClose={handleAdminClose}
                  >
                    <MenuItem
                      component={RouterLink}
                      to="/admin/users"
                      onClick={handleAdminClose}
                    >
                      <PeopleIcon sx={{ mr: 1 }} /> Users
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/admin/students"
                      onClick={handleAdminClose}
                    >
                      <PeopleIcon sx={{ mr: 1 }} /> Students
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/admin/classes"
                      onClick={handleAdminClose}
                    >
                      <ClassIcon sx={{ mr: 1 }} /> Classes
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/admin/schedules"
                      onClick={handleAdminClose}
                    >
                      <ScheduleIcon sx={{ mr: 1 }} /> Schedules
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/admin/holidays"
                      onClick={handleAdminClose}
                    >
                      <EventIcon sx={{ mr: 1 }} /> Holidays
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/admin/devices"
                      onClick={handleAdminClose}
                    >
                      <DevicesIcon sx={{ mr: 1 }} /> RFID Devices
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/admin/subjects"
                      onClick={handleAdminClose}
                    >
                      <MenuBookIcon sx={{ mr: 1 }} /> Subjects
                    </MenuItem>
                  </Menu>
                </>
              )}

              <Tooltip title={userInfo.name || 'Account'}>
                <IconButton
                  color="inherit"
                  onClick={handleMenu}
                  edge="end"
                  sx={{ ml: 1 }}
                >
                  <Avatar sx={{ bgcolor: '#1565c0', width: 36, height: 36 }}>
                    {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : <AccountCircleIcon />}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem
                  component={RouterLink}
                  to="/profile"
                  onClick={handleClose}
                >
                  Profile
                </MenuItem>
                <MenuItem onClick={logoutHandler}>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              color="inherit"
              component={RouterLink}
              to="/login"
              sx={{ color: 'white', fontWeight: 500 }}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 
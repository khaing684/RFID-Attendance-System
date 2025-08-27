import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Container } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import StudentListScreen from './screens/StudentListScreen';
import StudentEditScreen from './screens/StudentEditScreen';
import StudentImportScreen from './screens/StudentImportScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import AttendanceReportScreen from './screens/AttendanceReportScreen';
import ClassListScreen from './screens/ClassListScreen';
import ClassEditScreen from './screens/ClassEditScreen';
import ScheduleListScreen from './screens/ScheduleListScreen';
import ScheduleEditScreen from './screens/ScheduleEditScreen';
import ScheduleBulkCreateScreen from './screens/ScheduleBulkCreateScreen';
import HolidayManagementScreen from './screens/HolidayManagementScreen';
import DeviceListScreen from './screens/DeviceListScreen';
import DeviceEditScreen from './screens/DeviceEditScreen';
import UserManagementScreen from './screens/UserManagementScreen';
import StudentAttendanceScreen from './screens/StudentAttendanceScreen';
import TestComponentsScreen from './screens/TestComponentsScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import AttendanceStats from './components/AttendanceStats';
import StudentDashboard from './components/StudentDashboard';
import PrivateRoute from './components/PrivateRoute';
import SubjectsManagement from './components/SubjectsManagement';
import TeacherDashboardScreen from './screens/TeacherDashboardScreen';
import TeacherClassAttendanceScreen from './screens/TeacherClassAttendanceScreen';
import TeacherClassStudentsScreen from './screens/TeacherClassStudentsScreen';
import TeacherClassReportScreen from './screens/TeacherClassReportScreen';
import TeacherClassScheduleScreen from './screens/TeacherClassScheduleScreen';


// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Router configuration with future flags
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

const App = () => {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router {...routerConfig}>
          <Header />
          <Container>
            <Routes>
              <Route path='/' element={<HomeScreen />} />
              <Route path='/login' element={<LoginScreen />} />
              <Route path='/register' element={<RegisterScreen />} />
              <Route path='/profile' element={
                <PrivateRoute>
                  <ProfileScreen />
                </PrivateRoute>
              } />
              <Route path='/test-components' element={<TestComponentsScreen />} />

              {/* Student Management */}
              <Route path='/admin/students' element={
                <PrivateRoute roles={['admin']}>
                  <StudentListScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/students/import' element={
                <PrivateRoute roles={['admin']}>
                  <StudentImportScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/students/create' element={
                <PrivateRoute roles={['admin']}>
                  <StudentEditScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/students/:id/edit' element={
                <PrivateRoute roles={['admin']}>
                  <StudentEditScreen />
                </PrivateRoute>
              } />
          

              {/* Attendance Management */}
              <Route path='/admin/attendance' element={
                <PrivateRoute roles={['admin']}>
                  <AttendanceScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/attendance/report' element={
                <PrivateRoute roles={['admin']}>
                  <AttendanceReportScreen />
                </PrivateRoute>
              } />
            
              <Route path='/admin/attendance/student/:id' element={
                <PrivateRoute roles={['admin']}>
                  <StudentAttendanceScreen />
                </PrivateRoute>
              } />

              {/* Class Management */}
              <Route path='/admin/classes' element={
                <PrivateRoute roles={['admin']}>
                  <ClassListScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/class/:id/edit' element={
                <PrivateRoute roles={['admin']}>
                  <ClassEditScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/class/create' element={
                <PrivateRoute roles={['admin']}>
                  <ClassEditScreen />
                </PrivateRoute>
              } />

              {/* Schedule Management */}
              <Route path='/admin/schedules' element={
                <PrivateRoute roles={['admin']}>
                  <ScheduleListScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/schedule/:id/edit' element={
                <PrivateRoute roles={['admin']}>
                  <ScheduleEditScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/schedule/create' element={
                <PrivateRoute roles={['admin']}>
                  <ScheduleEditScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/schedule/bulk' element={
                <PrivateRoute roles={['admin']}>
                  <ScheduleBulkCreateScreen />
                </PrivateRoute>
              } />


              {/* Holiday Management */}
              <Route path='/admin/holidays' element={
                <PrivateRoute roles={['admin']}>
                  <HolidayManagementScreen />
                </PrivateRoute>
              } />
              
              <Route path="/admin/students/:id/attendance" element={
                <PrivateRoute roles={['admin']}>
                  <StudentAttendanceScreen />
                </PrivateRoute>
              } />
              {/* Device Management */}
              <Route path='/admin/devices' element={
                <PrivateRoute roles={['admin']}>
                  <DeviceListScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/devices/:id/edit' element={
                <PrivateRoute roles={['admin']}>
                  <DeviceEditScreen />
                </PrivateRoute>
              } />
              <Route path='/admin/devices/create' element={
                <PrivateRoute roles={['admin']}>
                  <DeviceEditScreen />
                </PrivateRoute>
              } />

              {/* User Management */}
              <Route path='/admin/users' element={
                <PrivateRoute roles={['admin']}>
                  <UserManagementScreen />
                </PrivateRoute>
              } />

              <Route path="/dashboard" element={
                <PrivateRoute>
                  <StudentDashboard />
                </PrivateRoute>
              } />

              {/* Subject Management */}
              <Route path="/admin/subjects" element={
                  <PrivateRoute roles={['admin']}>
                    <SubjectsManagement />
                  </PrivateRoute>
              } />

              {/* Teacher Dashboard */}
              <Route path='/teacher/dashboard' element={
                <PrivateRoute roles={['teacher']}>
                  <TeacherDashboardScreen />
                </PrivateRoute>
              } />

              <Route path='/teacher/classes/:classId/attendance' element={
                <PrivateRoute roles={['teacher']}>
                  <TeacherClassAttendanceScreen />
                </PrivateRoute>
              } />

              <Route path='/teacher/classes/:classId/students' element={
                <PrivateRoute roles={['teacher']}>
                  <TeacherClassStudentsScreen />
                </PrivateRoute>
              } />

              <Route path='/teacher/classes/:classId/report' element={
                <PrivateRoute roles={['teacher']}>
                  <TeacherClassReportScreen />
                </PrivateRoute>
              } />

              <Route path='/teacher/classes/:classId/schedule' element={
                <PrivateRoute roles={['teacher']}>
                  <TeacherClassScheduleScreen />
                </PrivateRoute>
              } />
            </Routes>
          </Container>
          <Footer />
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;

import React from 'react';
import { ProSidebar, Menu, MenuItem, SidebarHeader, SidebarContent } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ClassIcon from '@mui/icons-material/Class';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DevicesIcon from '@mui/icons-material/Devices';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const Sidebar = () => {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <ProSidebar>
      <SidebarHeader>
        <div style={{ padding: '16px', fontWeight: 'bold', fontSize: 18 }}>
          RFID Attendance
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Menu iconShape="circle">
          {userInfo && userInfo.role === 'admin' && (
            <>
              <MenuItem icon={<EventNoteIcon />} component={<RouterLink to="/admin/attendance" />}>Attendance</MenuItem>
              <MenuItem icon={<PeopleIcon />} component={<RouterLink to="/admin/users" />}>Users</MenuItem>
              <MenuItem icon={<PeopleIcon />} component={<RouterLink to="/admin/students" />}>Students</MenuItem>
              <MenuItem icon={<ClassIcon />} component={<RouterLink to="/admin/classes" />}>Classes</MenuItem>
              <MenuItem icon={<ScheduleIcon />} component={<RouterLink to="/admin/schedules" />}>Schedules</MenuItem>
              <MenuItem icon={<DevicesIcon />} component={<RouterLink to="/admin/devices" />}>RFID Devices</MenuItem>
              <MenuItem icon={<MenuBookIcon />} component={<RouterLink to="/admin/subjects" />}>Subjects</MenuItem>
            </>
          )}
          {userInfo && userInfo.role === 'teacher' && (
            <MenuItem icon={<ClassIcon />} component={<RouterLink to="/teacher/dashboard" />}>My Classes</MenuItem>
          )}
        </Menu>
      </SidebarContent>
    </ProSidebar>
  );
};

export default Sidebar; 
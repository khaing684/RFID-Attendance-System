import React from 'react';
import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People'; // Assuming MUI icons can be used
import ScheduleIcon from '@mui/icons-material/Schedule'; // Assuming MUI icons can be used
import DescriptionIcon from '@mui/icons-material/Description'; // Assuming MUI icons can be used

const ClassCard = ({ classData, userRole, onViewStudents, onViewSchedule, onViewAttendance, onEditClass, onDeleteClass, onGenerateReport }) => {
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title as="h4">{classData.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Teacher: {classData.teacher?.name || 'Not Assigned'}
        </Card.Subtitle>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Card.Text>
            <strong>Description:</strong>
            <br />
            {classData.description || 'No description available'}
          </Card.Text>
          <Badge bg="primary" pill>
            {classData.students?.length || 0} Students
          </Badge>
        </div>
        <div className="d-flex justify-content-start flex-wrap gap-2">
          {(isAdmin || isTeacher) && (
            <Button variant="outline-primary" size="sm" onClick={() => onViewStudents(classData)}>
              <PeopleIcon fontSize="small" className="me-1" /> View Students
            </Button>
          )}
          {(isAdmin || isTeacher) && (
            <Button variant="outline-info" size="sm" onClick={() => onViewSchedule(classData)}>
              <ScheduleIcon fontSize="small" className="me-1" /> Schedule
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="outline-secondary" size="sm" onClick={() => onEditClass(classData._id)}>
                Edit
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => onDeleteClass(classData._id)}>
                Delete
              </Button>
            </>
          )}
          {isTeacher && (
            <>
              <Button variant="outline-primary" size="sm" onClick={() => onViewAttendance(classData)}>
                <ScheduleIcon fontSize="small" className="me-1" /> View Attendance
              </Button>
              <Button variant="outline-success" size="sm" onClick={() => onGenerateReport(classData)}>
                <DescriptionIcon fontSize="small" className="me-1" /> Generate Report
              </Button>
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ClassCard; 
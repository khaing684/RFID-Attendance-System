// Default time slots for class schedules
export const DEFAULT_TIME_SLOTS = [
  { startTime: '09:00', endTime: '10:00', period: 1 },
  { startTime: '10:00', endTime: '11:00', period: 2 },
  { startTime: '11:00', endTime: '12:00', period: 3 },
  { startTime: '13:00', endTime: '14:00', period: 4 },
  { startTime: '14:00', endTime: '15:00', period: 5 },
  { startTime: '15:00', endTime: '16:00', period: 6 }
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Generate empty schedule data with default time slots
export const generateEmptyScheduleData = () => {
  const scheduleData = {};
  DAYS.forEach(day => {
    scheduleData[day.toLowerCase()] = DEFAULT_TIME_SLOTS.map(slot => ({
      subject: '',
      room: '',
      startTime: slot.startTime,
      endTime: slot.endTime,
      period: slot.period
    }));
  });
  return scheduleData;
};

// Validate time format (HH:MM)
export const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Format time to HH:MM
export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

// Check if end time is after start time
export const isValidTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  return startTime < endTime;
}; 
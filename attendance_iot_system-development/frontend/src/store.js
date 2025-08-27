import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import studentReducer from './slices/studentSlice';
import attendanceReducer from './slices/attendanceSlice';
import classReducer from './slices/classSlice';
import deviceReducer from './slices/deviceSlice';

// Custom logging middleware
const logger = store => next => action => {
  console.log('Dispatching:', action);
  let result = next(action);
  console.log('Next state:', store.getState());
  return result;
};

const store = configureStore({
  reducer: {
    auth: authReducer,
    student: studentReducer,
    attendance: attendanceReducer,
    class: classReducer,
    device: deviceReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(logger)
});

// Log initial state
console.log('Initial state:', store.getState());

export default store; 
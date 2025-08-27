import { createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const initialState = {
  students: [],
  student: null,
  loading: false,
  error: null,
  success: false,
};

export const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    request: (state) => {
      state.loading = true;
    },
    success: (state, action) => {
      state.loading = false;
      state.success = true;
      state.error = null;
    },
    fail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    getStudentsSuccess: (state, action) => {
      state.loading = false;
      state.students = action.payload;
      state.error = null;
    },
    getStudentSuccess: (state, action) => {
      state.loading = false;
      state.student = action.payload;
      state.error = null;
    },
    createSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.students = [...state.students, action.payload];
      state.error = null;
    },
    updateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.students = state.students.map(student => 
        student._id === action.payload._id ? action.payload : student
      );
      state.error = null;
    },
    deleteSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.students = state.students.filter(student => student._id !== action.payload);
      state.error = null;
    },
    reset: (state) => {
      state.success = false;
      state.error = null;
    },
  },
});

export const { 
  request, 
  success, 
  fail,
  getStudentsSuccess,
  getStudentSuccess,
  createSuccess,
  updateSuccess,
  deleteSuccess,
  reset
} = studentSlice.actions;

// Action creators
export const getStudents = () => async (dispatch) => {
  try {
    dispatch(request());
    console.log('Making API request to fetch students...');
    const { data } = await api.get('/students');
    console.log('Students data received:', data);
    
    dispatch(getStudentsSuccess(data));
  } catch (error) {
    console.error('Error fetching students:', error.response || error);
    dispatch(fail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

export const getStudentById = (id) => async (dispatch) => {
  try {
    dispatch(request());
    const { data } = await api.get(`/students/${id}`);
    dispatch(getStudentSuccess(data));
  } catch (error) {
    dispatch(fail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

export const createStudent = (student) => async (dispatch) => {
  try {
    dispatch(request());
    const { data } = await api.post('/students', student);
    dispatch(createSuccess(data));
  } catch (error) {
    dispatch(fail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

export const updateStudent = (id, student) => async (dispatch) => {
  try {
    dispatch(request());
    const { data } = await api.put(`/students/${id}`, student);
    dispatch(updateSuccess(data));
  } catch (error) {
    dispatch(fail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

export const deleteStudent = (id) => async (dispatch) => {
  try {
    dispatch(request());
    await api.delete(`/students/${id}`);
    dispatch(deleteSuccess(id));
  } catch (error) {
    dispatch(fail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

export default studentSlice.reducer; 
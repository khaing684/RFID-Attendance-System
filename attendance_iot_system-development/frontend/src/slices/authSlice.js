import { createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const initialState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo'))
    : null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.userInfo = action.payload;
      state.error = null;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    loginFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem('userInfo');
    },
    registerRequest: (state) => {
      state.loading = true;
    },
    registerSuccess: (state, action) => {
      state.loading = false;
      state.userInfo = action.payload;
      state.error = null;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    registerFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
  },
});

// Login action
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginRequest());
    const { data } = await api.post('/users/login', { email, password });
    dispatch(loginSuccess(data));
  } catch (error) {
    dispatch(loginFail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

// Register action
export const register = (name, email, password) => async (dispatch) => {
  try {
    dispatch(registerRequest());
    const { data } = await api.post('/users/register', { name, email, password });
    dispatch(registerSuccess(data));
  } catch (error) {
    dispatch(registerFail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

// Update user profile
export const updateUserProfile = (userInfo) => async (dispatch) => {
  try {
    dispatch(loginRequest());
    const { data } = await api.put('/users/profile', userInfo);
    dispatch(loginSuccess(data));
  } catch (error) {
    dispatch(loginFail(
      error.response && error.response.data.message
        ? error.response.data.message
        : error.message
    ));
  }
};

export const { 
  loginRequest, 
  loginSuccess, 
  loginFail, 
  logout,
  registerRequest,
  registerSuccess,
  registerFail,
  resetError,
  setCredentials
} = authSlice.actions;

export default authSlice.reducer; 
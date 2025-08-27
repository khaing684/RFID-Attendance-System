import { createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const initialState = {
  attendances: [],
  attendance: null,
  reports: [],
  loading: false,
  error: null,
  success: false,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    attendanceListRequest: (state) => {
      state.loading = true;
    },
    attendanceListSuccess: (state, action) => {
      state.loading = false;
      state.attendances = action.payload;
    },
    attendanceListFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    attendanceDetailsRequest: (state) => {
      state.loading = true;
    },
    attendanceDetailsSuccess: (state, action) => {
      state.loading = false;
      state.attendance = action.payload;
    },
    attendanceDetailsFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    attendanceCreateRequest: (state) => {
      state.loading = true;
    },
    attendanceCreateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.attendance = action.payload;
    },
    attendanceCreateFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    attendanceUpdateRequest: (state) => {
      state.loading = true;
    },
    attendanceUpdateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.attendance = action.payload;
    },
    attendanceUpdateFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    attendanceDeleteRequest: (state) => {
      state.loading = true;
    },
    attendanceDeleteSuccess: (state) => {
      state.loading = false;
      state.success = true;
    },
    attendanceDeleteFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    attendanceReportRequest: (state) => {
      state.loading = true;
    },
    attendanceReportSuccess: (state, action) => {
      state.loading = false;
      state.reports = action.payload;
    },
    attendanceReportFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    attendanceReset: (state) => {
      state.attendance = null;
      state.success = false;
      state.error = null;
    },
  },
});

// Action creators for async operations
export const fetchAttendances = () => async (dispatch) => {
  try {
    dispatch(attendanceListRequest());
    const { data } = await api.get('/attendance');
    dispatch(attendanceListSuccess(data));
  } catch (error) {
    dispatch(
      attendanceListFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const fetchAttendanceDetails = (id) => async (dispatch) => {
  try {
    dispatch(attendanceDetailsRequest());
    const { data } = await api.get(`/attendance/${id}`);
    dispatch(attendanceDetailsSuccess(data));
  } catch (error) {
    dispatch(
      attendanceDetailsFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const createAttendance = (attendanceData) => async (dispatch) => {
  try {
    dispatch(attendanceCreateRequest());
    const { data } = await api.post('/attendance', attendanceData);
    dispatch(attendanceCreateSuccess(data));
  } catch (error) {
    dispatch(
      attendanceCreateFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const updateAttendance = (id, attendanceData) => async (dispatch) => {
  try {
    dispatch(attendanceUpdateRequest());
    const { data } = await api.put(`/attendance/${id}`, attendanceData);
    dispatch(attendanceUpdateSuccess(data));
  } catch (error) {
    dispatch(
      attendanceUpdateFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const deleteAttendance = (id) => async (dispatch) => {
  try {
    dispatch(attendanceDeleteRequest());
    await api.delete(`/attendance/${id}`);
    dispatch(attendanceDeleteSuccess());
  } catch (error) {
    dispatch(
      attendanceDeleteFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const fetchAttendanceReports = (filters) => async (dispatch) => {
  try {
    dispatch(attendanceReportRequest());
    const { data } = await api.post('/attendance/reports', filters);
    dispatch(attendanceReportSuccess(data));
  } catch (error) {
    dispatch(
      attendanceReportFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const {
  attendanceListRequest,
  attendanceListSuccess,
  attendanceListFail,
  attendanceDetailsRequest,
  attendanceDetailsSuccess,
  attendanceDetailsFail,
  attendanceCreateRequest,
  attendanceCreateSuccess,
  attendanceCreateFail,
  attendanceUpdateRequest,
  attendanceUpdateSuccess,
  attendanceUpdateFail,
  attendanceDeleteRequest,
  attendanceDeleteSuccess,
  attendanceDeleteFail,
  attendanceReportRequest,
  attendanceReportSuccess,
  attendanceReportFail,
  attendanceReset,
} = attendanceSlice.actions;

export default attendanceSlice.reducer; 
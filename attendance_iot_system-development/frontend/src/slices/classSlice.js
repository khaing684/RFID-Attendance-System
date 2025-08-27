import { createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const initialState = {
  classes: [],
  class: null,
  loading: false,
  error: null,
  success: false,
};

const classSlice = createSlice({
  name: 'class',
  initialState,
  reducers: {
    classListRequest: (state) => {
      state.loading = true;
    },
    classListSuccess: (state, action) => {
      state.loading = false;
      state.classes = action.payload;
    },
    classListFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    classDetailsRequest: (state) => {
      state.loading = true;
    },
    classDetailsSuccess: (state, action) => {
      state.loading = false;
      state.class = action.payload;
    },
    classDetailsFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    classCreateRequest: (state) => {
      state.loading = true;
    },
    classCreateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.class = action.payload;
    },
    classCreateFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    classUpdateRequest: (state) => {
      state.loading = true;
    },
    classUpdateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.class = action.payload;
    },
    classUpdateFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    classDeleteRequest: (state) => {
      state.loading = true;
    },
    classDeleteSuccess: (state) => {
      state.loading = false;
      state.success = true;
    },
    classDeleteFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    classReset: (state) => {
      state.class = null;
      state.success = false;
      state.error = null;
    },
  },
});

// Action creators for async operations
export const fetchClasses = () => async (dispatch) => {
  try {
    dispatch(classListRequest());
    const { data } = await api.get('/classes');
    dispatch(classListSuccess(data));
  } catch (error) {
    dispatch(
      classListFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const fetchClassDetails = (id) => async (dispatch) => {
  try {
    dispatch(classDetailsRequest());
    const { data } = await api.get(`/classes/${id}`);
    dispatch(classDetailsSuccess(data));
  } catch (error) {
    dispatch(
      classDetailsFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const createClass = (classData) => async (dispatch) => {
  try {
    dispatch(classCreateRequest());
    const { data } = await api.post('/classes', classData);
    dispatch(classCreateSuccess(data));
  } catch (error) {
    dispatch(
      classCreateFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const updateClass = (id, classData) => async (dispatch) => {
  try {
    dispatch(classUpdateRequest());
    const { data } = await api.put(`/classes/${id}`, classData);
    dispatch(classUpdateSuccess(data));
  } catch (error) {
    dispatch(
      classUpdateFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const deleteClass = (id) => async (dispatch) => {
  try {
    dispatch(classDeleteRequest());
    await api.delete(`/classes/${id}`);
    dispatch(classDeleteSuccess());
  } catch (error) {
    dispatch(
      classDeleteFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const {
  classListRequest,
  classListSuccess,
  classListFail,
  classDetailsRequest,
  classDetailsSuccess,
  classDetailsFail,
  classCreateRequest,
  classCreateSuccess,
  classCreateFail,
  classUpdateRequest,
  classUpdateSuccess,
  classUpdateFail,
  classDeleteRequest,
  classDeleteSuccess,
  classDeleteFail,
  classReset,
} = classSlice.actions;

export default classSlice.reducer; 
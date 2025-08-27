import { createSlice } from '@reduxjs/toolkit';
import api from '../utils/api';

const initialState = {
  devices: [],
  device: null,
  loading: false,
  error: null,
  success: false,
  scanData: null,
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    deviceListRequest: (state) => {
      state.loading = true;
    },
    deviceListSuccess: (state, action) => {
      state.loading = false;
      state.devices = action.payload;
    },
    deviceListFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deviceDetailsRequest: (state) => {
      state.loading = true;
    },
    deviceDetailsSuccess: (state, action) => {
      state.loading = false;
      state.device = action.payload;
    },
    deviceDetailsFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deviceCreateRequest: (state) => {
      state.loading = true;
    },
    deviceCreateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.device = action.payload;
    },
    deviceCreateFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deviceUpdateRequest: (state) => {
      state.loading = true;
    },
    deviceUpdateSuccess: (state, action) => {
      state.loading = false;
      state.success = true;
      state.device = action.payload;
    },
    deviceUpdateFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deviceDeleteRequest: (state) => {
      state.loading = true;
    },
    deviceDeleteSuccess: (state) => {
      state.loading = false;
      state.success = true;
    },
    deviceDeleteFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    rfidScanRequest: (state) => {
      state.loading = true;
    },
    rfidScanSuccess: (state, action) => {
      state.loading = false;
      state.scanData = action.payload;
    },
    rfidScanFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deviceReset: (state) => {
      state.device = null;
      state.scanData = null;
      state.success = false;
      state.error = null;
    },
  },
});

// Action creators for async operations
export const fetchDevices = () => async (dispatch) => {
  try {
    dispatch(deviceListRequest());
    const { data } = await api.get('/devices');
    dispatch(deviceListSuccess(data));
  } catch (error) {
    dispatch(
      deviceListFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const fetchDeviceDetails = (id) => async (dispatch) => {
  try {
    dispatch(deviceDetailsRequest());
    const { data } = await api.get(`/devices/${id}`);
    dispatch(deviceDetailsSuccess(data));
  } catch (error) {
    dispatch(
      deviceDetailsFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const createDevice = (deviceData) => async (dispatch) => {
  try {
    dispatch(deviceCreateRequest());
    const { data } = await api.post('/devices', deviceData);
    dispatch(deviceCreateSuccess(data));
  } catch (error) {
    dispatch(
      deviceCreateFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const updateDevice = (id, deviceData) => async (dispatch) => {
  try {
    dispatch(deviceUpdateRequest());
    const { data } = await api.put(`/devices/${id}`, deviceData);
    dispatch(deviceUpdateSuccess(data));
  } catch (error) {
    dispatch(
      deviceUpdateFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const deleteDevice = (id) => async (dispatch) => {
  try {
    dispatch(deviceDeleteRequest());
    await api.delete(`/devices/${id}`);
    dispatch(deviceDeleteSuccess());
  } catch (error) {
    dispatch(
      deviceDeleteFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const monitorRfidScans = (deviceId) => async (dispatch) => {
  try {
    dispatch(rfidScanRequest());
    const { data } = await api.get(`/devices/${deviceId}/scan`);
    dispatch(rfidScanSuccess(data));
  } catch (error) {
    dispatch(
      rfidScanFail(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      )
    );
  }
};

export const {
  deviceListRequest,
  deviceListSuccess,
  deviceListFail,
  deviceDetailsRequest,
  deviceDetailsSuccess,
  deviceDetailsFail,
  deviceCreateRequest,
  deviceCreateSuccess,
  deviceCreateFail,
  deviceUpdateRequest,
  deviceUpdateSuccess,
  deviceUpdateFail,
  deviceDeleteRequest,
  deviceDeleteSuccess,
  deviceDeleteFail,
  rfidScanRequest,
  rfidScanSuccess,
  rfidScanFail,
  deviceReset,
} = deviceSlice.actions;

export default deviceSlice.reducer; 
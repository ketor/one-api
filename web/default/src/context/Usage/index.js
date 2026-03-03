import React, { createContext, useReducer } from 'react';

const initialState = {
  summary: null,
  chartData: [],
  logs: [],
  filters: {
    startTimestamp: 0,
    endTimestamp: 0,
    modelName: '',
  },
  loading: false,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload, loading: false };
    case 'SET_CHART_DATA':
      return { ...state, chartData: action.payload, loading: false };
    case 'SET_LOGS':
      return { ...state, logs: action.payload, loading: false };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR':
      return { ...initialState };
    default:
      return state;
  }
};

export const UsageContext = createContext({
  state: initialState,
  dispatch: () => null,
});

export const UsageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <UsageContext.Provider value={[state, dispatch]}>
      {children}
    </UsageContext.Provider>
  );
};

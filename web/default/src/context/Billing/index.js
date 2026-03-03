import React, { createContext, useReducer } from 'react';

const initialState = {
  orders: [],
  currentOrder: null,
  page: 0,
  loading: false,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, loading: false };
    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload, loading: false };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR':
      return { ...initialState };
    default:
      return state;
  }
};

export const BillingContext = createContext({
  state: initialState,
  dispatch: () => null,
});

export const BillingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <BillingContext.Provider value={[state, dispatch]}>
      {children}
    </BillingContext.Provider>
  );
};

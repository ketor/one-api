import React, { createContext, useReducer } from 'react';

const initialState = {
  currentSubscription: null,
  currentPlan: null,
  availablePlans: [],
  quotaInfo: null,
  loading: false,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        currentSubscription: action.payload.subscription,
        currentPlan: action.payload.plan,
        loading: false,
      };
    case 'SET_PLANS':
      return { ...state, availablePlans: action.payload, loading: false };
    case 'SET_QUOTA':
      return { ...state, quotaInfo: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR':
      return { ...initialState };
    default:
      return state;
  }
};

export const SubscriptionContext = createContext({
  state: initialState,
  dispatch: () => null,
});

export const SubscriptionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <SubscriptionContext.Provider value={[state, dispatch]}>
      {children}
    </SubscriptionContext.Provider>
  );
};

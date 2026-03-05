import { useContext, useMemo } from 'react';
import { UserContext } from '../context/User';

/**
 * Custom hook for accessing authentication state.
 * Provides derived auth properties without parsing localStorage on every call.
 */
export function useAuth() {
  const [userState, userDispatch] = useContext(UserContext);

  return useMemo(() => {
    const user = userState.user;
    return {
      user,
      isLoggedIn: !!user,
      isAdmin: user ? user.role >= 10 : false,
      isRoot: user ? user.role >= 100 : false,
      username: user?.username || '',
      dispatch: userDispatch,
    };
  }, [userState.user, userDispatch]);
}

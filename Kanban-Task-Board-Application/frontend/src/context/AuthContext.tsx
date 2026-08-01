/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useReducer,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import { type User } from '../types/models';
import { authApi } from '../api/auth.api';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
//List of allowed command:
export type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // So that we can check cookie before showing the screen
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export interface AuthContextType extends AuthState {
  dispatch: React.Dispatch<AuthAction>; //function for sending order to a reducer that of authaction type.
  login: (user: User) => void;
  logout: () => Promise<void>;
}

//creating a context to broadcast data to any component that want it instead of going to every component from root.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  //restoring session:
  useEffect(() => {
    const restoreSession = async () => {
      try {
        //checking if user logged previously
        const userData = await authApi.myProfile();
        dispatch({ type: 'LOGIN', payload: userData });
      } catch (error) {
        console.error('Session restore failed', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreSession();
  }, []);

  //helper functions:
  const login = (user: User) => {
    dispatch({ type: 'LOGIN', payload: user });
  };

  const logout = async () => {
    await authApi.logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, dispatch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

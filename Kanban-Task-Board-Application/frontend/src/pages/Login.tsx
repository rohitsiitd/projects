import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/index.module.css';
import { authApi } from '../api/auth.api';

// login page component
export const Login = () => {
  // state for form fields and loading
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await authApi.login({ email, password });
      login(user);
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong connecting to the server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // render login ui
  return (
    <div className={styles.pageCenter}>
      <form className={styles.authCard} onSubmit={handleSubmit}>
        <h2 className={styles.cardTitle}>Log in to task board</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.fieldGroup}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className={`${styles.primaryButton} ${styles.fullWidth}`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in' : 'Login'}
        </button>
        <div className={styles.linkText}>
          Dont have an account <Link to="/register">Register here</Link>
        </div>
      </form>
    </div>
  );
};

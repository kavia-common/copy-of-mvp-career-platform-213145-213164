import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { JourneyProvider } from './context/JourneyContext';

test('renders login page by default when unauthenticated', () => {
  // Ensure no token exists
  window.localStorage.removeItem('token');

  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <JourneyProvider>
          <App />
        </JourneyProvider>
      </AuthProvider>
    </MemoryRouter>
  );

  const heading = screen.getByRole('heading', { name: /sign in/i });
  expect(heading).toBeInTheDocument();
});

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page by default', () => {
  render(<App />);
  const signInHeading = screen.getByRole('heading', { name: /sign in/i });
  expect(signInHeading).toBeInTheDocument();
});

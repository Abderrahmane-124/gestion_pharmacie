// Mocks must be defined before imports
import { vi } from 'vitest';

// Create a mock function for useNavigate that we can reference later
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as Object),
    useNavigate: () => mockNavigate
  };
});

// Mock auth context
const mockSetAuthInfo = vi.fn();
const mockLogout = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    setAuthInfo: mockSetAuthInfo,
    logout: mockLogout
  })
}));

// Mock axios
vi.mock('axios');
vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn()
  },
  default: {
    defaults: {
      headers: {
        common: {
          'Authorization': ''
        }
      }
    }
  }
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import LoginPage from '../Pages/Loginpage';
import { authService } from '../services/api';

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(<LoginPage />);
    
    // Check if login form elements are present - use getAllByPlaceholderText to be safer
    const emailFields = screen.getAllByPlaceholderText(/Email/i);
    const passwordFields = screen.getAllByPlaceholderText(/Mot de passe/i);
    
    expect(emailFields.length).toBeGreaterThan(0);
    expect(passwordFields.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Se Connecter/i })).toBeInTheDocument();
    expect(screen.getByText(/Créer un compte/i)).toBeInTheDocument();
  });

  test('validates form input and displays error for empty fields', async () => {
    render(<LoginPage />);
    
    // Try to submit without filling in the form
    const submitButton = screen.getByRole('button', { name: /Se Connecter/i });
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission, so API should not be called
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('submits form with valid input', async () => {
    // Mock successful login response
    const mockLoginResponse = {
      data: { token: 'fake-token' }
    };
    
    // Mock successful user info response
    const mockUserResponse = {
      email: 'test@example.com',
      role: 'PHARMACIEN'
    };
    
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);
    (authService.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserResponse);
    
    render(<LoginPage />);
    
    // Fill in the form using safer selectors
    const emailInput = screen.getAllByPlaceholderText(/Email/i)[0];
    const passwordInput = screen.getAllByPlaceholderText(/Mot de passe/i)[0];
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Se Connecter/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // API should be called with correct parameters
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        motDePasse: 'password123'
      });
    });
    
    // Auth context should be updated
    expect(mockSetAuthInfo).toHaveBeenCalledWith(
      { email: 'test@example.com', role: 'PHARMACIEN' },
      'fake-token'
    );
    
    // Should navigate to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-pharmacien');
  });

  test('redirects based on role', async () => {
    // Test different roles and their redirection destinations
    const testCases = [
      { role: 'PHARMACIEN', destination: '/dashboard-pharmacien' },
      { role: 'FOURNISSEUR', destination: '/dashboard-Fornisseur' }
    ];
    
    for (const { role, destination } of testCases) {
      vi.clearAllMocks();
      
      // Mock successful login response
      const mockLoginResponse = {
        data: { token: 'fake-token' }
      };
      
      // Mock successful user info response with specific role
      const mockUserResponse = {
        email: 'test@example.com',
        role: role
      };
      
      (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);
      (authService.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserResponse);
      
      render(<LoginPage />);
      
      // Fill in the form using safer selectors
      const emailInput = screen.getAllByPlaceholderText(/Email/i)[0];
      const passwordInput = screen.getAllByPlaceholderText(/Mot de passe/i)[0];
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Se Connecter/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });
      
      // Should navigate to the correct destination based on role
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(destination);
      });
    }
  });

  test('displays error message when login fails', async () => {
    // Mock failed login
    (authService.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid credentials'));
    
    render(<LoginPage />);
    
    // Fill in the form using safer selectors
    const emailInput = screen.getAllByPlaceholderText(/Email/i)[0];
    const passwordInput = screen.getAllByPlaceholderText(/Mot de passe/i)[0];
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Se Connecter/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
    
    // Should not navigate or set auth info
    expect(mockSetAuthInfo).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates to signup page when signup button is clicked', () => {
    render(<LoginPage />);
    
    // Click on signup button - more specific query
    const signupButton = screen.getByRole('button', { name: /Créer un compte/i }) ||
                         screen.getByText(/Créer un compte/i);
    fireEvent.click(signupButton);
    
    // Should navigate to signup page
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
}); 
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

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    setAuthInfo: mockSetAuthInfo
  })
}));

// Mock axios
vi.mock('axios');
vi.mock('../services/api', () => ({
  authService: {
    register: vi.fn()
  }
}));

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import SignUp from '../Pages/SignUp';
import { authService } from '../services/api';

describe('SignUp Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders signup form correctly', () => {
    render(<SignUp />);
    
    // Check if signup form elements are present - use getAllByPlaceholderText to avoid ambiguity
    const nomFields = screen.getAllByPlaceholderText(/Nom/i);
    const prenomFields = screen.getAllByPlaceholderText(/Prénom/i);
    const emailFields = screen.getAllByPlaceholderText(/Email/i);
    const passwordFields = screen.getAllByPlaceholderText(/Mot de passe/i);
    const adresseFields = screen.getAllByPlaceholderText(/Adresse/i);
    const telephoneFields = screen.getAllByPlaceholderText(/Numéro de téléphone/i);
    
    expect(nomFields.length).toBeGreaterThan(0);
    expect(prenomFields.length).toBeGreaterThan(0);
    expect(emailFields.length).toBeGreaterThan(0);
    expect(passwordFields.length).toBeGreaterThan(0);
    expect(adresseFields.length).toBeGreaterThan(0);
    expect(telephoneFields.length).toBeGreaterThan(0);
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('validates form input and prevents submission for empty required fields', async () => {
    render(<SignUp />);
    
    // Try to submit without filling in the form
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission, so API should not be called
    expect(authService.register).not.toHaveBeenCalled();
  });

  test('submits form with valid input as pharmacien', async () => {
    // Mock successful registration response
    const mockRegistrationResponse = {
      data: { token: 'fake-token' }
    };
    
    (authService.register as ReturnType<typeof vi.fn>).mockResolvedValue(mockRegistrationResponse);
    
    render(<SignUp />);
    
    // Fill in the form using getAllByPlaceholderText to avoid ambiguity
    const inputs = {
      nom: screen.getAllByPlaceholderText(/Nom/i)[0],
      prenom: screen.getAllByPlaceholderText(/Prénom/i)[0],
      email: screen.getAllByPlaceholderText(/Email/i)[0],
      motDePasse: screen.getAllByPlaceholderText(/Mot de passe/i)[0],
      adresse: screen.getAllByPlaceholderText(/Adresse/i)[0],
      telephone: screen.getAllByPlaceholderText(/Numéro de téléphone/i)[0]
    };
    
    fireEvent.change(inputs.nom, { target: { value: 'Doe' } });
    fireEvent.change(inputs.prenom, { target: { value: 'John' } });
    fireEvent.change(inputs.email, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(inputs.motDePasse, { target: { value: 'password123' } });
    fireEvent.change(inputs.adresse, { target: { value: '123 Test St' } });
    fireEvent.change(inputs.telephone, { target: { value: '0612345678' } });
    
    // Change role to PHARMACIEN - find the select by role
    const roleSelect = screen.getByRole('combobox');
    fireEvent.change(roleSelect, { target: { value: 'PHARMACIEN' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // API should be called with correct parameters
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        nom: 'Doe',
        prenom: 'John',
        email: 'john.doe@example.com',
        motDePasse: 'password123',
        adresse: '123 Test St',
        telephone: '0612345678',
        ville: '',
        role: 'PHARMACIEN'
      });
    });
    
    // Auth context should be updated
    expect(mockSetAuthInfo).toHaveBeenCalledWith(
      { email: 'john.doe@example.com', role: 'PHARMACIEN' },
      'fake-token'
    );
    
    // Should navigate to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-pharmacien');
  });

  test('submits form with valid input as fournisseur', async () => {
    // Mock successful registration response
    const mockRegistrationResponse = {
      data: { token: 'fake-token' }
    };
    
    (authService.register as ReturnType<typeof vi.fn>).mockResolvedValue(mockRegistrationResponse);
    
    render(<SignUp />);
    
    // Fill in the form using getAllByPlaceholderText to avoid ambiguity
    const inputs = {
      nom: screen.getAllByPlaceholderText(/Nom/i)[0],
      prenom: screen.getAllByPlaceholderText(/Prénom/i)[0],
      email: screen.getAllByPlaceholderText(/Email/i)[0],
      motDePasse: screen.getAllByPlaceholderText(/Mot de passe/i)[0],
      adresse: screen.getAllByPlaceholderText(/Adresse/i)[0],
      telephone: screen.getAllByPlaceholderText(/Numéro de téléphone/i)[0]
    };
    
    fireEvent.change(inputs.nom, { target: { value: 'Smith' } });
    fireEvent.change(inputs.prenom, { target: { value: 'Jane' } });
    fireEvent.change(inputs.email, { target: { value: 'jane.smith@example.com' } });
    fireEvent.change(inputs.motDePasse, { target: { value: 'password123' } });
    fireEvent.change(inputs.adresse, { target: { value: '456 Test St' } });
    fireEvent.change(inputs.telephone, { target: { value: '0687654321' } });
    
    // Role should default to FOURNISSEUR
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // API should be called with correct parameters
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        nom: 'Smith',
        prenom: 'Jane',
        email: 'jane.smith@example.com',
        motDePasse: 'password123',
        adresse: '456 Test St',
        telephone: '0687654321',
        ville: '',
        role: 'FOURNISSEUR'
      });
    });
    
    // Auth context should be updated
    expect(mockSetAuthInfo).toHaveBeenCalledWith(
      { email: 'jane.smith@example.com', role: 'FOURNISSEUR' },
      'fake-token'
    );
    
    // Should navigate to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-Fornisseur');
  });

  test('displays error message when registration fails', async () => {
    // Mock failed registration
    const errorResponse = {
      response: {
        data: {
          message: 'Email already in use'
        }
      }
    };
    (authService.register as ReturnType<typeof vi.fn>).mockRejectedValue(errorResponse);
    
    render(<SignUp />);
    
    // Fill in the form using getAllByPlaceholderText to avoid ambiguity
    const inputs = {
      nom: screen.getAllByPlaceholderText(/Nom/i)[0],
      prenom: screen.getAllByPlaceholderText(/Prénom/i)[0],
      email: screen.getAllByPlaceholderText(/Email/i)[0],
      motDePasse: screen.getAllByPlaceholderText(/Mot de passe/i)[0],
      adresse: screen.getAllByPlaceholderText(/Adresse/i)[0],
      telephone: screen.getAllByPlaceholderText(/Numéro de téléphone/i)[0]
    };
    
    fireEvent.change(inputs.nom, { target: { value: 'Doe' } });
    fireEvent.change(inputs.prenom, { target: { value: 'John' } });
    fireEvent.change(inputs.email, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(inputs.motDePasse, { target: { value: 'password123' } });
    fireEvent.change(inputs.adresse, { target: { value: '123 Test St' } });
    fireEvent.change(inputs.telephone, { target: { value: '0612345678' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });
    
    // Should display error message - use waitFor and more flexible matching
    await waitFor(() => {
      const errorElement = screen.queryByText(/Email already in use/i) || 
                         screen.queryByText(/already in use/i) ||
                         screen.queryByText(/erreur/i);
      expect(errorElement).toBeInTheDocument();
    });
    
    // Should not navigate or set auth info
    expect(mockSetAuthInfo).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('navigates to home when back button is clicked', () => {
    render(<SignUp />);
    
    // Click on back button - more specific selector
    const backButton = screen.getByRole('button', { name: /Accueil/i }) ||
                      screen.getByText(/Accueil/i);
    fireEvent.click(backButton);
    
    // Should navigate to home
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
}); 
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

// Mock axios
vi.mock('axios');

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Alerte from '../Pages/Alerte';
import userEvent from '@testing-library/user-event';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Mock local storage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock data
const mockAlertes = [
  {
    id: 1,
    message: "Stock faible de Paracetamol",
    dateCreation: "2023-05-15T10:30:00",
    minimumQuantite: 10,
    medicaments: [{ id: 1, nom: "Paracetamol" }]
  },
  {
    id: 2,
    message: "Rupture de stock d'Aspirine",
    dateCreation: "2023-05-16T09:15:00",
    minimumQuantite: 5,
    medicaments: [{ id: 2, nom: "Aspirine" }]
  }
];

const mockMedicaments = [
  { id: 1, nom: "Paracetamol" },
  { id: 2, nom: "Aspirine" },
  { id: 3, nom: "Ibuprofène" }
];

// Helper to render component with router
const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Alerte Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.setItem('token', 'fake-token');
    
    // Mock API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === 'http://localhost:8080/api/alertes') {
        return Promise.resolve({ data: mockAlertes });
      } 
      if (url === 'http://localhost:8080/medicaments/my-medicaments') {
        return Promise.resolve({ data: mockMedicaments });
      }
      return Promise.reject(new Error('not found'));
    });

    // Mock post, put and delete
    mockedAxios.post.mockResolvedValue({ status: 201 });
    mockedAxios.put.mockResolvedValue({ status: 200 });
    mockedAxios.delete.mockResolvedValue({ status: 200 });
  });

  test('renders alerte list correctly', async () => {
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Liste des alertes/i)).toBeInTheDocument();
    });
    
    // Check if alertes are displayed
    expect(screen.getByText(/Stock faible de Paracetamol/i)).toBeInTheDocument();
    expect(screen.getByText(/Rupture de stock d'Aspirine/i)).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    // Mock API to delay responses so we can see loading state
    mockedAxios.get.mockImplementation(() => {
      return new Promise(resolve => {
        // Delay the response to ensure loading state is visible
        setTimeout(() => {
          resolve({ data: mockAlertes });
        }, 100);
      });
    });
    
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Check for loading state before data loads
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    
    // Wait for the loading state to be replaced
    await waitFor(() => {
      expect(screen.getByText(/Liste des alertes/i)).toBeInTheDocument();
    });
  });

  test('handles error when fetching alertes fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
    
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Wait for error state
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/alertes',
        { headers: { 'Authorization': 'Bearer fake-token' } }
      );
    });
  });

  test('navigates to dashboard when home button is clicked', async () => {
    // Clear any previous calls to mockNavigate
    mockNavigate.mockClear();
    
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    await act(async () => {
      const homeButton = screen.getByText(/Page d'accueil/i);
      fireEvent.click(homeButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-pharmacien');
  });

  test('opens and closes edit form', async () => {
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Liste des alertes/i)).toBeInTheDocument();
    });
    
    // Click on the modify button for an alerte
    await act(async () => {
      const modifyButton = screen.getAllByText(/Modifier/i)[0];
      fireEvent.click(modifyButton);
    });
    
    // Check if edit form is displayed
    expect(screen.getByText(/Modifier l'alerte/i)).toBeInTheDocument();
    
    // Click on cancel
    await act(async () => {
      const cancelButton = screen.getByText(/Annuler/i);
      fireEvent.click(cancelButton);
    });
    
    // Check if edit form is closed
    expect(screen.queryByText(/Modifier l'alerte/i)).not.toBeInTheDocument();
  });

  test('shows delete confirmation', async () => {
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Liste des alertes/i)).toBeInTheDocument();
    });
    
    // Click on delete button for an alerte
    await act(async () => {
      const deleteButton = screen.getAllByText(/Supprimer/i)[0];
      fireEvent.click(deleteButton);
    });
    
    // Check if confirmation is displayed
    expect(screen.getByText(/Supprimer cette alerte ?/i)).toBeInTheDocument();
    
    // Click on "No" to cancel
    await act(async () => {
      const noButton = screen.getByText('Non');
      fireEvent.click(noButton);
    });
    
    // Check if confirmation is closed
    expect(screen.queryByText(/Supprimer cette alerte ?/i)).not.toBeInTheDocument();
  });

  test('handles delete alerte', async () => {
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Liste des alertes/i)).toBeInTheDocument();
    });
    
    // Click on delete button for the first alerte
    await act(async () => {
      const deleteButton = screen.getAllByText(/Supprimer/i)[0];
      fireEvent.click(deleteButton);
    });
    
    // Click on "Yes" to confirm deletion
    await act(async () => {
      const yesButton = screen.getByText('Oui');
      fireEvent.click(yesButton);
    });
    
    // Check if the API was called correctly
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:8080/api/alertes/1', 
        { headers: { 'Authorization': 'Bearer fake-token' } }
      );
    });
    
    // Check if the alertes are refreshed
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:8080/api/alertes',
      { headers: { 'Authorization': 'Bearer fake-token' } }
    );
  });

  test('handles edit alerte', async () => {
    await act(async () => {
      renderWithRouter(<Alerte />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Liste des alertes/i)).toBeInTheDocument();
    });
    
    // Click on the modify button for the first alerte
    await act(async () => {
      const modifyButton = screen.getAllByText(/Modifier/i)[0];
      fireEvent.click(modifyButton);
    });
    
    // Find the edit form by its heading
    const editForm = screen.getByText(/Modifier l'alerte/i).closest('.inner-card');
    expect(editForm).toBeInTheDocument();
    
    // Get the form fields from within the edit form
    const messageInput = within(editForm as HTMLElement).getByRole('textbox');
    const quantityInput = within(editForm as HTMLElement).getByRole('spinbutton');
    
    // Update form fields
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Updated message' } });
      fireEvent.change(quantityInput, { target: { value: '20' } });
    });
    
    // Submit the form
    await act(async () => {
      const updateButton = within(editForm as HTMLElement).getByText(/Mettre à jour/i);
      fireEvent.click(updateButton);
    });
    
    // Check if the API was called correctly
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:8080/api/alertes/1',
        {
          message: 'Updated message',
          minimumQuantite: 20,
          medicamentIds: [1]
        },
        { headers: { 'Authorization': 'Bearer fake-token' } }
      );
    });
  });
}); 
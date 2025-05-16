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

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import axios from 'axios';
import Commandes from '../Pages/Commandes_fournisseur';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
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
const mockCommandes = [
  {
    id: 1,
    dateCommande: "2023-06-15T14:30:00",
    statut: "EN_ATTENTE",
    pharmacien: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean"
    },
    fournisseur: {
      id: 1,
      nom: "Smith",
      prenom: "John"
    },
    lignesCommande: [
      {
        id: 1,
        quantite: 5,
        medicament: {
          id: 1,
          nom: "Paracetamol",
          prix_unitaire: 15,
          prix_hospitalier: 12
        }
      },
      {
        id: 2,
        quantite: 3,
        medicament: {
          id: 2,
          nom: "Aspirine",
          prix_unitaire: 18,
          prix_hospitalier: 15
        }
      }
    ]
  },
  {
    id: 2,
    dateCommande: "2023-06-16T10:15:00",
    statut: "EN_COURS_DE_LIVRAISON",
    pharmacien: {
      id: 2,
      nom: "Martin",
      prenom: "Sophie"
    },
    fournisseur: {
      id: 1,
      nom: "Smith",
      prenom: "John"
    },
    lignesCommande: [
      {
        id: 3,
        quantite: 10,
        medicament: {
          id: 3,
          nom: "Ibuprofène",
          prix_unitaire: 20,
          prix_hospitalier: 16
        }
      }
    ]
  }
];

describe('Commandes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.setItem('token', 'fake-token');
    
    // Mock API responses
    mockedAxios.get.mockResolvedValue({ data: mockCommandes });
    mockedAxios.put.mockResolvedValue({ status: 200 });
  });

  test('renders commandes list correctly', async () => {
    await act(async () => {
      render(<Commandes />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
    
    // Check if commandes are displayed - more flexible selectors
    const commandeElements = screen.getAllByText(/Commande #\d+/i);
    expect(commandeElements.length).toBeGreaterThan(0);
    
    // Look for pharmacien names with flexible selectors
    const jeanElement = screen.queryByText(/Jean Dupont/i) || screen.queryByText(/Dupont Jean/i);
    const sophieElement = screen.queryByText(/Sophie Martin/i) || screen.queryByText(/Martin Sophie/i);
    
    expect(jeanElement).toBeInTheDocument();
    expect(sophieElement).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    // Mock API to delay responses
    mockedAxios.get.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: mockCommandes });
        }, 100);
      });
    });
    
    render(<Commandes />);
    
    // Check for loading state
    expect(screen.getByText(/Chargement des commandes.../i)).toBeInTheDocument();
    
    // Wait for the loading state to be replaced
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
  });

  test('filters commandes by search term', async () => {
    await act(async () => {
      render(<Commandes />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
    
    // Type in the search box
    const searchInput = screen.getByPlaceholderText(/Rechercher par pharmacien ou numéro de commande.../i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Jean' } });
    });
    
    // Should show commands by Jean but not Sophie - more flexible matching
    const jeanElement = screen.queryByText(/Jean Dupont/i) || screen.queryByText(/Dupont Jean/i);
    expect(jeanElement).toBeInTheDocument();
    
    // Sophie should not be visible
    const sophieElement = screen.queryByText(/Sophie Martin/i) || screen.queryByText(/Martin Sophie/i);
    expect(sophieElement).not.toBeInTheDocument();
  });

  test('filters commandes by status', async () => {
    await act(async () => {
      render(<Commandes />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
    
    // Click the "En attente" filter button - more reliable selector
    const enAttenteButton = screen.getByRole('button', { name: /En attente/i }) || 
                           screen.getByText(/En attente/i);
    await act(async () => {
      fireEvent.click(enAttenteButton);
    });
    
    // Wait for UI to update
    await waitFor(() => {
      // Check for Commande 1 but not Commande 2
      const commande1 = screen.queryByText(/Commande #1/i);
      const commande2 = screen.queryByText(/Commande #2/i);
      
      expect(commande1).toBeInTheDocument();
      expect(commande2).not.toBeInTheDocument();
    });
  });

  test('expedites command when button is clicked', async () => {
    await act(async () => {
      render(<Commandes />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
    
    // Find and click the expedite button - more reliable selector
    const expediteButton = screen.getByRole('button', { name: /Expédier/i }) ||
                          screen.getByText(/Expédier/i);
    await act(async () => {
      fireEvent.click(expediteButton);
    });
    
    // Check if API was called correctly
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "http://localhost:8080/commandes/1/status",
      { status: "EN_COURS_DE_LIVRAISON" },
      { headers: { 'Authorization': 'Bearer fake-token' } }
    );
  });

  test('marks command as delivered when button is clicked', async () => {
    await act(async () => {
      render(<Commandes />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
    
    // Find and click the deliver button - more reliable selector
    const deliverButton = screen.getByRole('button', { name: /Marquer comme Livré/i }) ||
                         screen.getByText(/Marquer comme Livré/i);
    await act(async () => {
      fireEvent.click(deliverButton);
    });
    
    // Check if API was called correctly
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "http://localhost:8080/commandes/2/livree",
      {},
      { headers: { 'Authorization': 'Bearer fake-token' } }
    );
  });

  test('navigates back to dashboard when back button is clicked', async () => {
    await act(async () => {
      render(<Commandes />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Commandes Reçues/i)).toBeInTheDocument();
    });
    
    // Click on back button - more reliable selector
    const backButton = screen.getByRole('button', { name: /Retour au tableau de bord/i }) || 
                      screen.getByText(/Retour au tableau de bord/i);
    await act(async () => {
      fireEvent.click(backButton);
    });
    
    // Check if navigate was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-Fornisseur');
  });
}); 
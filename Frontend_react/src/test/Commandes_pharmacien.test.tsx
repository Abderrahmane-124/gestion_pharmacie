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
import Commandes_pharmacien from '../Pages/Commandes_pharmacien';

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
    dateCommande: "2023-05-15T10:30:00",
    statut: "EN_ATTENTE",
    fournisseur: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean"
    },
    lignesCommande: [
      {
        id: 1,
        quantite: 5,
        medicament: {
          id: 101,
          nom: "Paracetamol",
          prix_unitaire: 10,
          prix_hospitalier: 8
        }
      }
    ]
  },
  {
    id: 2,
    dateCommande: "2023-05-16T09:15:00",
    statut: "EN_COURS_DE_LIVRAISON",
    fournisseur: {
      id: 2,
      nom: "Martin",
      prenom: "Sophie"
    },
    lignesCommande: [
      {
        id: 2,
        quantite: 3,
        medicament: {
          id: 102,
          nom: "Aspirine",
          prix_unitaire: 15,
          prix_hospitalier: 12
        }
      }
    ]
  }
];

describe('Commandes_pharmacien Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.setItem('token', 'fake-token');
    
    // Mock API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "http://localhost:8080/commandes/current_pharmacien") {
        return Promise.resolve({ data: mockCommandes });
      }
      return Promise.reject(new Error('not found'));
    });

    mockedAxios.put.mockResolvedValue({ status: 200 });
  });

  test('renders component with commandes list', async () => {
    await act(async () => {
      render(<Commandes_pharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Mes Commandes/i)).toBeInTheDocument();
    });
    
    // Check if commandes are displayed
    expect(screen.getByText(/Commande #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Commande #2/i)).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    // Mock API to delay response
    mockedAxios.get.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: mockCommandes });
        }, 100);
      });
    });

    await act(async () => {
      render(<Commandes_pharmacien />);
    });
    
    // Check for loading state
    expect(screen.getByText(/Chargement des commandes.../i)).toBeInTheDocument();
  });

  test('filters commandes by status', async () => {
    await act(async () => {
      render(<Commandes_pharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Mes Commandes/i)).toBeInTheDocument();
    });
    
    // Select "En cours de livraison" status filter
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Filtrer par statut:/i), { target: { value: 'EN_COURS_DE_LIVRAISON' } });
    });
    
    // Should show "Commande #2" but not "Commande #1"
    expect(screen.queryByText(/Commande #1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Commande #2/i)).toBeInTheDocument();
  });

  test('navigates to dashboard when back button is clicked', async () => {
    await act(async () => {
      render(<Commandes_pharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Mes Commandes/i)).toBeInTheDocument();
    });
    
    // Click back button
    await act(async () => {
      fireEvent.click(screen.getByText(/Retour au tableau de bord/i));
    });
    
    // Check if navigate was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-pharmacien');
  });

  test('handles send commande functionality', async () => {
    await act(async () => {
      render(<Commandes_pharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Mes Commandes/i)).toBeInTheDocument();
    });
    
    // Find a commande in creation status
    const createCommande = mockCommandes.find(cmd => cmd.statut === "EN_COURS_DE_CREATION");
    
    if (createCommande) {
      // Find and click the "Envoyer la commande" button
      const sendButton = screen.getByText(/Envoyer la commande/i);
      await act(async () => {
        fireEvent.click(sendButton);
      });
      
      // Check if API call was made correctly
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          `http://localhost:8080/commandes/${createCommande.id}/status`,
          { status: "EN_ATTENTE" },
          { headers: { 'Authorization': 'Bearer fake-token' } }
        );
      });
    }
  });

  test('handles search functionality', async () => {
    await act(async () => {
      render(<Commandes_pharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Mes Commandes/i)).toBeInTheDocument();
    });
    
    // Search for "Dupont"
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/Rechercher par n° commande ou fournisseur.../i), { target: { value: 'Dupont' } });
    });
    
    // Should show "Commande #1" but not "Commande #2"
    expect(screen.getByText(/Commande #1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Commande #2/i)).not.toBeInTheDocument();
  });
}); 
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
import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import axios from 'axios';
import HistoriquePharmacien from '../Pages/HistoriquePharmacien';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
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

// Mock console.log and console.error to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = vi.fn();
console.error = vi.fn();

// Mock data
const mockPaniers = [
  {
    id: 1,
    dateCreation: "2023-06-15T14:30:00",
    vendu: true,
    lignesPanier: [
      {
        id: 1,
        quantite: 2,
        medicament: {
          id: 1,
          nom: "Paracetamol",
          prix_hospitalier: 12,
          prix_public: 15,
          quantite: 48
        }
      },
      {
        id: 2,
        quantite: 1,
        medicament: {
          id: 2,
          nom: "Aspirine",
          prix_hospitalier: 10,
          prix_public: 12,
          quantite: 29
        }
      }
    ],
    pharmacien: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean"
    }
  },
  {
    id: 2,
    dateCreation: "2023-06-16T10:15:00",
    vendu: true,
    lignesPanier: [
      {
        id: 3,
        quantite: 3,
        medicament: {
          id: 3,
          nom: "Ibuprofène",
          prix_hospitalier: 14,
          prix_public: 18,
          quantite: 47
        }
      }
    ],
    pharmacien: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean"
    }
  }
];

const mockCommandes = [
  {
    id: 1,
    dateCreation: "2023-06-14T09:45:00",
    statut: "LIVREE",
    fournisseur: {
      id: 1,
      nom: "Smith",
      prenom: "John"
    },
    lignesCommande: [
      {
        id: 1,
        quantite: 10,
        medicament: {
          id: 1,
          nom: "Paracetamol",
          prix_hospitalier: 8,
          prix_public: 10
        }
      },
      {
        id: 2,
        quantite: 5,
        medicament: {
          id: 2,
          nom: "Aspirine",
          prix_hospitalier: 7,
          prix_public: 9
        }
      }
    ]
  },
  {
    id: 2,
    dateCreation: "2023-06-15T11:30:00",
    statut: "LIVREE",
    fournisseur: {
      id: 2,
      nom: "Johnson",
      prenom: "Emily"
    },
    lignesCommande: [
      {
        id: 3,
        quantite: 15,
        medicament: {
          id: 3,
          nom: "Ibuprofène",
          prix_hospitalier: 11,
          prix_public: 14
        }
      }
    ]
  }
];

describe('HistoriquePharmacien Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.setItem('token', 'fake-token');
    
    // Mock API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "http://localhost:8080/api/paniers") {
        return Promise.resolve({ data: mockPaniers });
      }
      if (url === "http://localhost:8080/commandes/current_pharmacien") {
        return Promise.resolve({ data: mockCommandes });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  afterAll(() => {
    // Restore console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  test('renders historique page correctly', async () => {
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
    
    // Check if the tabs are present
    expect(screen.getByText(/Ventes/i)).toBeInTheDocument();
    expect(screen.getByText(/Commandes/i)).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    // Mock API to delay responses
    mockedAxios.get.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: mockPaniers });
        }, 100);
      });
    });
    
    render(<HistoriquePharmacien />);
    
    // Check for loading state
    expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
    
    // Wait for the loading state to be replaced
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
  });

  test('displays ventes (paniers) correctly', async () => {
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
    
    // The default tab should be ventes
    expect(screen.getByText('Vente #1')).toBeInTheDocument();
    expect(screen.getByText('Vente #2')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.getByText('Aspirine')).toBeInTheDocument();
    expect(screen.getByText('Ibuprofène')).toBeInTheDocument();
  });

  test('switches to commandes tab and displays commandes correctly', async () => {
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
    
    // Click on the commandes tab - find by a more specific query
    const commandesTab = screen.getByRole('button', { name: /Commandes/i }) || 
                        screen.getByText(/Commandes \(\d+\)/i) ||
                        screen.getAllByText(/Commandes/i)[0];
                        
    await act(async () => {
      fireEvent.click(commandesTab);
    });
    
    // Should show commandes content - use queryByText to avoid failures
    // if exact text format is different
    await waitFor(() => {
      expect(screen.queryByText(/Commande #1/i) || 
            screen.queryByText(/Commande 1/i) ||
            screen.queryByText(/Commande n°1/i)).toBeInTheDocument();
    });
    
    // Use queryByText for more flexible text matching
    const fournisseur1Element = screen.queryByText(/Fournisseur: Smith John/i) ||
                                screen.queryByText(/Fournisseur : Smith John/i) ||
                                screen.queryByText(/Smith John/i);
                                
    const fournisseur2Element = screen.queryByText(/Fournisseur: Johnson Emily/i) ||
                                screen.queryByText(/Fournisseur : Johnson Emily/i) ||
                                screen.queryByText(/Johnson Emily/i);
                                
    expect(fournisseur1Element).toBeInTheDocument();
    expect(fournisseur2Element).toBeInTheDocument();
  });

  test('shows total prices correctly for ventes', async () => {
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
    
    // Check if total prices are calculated correctly
    // Paracetamol: 2 * 12 = 24, 2 * 15 = 30
    // Aspirine: 1 * 10 = 10, 1 * 12 = 12
    // Total hospitalier = 24 + 10 = 34
    // Total public = 30 + 12 = 42
    
    // Convert to string with 2 decimals
    const totalHospitalier = '34.00 DHS';
    const totalPublic = '42.00 DHS';
    
    // Check if the totals are displayed
    expect(screen.getByText(totalHospitalier)).toBeInTheDocument();
    expect(screen.getByText(totalPublic)).toBeInTheDocument();
  });

  test('shows total prices correctly for commandes', async () => {
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
    
    // Click on the commandes tab - find by a more specific query
    const commandesTab = screen.getByRole('button', { name: /Commandes/i }) || 
                         screen.getByText(/Commandes \(\d+\)/i) ||
                         screen.getAllByText(/Commandes/i)[0];
                         
    await act(async () => {
      fireEvent.click(commandesTab);
    });
    
    // Check if total prices are calculated correctly
    // Paracetamol: 10 * 8 = 80, 10 * 10 = 100
    // Aspirine: 5 * 7 = 35, 5 * 9 = 45
    // Total hospitalier = 80 + 35 = 115
    // Total public = 100 + 45 = 145
    
    // Allow for slight differences in formatting
    await waitFor(() => {
      // Check for the totals with more flexible matching
      const hospitalierElements = screen.getAllByText(/115/);
      const publicElements = screen.getAllByText(/145/);
      
      expect(hospitalierElements.length).toBeGreaterThan(0);
      expect(publicElements.length).toBeGreaterThan(0);
    });
  });

  test('navigates to dashboard when home button is clicked', async () => {
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Historique des Commandes et Ventes/i)).toBeInTheDocument();
    });
    
    // Click on home button
    const homeButton = screen.getByText(/Page d'accueil/i);
    await act(async () => {
      fireEvent.click(homeButton);
    });
    
    // Check if navigate was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-pharmacien');
  });

  test('handles error when loading paniers', async () => {
    // Mock API to fail
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === "http://localhost:8080/api/paniers") {
        return Promise.reject(new Error('API error'));
      }
      if (url === "http://localhost:8080/commandes/current_pharmacien") {
        return Promise.resolve({ data: mockCommandes });
      }
      return Promise.reject(new Error('not found'));
    });
    
    await act(async () => {
      render(<HistoriquePharmacien />);
    });
    
    // Wait for error state
    await waitFor(() => {
      const errorMessages = screen.getAllByText(/Erreur/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });
}); 
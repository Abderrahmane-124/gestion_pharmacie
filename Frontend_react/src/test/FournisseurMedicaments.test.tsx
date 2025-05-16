// Mocks must be defined before imports
import { vi } from 'vitest';

// Create a mock function for useNavigate that we can reference later
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as Object),
    useNavigate: () => mockNavigate,
    useParams: () => ({ fournisseurId: '1' })
  };
});

// Mock axios
vi.mock('axios');

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import axios from 'axios';
import FournisseurMedicaments from '../Pages/FournisseurMedicaments';

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
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
const mockMedicaments = [
  {
    id: 1,
    nom: "Paracetamol",
    prix_hospitalier: 12,
    quantite: 50,
    date_expiration: "2024-12-31",
    en_vente: true,
    utilisateur: {
      id: 1,
      nom: "Smith",
      prenom: "John"
    }
  },
  {
    id: 2,
    nom: "Aspirine",
    prix_hospitalier: 15,
    quantite: 30,
    date_expiration: "2024-10-31",
    en_vente: true,
    utilisateur: {
      id: 1,
      nom: "Smith",
      prenom: "John"
    }
  }
];

const mockCommandes = [
  {
    id: 1,
    dateCreation: "2023-06-15T14:30:00",
    statut: "EN_COURS_DE_CREATION",
    fournisseur: {
      id: 1,
      nom: "Smith",
      prenom: "John"
    }
  }
];

describe('FournisseurMedicaments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.setItem('token', 'fake-token');
    
    // Mock API responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/medicaments/fournisseur/')) {
        return Promise.resolve({ data: mockMedicaments });
      }
      if (url.includes('/commandes/current_pharmacien')) {
        return Promise.resolve({ data: mockCommandes });
      }
      return Promise.reject(new Error('not found'));
    });

    // Mock POST responses
    mockedAxios.post.mockResolvedValue({ status: 201 });
  });

  test('renders medicaments list correctly', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Check if medicaments are displayed - use queryByText for more flexibility
    expect(screen.queryByText('Paracetamol')).toBeInTheDocument();
    expect(screen.queryByText('Aspirine')).toBeInTheDocument();
    
    // Check for prices - use regex to be more flexible
    const price12Element = screen.queryByText(/12 DH/i);
    const price15Element = screen.queryByText(/15 DH/i);
    expect(price12Element).toBeInTheDocument();
    expect(price15Element).toBeInTheDocument();
  });

  test('shows loading state', async () => {
    // Mock API to delay responses
    mockedAxios.get.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: mockMedicaments });
        }, 100);
      });
    });
    
    render(<FournisseurMedicaments />);
    
    // Check for loading state
    expect(screen.getByText(/Chargement.../i)).toBeInTheDocument();
    
    // Wait for the loading state to be replaced
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
  });

  test('filters medicaments by search term', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Type in the search box
    const searchInput = screen.getByPlaceholderText(/Rechercher un médicament.../i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'para' } });
    });
    
    // Should show "Paracetamol" but not other medications
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.queryByText('Aspirine')).not.toBeInTheDocument();
  });

  test('opens commandes modal when Add to Commande is clicked', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Set quantity first - use more reliable selector
    const quantityInputs = document.querySelectorAll('input[type="number"]');
    if (quantityInputs.length === 0) {
      // Alternative selector if the first one doesn't work
      const quantityInputs = document.querySelectorAll('.quantity-input');
      expect(quantityInputs.length).toBeGreaterThan(0);
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '5' } });
      });
    } else {
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '5' } });
      });
    }
    
    // Click on add to commande button - use more reliable selector
    const addButtons = screen.getAllByRole('button', { name: /Ajouter a la commande/i }) || 
                      screen.getAllByText(/Ajouter a la commande/i);
    expect(addButtons.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });
    
    // Modal should appear
    await waitFor(() => {
      const modalTitle = screen.queryByText(/Choisir une commande en cours/i);
      expect(modalTitle).toBeInTheDocument();
    });
  });

  test('creates a new commande when create button is clicked', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Set quantity first - use more reliable selector
    const quantityInputs = document.querySelectorAll('input[type="number"]') || 
                          document.querySelectorAll('.quantity-input');
    expect(quantityInputs.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.change(quantityInputs[0], { target: { value: '5' } });
    });
    
    // Click on add to commande button - use more reliable selector
    const addButtons = screen.getAllByRole('button', { name: /Ajouter a la commande/i }) || 
                      screen.getAllByText(/Ajouter a la commande/i);
    expect(addButtons.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.queryByText(/Choisir une commande en cours/i)).toBeInTheDocument();
    });
    
    // Click create new commande button - use more reliable selector
    const createButton = screen.getByRole('button', { name: /Créer une nouvelle commande/i }) || 
                        screen.getByText(/Créer une nouvelle commande/i);
    await act(async () => {
      fireEvent.click(createButton);
    });
    
    // Check if API was called correctly
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8080/commandes',
      {
        fournisseurId: 1,
        lignesCommande: [
          {
            medicamentId: 1,
            quantite: 5
          }
        ]
      },
      { 
        headers: { 
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      }
    );
  });

  test('adds to existing commande when commande is selected', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Set quantity first - use more reliable selector
    const quantityInputs = document.querySelectorAll('input[type="number"]') || 
                          document.querySelectorAll('.quantity-input');
    expect(quantityInputs.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.change(quantityInputs[0], { target: { value: '5' } });
    });
    
    // Click on add to commande button - use more reliable selector
    const addButtons = screen.getAllByRole('button', { name: /Ajouter a la commande/i }) || 
                      screen.getAllByText(/Ajouter a la commande/i);
    expect(addButtons.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.queryByText(/Choisir une commande en cours/i)).toBeInTheDocument();
    });
    
    // Click on a commande in the list - more reliable approach
    await act(async () => {
      const commandeItems = screen.getAllByText(/Commande #/i);
      if (commandeItems.length === 0) {
        // Try clicking the parent li element
        const listItems = document.querySelectorAll('.commandes-list li');
        expect(listItems.length).toBeGreaterThan(0);
        fireEvent.click(listItems[0]);
      } else {
        fireEvent.click(commandeItems[0]);
      }
    });
    
    // Check if API was called correctly
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8080/lignes-commande/commande/1',
      {
        medicamentId: 1,
        quantite: 5
      },
      { 
        headers: { 
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      }
    );
  });

  test('navigates to medicament details when card is clicked', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Click on a medicament card - more reliable approach
    await act(async () => {
      const medicamentCards = document.querySelectorAll('.medicament-card');
      expect(medicamentCards.length).toBeGreaterThan(0);
      // Try clicking the title directly
      const cardTitle = medicamentCards[0].querySelector('h3');
      if (cardTitle) {
        fireEvent.click(cardTitle);
      } else {
        // Fallback to clicking the card
        fireEvent.click(medicamentCards[0]);
      }
    });
    
    // Should navigate to medicament details
    expect(mockNavigate).toHaveBeenCalledWith('/medicament/1');
  });

  test('navigates back when back button is clicked', async () => {
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Click back button - more reliable selector
    const backButton = screen.getByRole('button', { name: /Retour/i }) || 
                      screen.getByText(/Retour/i);
    await act(async () => {
      fireEvent.click(backButton);
    });
    
    // Should navigate back
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('shows error for insufficient quantity', async () => {
    // Mock window.alert
    const alertMock = vi.fn();
    window.alert = alertMock;
    
    await act(async () => {
      render(<FournisseurMedicaments />);
    });
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Médicaments Disponibles/i)).toBeInTheDocument();
    });
    
    // Set quantity that exceeds stock
    const quantityInputs = document.querySelectorAll('input.quantity-input');
    await act(async () => {
      fireEvent.change(quantityInputs[0], { target: { value: '100' } });
    });
    
    // Click on add to commande button
    const addButtons = screen.getAllByText(/Ajouter a la commande/i);
    await act(async () => {
      fireEvent.click(addButtons[0]);
    });
    
    // Alert should be shown
    expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/Quantité insuffisante/));
  });
}); 
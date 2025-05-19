// Mocks must be defined before imports
import { vi } from 'vitest';

// Create a mock function for useNavigate that we can reference later
const mockNavigate = vi.fn();

// Mock react-router-dom if needed
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...(actual as Object),
    useNavigate: () => mockNavigate
  };
});

// Mock window.alert
const alertMock = vi.fn();
window.alert = alertMock;

import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import VentePharmacien from '../Pages/VentePharmacien';

describe('VentePharmacien Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the sales interface correctly', async () => {
    render(<VentePharmacien />);
    
    // Check main elements are present
    expect(screen.getByPlaceholderText(/Rechercher un médicament/i)).toBeInTheDocument();
    
    // Check category buttons are present
    const categories = ['Analgésique', 'Anti-inflammatoire', 'Antibiotique'];
    categories.forEach(category => {
      const categoryElement = screen.getByText(category);
      expect(categoryElement).toBeInTheDocument();
    });
    
    // Check that medication list is displayed for Analgésique category (default)
    expect(screen.getByText('Doliprane 1000mg')).toBeInTheDocument();
    expect(screen.getByText('Dafalgan 500mg')).toBeInTheDocument();
    
    // Switch to Anti-inflammatoire category to see Aspirine
    const antiInflammatoireBtn = screen.getByRole('button', { name: /Anti-inflammatoire/i });
    await act(async () => {
      fireEvent.click(antiInflammatoireBtn);
    });
    
    // Now check for Aspirine
    expect(screen.getByText('Aspirine 500mg')).toBeInTheDocument();
    
    // Check cart summary is present
    expect(screen.getByText(/Récapitulatif/i)).toBeInTheDocument();
    expect(screen.getByText(/Total vente/i)).toBeInTheDocument();
  });

  test('filters medications when searching', async () => {
    render(<VentePharmacien />);
    
    // Get the search input and type in it
    const searchInput = screen.getByPlaceholderText(/Rechercher un médicament/i);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'doli' } });
    });
    
    // Should show Doliprane but hide Aspirine
    expect(screen.getByText(/Doliprane 1000mg/i)).toBeInTheDocument();
    expect(screen.queryByText(/Aspirine 500mg/i)).not.toBeInTheDocument();
  });

  test('filters medications by category', async () => {
    render(<VentePharmacien />);
    
    // Default category is Analgésique, so we should see Doliprane and Dafalgan but not Aspirine
    expect(screen.getByText(/Doliprane 1000mg/i)).toBeInTheDocument();
    expect(screen.getByText(/Dafalgan 500mg/i)).toBeInTheDocument();
    
    // Click on Anti-inflammatoire category
    const antiInflammatoireBtn = screen.getByRole('button', { name: /Anti-inflammatoire/i });
    await act(async () => {
      fireEvent.click(antiInflammatoireBtn);
    });
    
    // Should show Aspirine but hide Doliprane and Dafalgan
    expect(screen.getByText(/Aspirine 500mg/i)).toBeInTheDocument();
    expect(screen.queryByText(/Doliprane 1000mg/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dafalgan 500mg/i)).not.toBeInTheDocument();
  });

  test('changes medication quantity and updates cart', async () => {
    render(<VentePharmacien />);
    
    // Find the quantity input for Doliprane
    const dolipraneCard = screen.getByText(/Doliprane 1000mg/i).closest('.med-card') as HTMLElement;
    expect(dolipraneCard).not.toBeNull();
    
    if (dolipraneCard) {
      const quantityInput = within(dolipraneCard).getByRole('spinbutton');
      
      // Change quantity to 3
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '3' } });
      });
      
      // Click add button
      const addBtn = within(dolipraneCard).getByRole('button', { name: /Ajouter/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });
      
      // Check if item is added to the cart
      await waitFor(() => {
        const cartItem = screen.queryByText(/Doliprane 1000mg/i, { selector: '.item-name' }) ||
                        screen.getByText(/Doliprane 1000mg/i, { selector: '.cart-item *' });
        expect(cartItem).toBeInTheDocument();
      });
      
      // Check cart details (quantity and price)
      const cartDetails = screen.queryByText(/\(3 × 16.70 DHS\)/i) ||
                         screen.getByText(/3 ×/i);
      expect(cartDetails).toBeInTheDocument();
    }
  });

  test('calculates total correctly', async () => {
    render(<VentePharmacien />);
    
    // Add Doliprane to cart with quantity 2
    const dolipraneCard = screen.getByText(/Doliprane 1000mg/i).closest('.med-card') as HTMLElement;
    if (dolipraneCard) {
      const quantityInput = within(dolipraneCard).getByRole('spinbutton');
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '2' } });
      });
      
      const addBtn = within(dolipraneCard).getByRole('button', { name: /Ajouter/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });
    }
    
    // Add Aspirine to cart with quantity 1
    // First switch to Anti-inflammatoire category
    const antiInflammatoireBtn = screen.getByRole('button', { name: /Anti-inflammatoire/i });
    await act(async () => {
      fireEvent.click(antiInflammatoireBtn);
    });
    
    const aspirineCard = screen.getByText(/Aspirine 500mg/i).closest('.med-card') as HTMLElement;
    if (aspirineCard) {
      const quantityInput = within(aspirineCard).getByRole('spinbutton');
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '1' } });
      });
      
      const addBtn = within(aspirineCard).getByRole('button', { name: /Ajouter/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });
    }
    
    // Calculate expected total: (16.70 * 2) + (22.30 * 1) = 55.70
    const expectedTotal = (16.70 * 2) + (22.30 * 1);
    
    // Check if total is calculated correctly
    await waitFor(() => {
      const totalElement = screen.getByText(new RegExp(`${expectedTotal.toFixed(2)}\\s*DHS`, 'i'));
      expect(totalElement).toBeInTheDocument();
    });
  });

  test('completes a sale and resets the cart', async () => {
    render(<VentePharmacien />);
    
    // Add an item to the cart
    const dolipraneCard = screen.getByText(/Doliprane 1000mg/i).closest('.med-card') as HTMLElement;
    if (dolipraneCard) {
      const quantityInput = within(dolipraneCard).getByRole('spinbutton');
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '2' } });
      });
      
      const addBtn = within(dolipraneCard).getByRole('button', { name: /Ajouter/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });
    }
    
    // Check that sale button is enabled
    const saleButton = screen.getByRole('button', { name: /Enregistrer la vente/i });
    expect(saleButton).not.toBeDisabled();
    
    // Complete the sale
    await act(async () => {
      fireEvent.click(saleButton);
    });
    
    // Check that alert was shown
    expect(alertMock).toHaveBeenCalledWith('Vente enregistrée avec succès!');
    
    // Check that cart was reset
    await waitFor(() => {
      const emptyCartMessage = screen.queryByText(/Aucun produit sélectionné/i);
      expect(emptyCartMessage).toBeInTheDocument();
      
      // Total should be zero
      const totalZero = screen.getByText(/0.00 DHS/i);
      expect(totalZero).toBeInTheDocument();
    });
  });

  test('disables sale button when cart is empty', () => {
    render(<VentePharmacien />);
    
    // Sale button should be disabled initially
    const saleButton = screen.getByRole('button', { name: /Enregistrer la vente/i });
    expect(saleButton).toBeDisabled();
  });
}); 
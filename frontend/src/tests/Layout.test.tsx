import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';

// Mock the Outlet component since we're testing Layout in isolation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Main Content</div>
}));

describe('Layout Component', () => {
  it('renders the Tolkien quote correctly', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Check if the quote text is present
    expect(screen.getByText('"Not all who wander are lost"')).toBeInTheDocument();
    
    // Check if the attribution is present
    expect(screen.getByText('— J.R.R. Tolkien')).toBeInTheDocument();
    
    // Check if the quote is in a blockquote element
    const blockquote = screen.getByText('"Not all who wander are lost"');
    expect(blockquote.tagName.toLowerCase()).toBe('blockquote');
    
    // Check if the attribution is in a cite element
    const citation = screen.getByText('— J.R.R. Tolkien');
    expect(citation.tagName.toLowerCase()).toBe('cite');
    
    // Check if the quote section has the correct CSS class
    const quoteSection = blockquote.closest('.tolkien-quote');
    expect(quoteSection).toBeInTheDocument();
  });

  it('renders all footer sections including the quote', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    );

    // Check that all main footer elements are present
    expect(screen.getByText('A Whittle Wandering')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Follow Us')).toBeInTheDocument();
    expect(screen.getByText('"Not all who wander are lost"')).toBeInTheDocument();
    expect(screen.getByText(/Powered by Cloudflare Workers/)).toBeInTheDocument();
  });
});
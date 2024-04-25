import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home Component', () => {
  test('renders loading message when isLoading is true', () => {
    render(<Home />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders latest reviews when isLoading is false', async () => {
    const mockReviews = [
      { id: 1, content: 'Review 1' },
      { id: 2, content: 'Review 2' }
    ];

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockReviews)
    });

    render(<Home />);
    
    // Wait for loading to complete
    await screen.findByText('Welcome back! Your Recent Reviews: ');

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Review 1')).toBeInTheDocument();
    expect(screen.getByText('Review 2')).toBeInTheDocument();
  });

  test('renders latest reviews on Swift Sounds when user is not authenticated', async () => {
    const mockReviews = [
      { id: 1, content: 'Review 1' },
      { id: 2, content: 'Review 2' }
    ];

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockReviews)
    });

    render(<Home />);

    // Wait for loading to complete
    await screen.findByText('Latest Reviews on Swift Sounds!');

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Review 1')).toBeInTheDocument();
    expect(screen.getByText('Review 2')).toBeInTheDocument();
  });
});

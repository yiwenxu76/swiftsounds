import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './ProfilePage';

// Mock the useAuth0 hook
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    user: { sub: '123' }, // Mock user ID
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-access-token'),
  }),
}));

describe('ProfilePage component', () => {
  test('renders profile information and handles updates', async () => {
    render(<ProfilePage />);
    
    // Verify that loading message is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Mock the response for user information
    const userInfoResponse = {
      name: 'ABC',
      age: 30,
      email: 'test@example.com',
      signUpDate: new Date().toISOString(),
    };
    
    // Mock the response for albums
    const albumsResponse = [{ id: '1', title: 'Album 1' }, { id: '2', title: 'Album 2' }];
    
    // Mock the response for reviews
    const reviewsResponse = [{ id: '1', title: 'Review 1', content: 'Review content 1' }, { id: '2', title: 'Review 2', content: 'Review content 2' }];

    // Wait for API calls to finish and update the component
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Verify that user information is displayed correctly
    expect(screen.getByText(`Nickname: ${userInfoResponse.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Age: ${userInfoResponse.age}`)).toBeInTheDocument();
    expect(screen.getByText(`Email: ${userInfoResponse.email}`)).toBeInTheDocument();
    expect(screen.getByText(`Sign-up Date: ${new Date(userInfoResponse.signUpDate).toLocaleDateString()}`)).toBeInTheDocument();

    // Mock user input for updating age and trigger update
    const ageInput = screen.getByLabelText('Age:');
    fireEvent.change(ageInput, { target: { value: '30' } });
    fireEvent.click(screen.getByText('Update Age'));

    // Verify that age update is successful
    await waitFor(() => {
      expect(screen.getByText(`Age: 30`)).toBeInTheDocument();
    });

    // Mock user input for updating name and trigger update
    const nameInput = screen.getByLabelText('Nickname:');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.click(screen.getByText('Update Name'));

    // Verify that name update is successful
    await waitFor(() => {
      expect(screen.getByText(`Nickname: New Name`)).toBeInTheDocument();
    });

    // Verify that albums are displayed
    expect(screen.getByText('Albums Reviewed')).toBeInTheDocument();
    expect(screen.getByText('Album 1')).toBeInTheDocument();
    expect(screen.getByText('Album 2')).toBeInTheDocument();

    // Verify that review history is displayed
    expect(screen.getByText('Review History')).toBeInTheDocument();
    expect(screen.getByText('Title: Review 1')).toBeInTheDocument();
    expect(screen.getByText('Review: Review content 1')).toBeInTheDocument();
    expect(screen.getByText('Title: Review 2')).toBeInTheDocument();
    expect(screen.getByText('Review: Review content 2')).toBeInTheDocument();
  });
});

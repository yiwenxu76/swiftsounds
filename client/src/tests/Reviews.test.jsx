import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { act } from 'react-dom/test-utils';
import { Auth0Provider } from '@auth0/auth0-react';
import UserReviewsPage from './UserReviewsPage';

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

describe('UserReviewsPage', () => {
  const mockUser = {
    isAuthenticated: true,
    getAccessTokenSilently: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user reviews', async () => {
    // Mock reviews data
    const mockReviews = [
      { id: 1, title: 'Review 1', content: 'Content 1' },
      { id: 2, title: 'Review 2', content: 'Content 2' },
    ];

    // Mock useAuth0 hook
    mockUser.getAccessTokenSilently.mockResolvedValue('mock-access-token');
    Auth0Provider.mockReturnValueOnce(({ children }) => <>{children}</>);

    // Render the component
    const { getByText, getByTestId } = render(<UserReviewsPage />, { wrapper: Auth0Provider });

    // Wait for reviews to be fetched and rendered
    await waitFor(() => {
      mockReviews.forEach((review) => {
        expect(getByText(review.title)).toBeInTheDocument();
        expect(getByText(review.content)).toBeInTheDocument();
      });
    });
  });

  it('allows editing reviews', async () => {
    const mockReviewId = 1;

    // Mock reviews data
    const mockReviews = [{ id: mockReviewId, title: 'Review 1', content: 'Content 1' }];

    // Mock useAuth0 hook
    mockUser.getAccessTokenSilently.mockResolvedValue('mock-access-token');
    Auth0Provider.mockReturnValueOnce(({ children }) => <>{children}</>);

    // Render the component
    const { getByText, getByTestId } = render(<UserReviewsPage />, { wrapper: Auth0Provider });

    // Wait for reviews to be fetched and rendered
    await waitFor(() => {
      mockReviews.forEach((review) => {
        expect(getByText(review.title)).toBeInTheDocument();
        expect(getByText(review.content)).toBeInTheDocument();
      });
    });

    // Click on the edit button
    fireEvent.click(getByText('Edit'));

    // Update the edited title and content
    fireEvent.change(getByTestId('edited-title-input'), { target: { value: 'Updated Title' } });
    fireEvent.change(getByTestId('edited-content-textarea'), { target: { value: 'Updated Content' } });

    // Click on the save button
    fireEvent.click(getByText('Save'));

    // Check if the review was updated
    await waitFor(() => {
      expect(mockUser.getAccessTokenSilently).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/review/${mockReviewId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-access-token',
          }),
          body: expect.stringContaining('"newTitle":"Updated Title","newContent":"Updated Content"'),
        })
      );
    });
  });

  it('allows deleting reviews', async () => {
    const mockReviewId = 1;

    // Mock reviews data
    const mockReviews = [{ id: mockReviewId, title: 'Review 1', content: 'Content 1' }];

    // Mock useAuth0 hook
    mockUser.getAccessTokenSilently.mockResolvedValue('mock-access-token');
    Auth0Provider.mockReturnValueOnce(({ children }) => <>{children}</>);

    // Render the component
    const { getByText } = render(<UserReviewsPage />, { wrapper: Auth0Provider });

    // Wait for reviews to be fetched and rendered
    await waitFor(() => {
      mockReviews.forEach((review) => {
        expect(getByText(review.title)).toBeInTheDocument();
        expect(getByText(review.content)).toBeInTheDocument();
      });
    });

    // Click on the delete button
    fireEvent.click(getByText('Delete'));

    // Confirm delete
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this review?');
  });
});

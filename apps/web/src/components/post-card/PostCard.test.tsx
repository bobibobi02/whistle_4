import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PostCard, { PostCardProps } from './PostCard';

describe('PostCard Component', () => {
  const baseProps: PostCardProps = {
    user: { name: 'Test User' },
    avatarUrl: 'https://example.com/avatar.png',
    timestamp: new Date().toISOString(),
    content: 'Hello World',
    likesCount: 0,
    commentsCount: 0,
  };

  test('renders post content and user name', () => {
    render(<PostCard {...baseProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders content shorter than threshold without toggle button', () => {
    render(<PostCard {...baseProps} collapseThreshold={100} />);
    expect(screen.getByText(baseProps.content!)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });

  it('renders truncated content and toggle button for long content', () => {
    const longContent = 'a'.repeat(200);
    render(
      <PostCard
        {...baseProps}
        content={longContent}
        collapseThreshold={50}
      />
    );
    expect(screen.getByText(`${'a'.repeat(50)}...`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('expands and collapses content on toggle click', () => {
    const longContent = 'b'.repeat(120);
    render(
      <PostCard
        {...baseProps}
        content={longContent}
        collapseThreshold={50}
      />
    );

    const toggle = screen.getByRole('button', { name: /show more/i });
    fireEvent.click(toggle);
    expect(screen.getByText(longContent)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.getByText(`${'b'.repeat(50)}...`)).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<PostCard {...baseProps} isLoading />);
    expect(screen.queryByText(baseProps.content!)).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders error overlay and calls onRetry when retry button clicked', () => {
    const retryMock = jest.fn();
    render(<PostCard {...baseProps} hasError onRetry={retryMock} />);

    expect(screen.getByText(/failed to load post/i)).toBeInTheDocument();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);
    expect(retryMock).toHaveBeenCalledTimes(1);
  });
});

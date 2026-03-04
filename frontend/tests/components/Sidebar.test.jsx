import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../../src/components/Sidebar';

describe('Sidebar Component', () => {
    it('renders branding and navigation links', () => {
        const onNavigate = vi.fn();
        render(
            <Sidebar activePage="dashboard" onNavigate={onNavigate} userEmail="test@example.com" />
        );

        // Check Branding
        expect(screen.getByText(/MoneyPro/i)).toBeInTheDocument();

        // Check Navigation Links
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
        expect(screen.getByText(/Budget/i)).toBeInTheDocument();
    });

    it('highlights the active link', () => {
        const onNavigate = vi.fn();
        const { container } = render(
            <Sidebar activePage="settings" onNavigate={onNavigate} userEmail="test@example.com" />
        );

        const activeLink = container.querySelector('.nav-link-item.active');
        expect(activeLink).toHaveTextContent(/Budget/i);
    });
});

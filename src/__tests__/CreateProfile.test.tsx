import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CreateProfile from '../createprofile';
import { Page } from '../App';

describe('CreateProfile Component', () => {
    const setCurrentPage = jest.fn();

    beforeEach(() => {
        // Mock Chrome Storage API
        global.chrome = {
            storage: {
                sync: {
                    get: jest.fn(),
                    set: jest.fn(),
                },
                local: {
                    set: jest.fn(),
                },
            },
        } as unknown as typeof chrome;
    });

    test('renders CreateProfile component with initial elements', () => {
        render(<CreateProfile  />);

        // Check for main input fields
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Address')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Website')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Profile Name')).toBeInTheDocument();

        // Check for skills and intro fields
        expect(screen.getByPlaceholderText('Skills (comma separated)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Intro')).toBeInTheDocument();
    });

    test('loads saved profiles from Chrome storage', async () => {
        const profiles = [{ profileName: 'Test Profile', profileData: {} }];
        (chrome.storage.sync.get as jest.Mock).mockImplementation((keys: string[], callback: (items: { profiles: any[] }) => void) => callback({ profiles }));

        render(<CreateProfile />);

        await screen.findByText('Test Profile');
    });

    test('updates state when input fields change', () => {
        render(<CreateProfile  />);

        // Simulate typing in fields
        fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'johndoe@example.com' } });

        // Check updated input values
        expect(screen.getByPlaceholderText('Name')).toHaveValue('John Doe');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('johndoe@example.com');
    });

    test('adds education entry', () => {
        render(<CreateProfile />);

        // Click 'Add Education' button
        fireEvent.click(screen.getByText('Add Education'));

        // Check for new education inputs
        expect(screen.getAllByPlaceholderText('College').length).toBe(1);
    });

    test('saves a new profile', () => {
        render(<CreateProfile  />);

        // Set profile name and fill in a field
        fireEvent.change(screen.getByPlaceholderText('Profile Name'), { target: { value: 'My New Profile' } });
        fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'John Doe' } });

        // Click save button
        fireEvent.click(screen.getByText('Save Profile'));

        // Check if Chrome storage set was called
        expect(chrome.storage.sync.set).toHaveBeenCalledWith(
            { profiles: expect.arrayContaining([{ profileName: 'My New Profile', profileData: expect.any(Object) }]) },
            expect.any(Function)
        );
    });

    test('deletes a selected profile', async () => {
        const profiles = [{ profileName: 'Test Profile', profileData: {} }];
        (chrome.storage.sync.get as jest.Mock).mockImplementation((keys: string[], callback: (items: { profiles: any[] }) => void) => callback({ profiles }));

        render(<CreateProfile />);

        // Wait for profiles to load
        await screen.findByText('Test Profile');

        // Select profile and delete
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Test Profile' } });
        fireEvent.click(screen.getByText('Delete Selected Profile'));

        // Verify storage update
        expect(chrome.storage.sync.set).toHaveBeenCalledWith(
            { profiles: [] },
            expect.any(Function)
        );
    });
});
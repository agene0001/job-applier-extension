import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import HomePage from '../homepage';
import { Page } from '../App';
import { ResumeData } from '../types';

// Mock global chrome storage API
const mockGet = jest.fn();
const mockSendMessage = jest.fn();
global.chrome = {
    storage: {
        sync: {
            get: mockGet,
        },
    },
    runtime: {
        sendMessage: mockSendMessage,
    },
} as unknown as typeof chrome;

describe('HomePage Component', () => {
    let setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;

    beforeEach(() => {
        setCurrentPage = jest.fn();
        mockGet.mockClear();
        mockSendMessage.mockClear();
    });

    test('renders HomePage with initial elements', () => {
        render(<HomePage />);

        expect(screen.getByText('Automatic Job Applier')).toBeInTheDocument();
        expect(screen.getByText('Create a profile to begin applying to jobs')).toBeInTheDocument();
        expect(screen.getByText('Selected Profile: None')).toBeInTheDocument();
        expect(screen.getByText('Saved Profiles:')).toBeInTheDocument();
        expect(screen.getByText('LinkedIn')).toBeInTheDocument();
        expect(screen.getByText('Indeed')).toBeInTheDocument();
        expect(screen.getByText('Handshake')).toBeInTheDocument();
    });

    test('loads saved profiles from chrome storage', async () => {
        const profiles = [
            { profileName: 'Profile 1', profileData: {} as ResumeData },
            { profileName: 'Profile 2', profileData: {} as ResumeData },
        ];
        mockGet.mockImplementation((_, callback) => callback({ profiles }));

        render(<HomePage />);

        await screen.findByText('Profile 1');
        await screen.findByText('Profile 2');
    });

    test('sets selected profile and updates resumeData', async () => {
        const profiles = [
            { profileName: 'Profile 1', profileData: { name: 'John Doe' } as ResumeData },
        ];
        mockGet.mockImplementation((_, callback) => callback({ profiles }));

        render(<HomePage  />);
        await screen.findByText('Profile 1');

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Profile 1' } });

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toHaveValue('Profile 1');
            // As we're not showing resumeData directly in the component, additional assertions could be added
            // if you are displaying parts of resumeData.
        });
    });

    test('sends message to open job site if profile is selected', () => {
        const profiles = [{ profileName: 'Profile 1', profileData: {} as ResumeData }];
        mockGet.mockImplementation((_, callback) => callback({ profiles }));

        render(<HomePage  />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Profile 1' } });

        fireEvent.click(screen.getByText('LinkedIn'));

        expect(mockSendMessage).toHaveBeenCalledWith({
            action: 'openJobSite',
            site: 'linkedin',
            name: 'Profile 1'
        });
    });

    test('shows alert if no profile is selected on job site click', () => {
        global.alert = jest.fn();
        render(<HomePage  />);

        fireEvent.click(screen.getByText('LinkedIn'));
        expect(global.alert).toHaveBeenCalledWith('Profile must be selected.');
    });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Navbar from '../navbar';
import { Page } from '../App';

describe('Navbar Component', () => {
    let setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;

    beforeEach(() => {
        setCurrentPage = jest.fn();
    });

    test('renders Navbar with correct buttons and active state', () => {
        render(<Navbar title="home" setCurrentPage={setCurrentPage} />);

        // Check if all buttons are rendered
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
        expect(screen.getByText('Applied Jobs')).toBeInTheDocument();
        expect(screen.getByText('Help')).toBeInTheDocument();

        // Check the active state class
        expect(screen.getByText('Home')).toHaveClass('border-5 border-black');
        expect(screen.getByText('Create Profile')).not.toHaveClass('border-5 border-black');
        expect(screen.getByText('Applied Jobs')).not.toHaveClass('border-5 border-black');
    });

    test('sets active class based on title prop', () => {
        render(<Navbar title="createpage" setCurrentPage={setCurrentPage} />);

        // Check the active state class for Create Profile
        expect(screen.getByText('Home')).not.toHaveClass('border-5 border-black');
        expect(screen.getByText('Create Profile')).toHaveClass('border-5 border-black');
        expect(screen.getByText('Applied Jobs')).not.toHaveClass('border-5 border-black');
    });

    test('calls setCurrentPage when buttons are clicked', () => {
        render(<Navbar title="home" setCurrentPage={setCurrentPage} />);

        // Click Create Profile button
        fireEvent.click(screen.getByText('Create Profile'));
        expect(setCurrentPage).toHaveBeenCalledWith('create-profile');

        // Click Applied Jobs button
        fireEvent.click(screen.getByText('Applied Jobs'));
        expect(setCurrentPage).toHaveBeenCalledWith('applied-jobs');

        // Click Home button
        fireEvent.click(screen.getByText('Home'));
        expect(setCurrentPage).toHaveBeenCalledWith('home');
    });
});
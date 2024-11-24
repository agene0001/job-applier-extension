import React from "react";
import { Page } from './App';

interface NavbarProps {
    title: Page;
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

const Navbar: React.FC<NavbarProps> = ({ title, setCurrentPage }) => {
    return (
        <div className='nav-container'>
            <div className='mini-sec'>
                <button onClick={() => setCurrentPage('home')} className={`btn btn-primary btn-custom ${title === "home" ? "border-5 border-black" : ""}`}>Home</button>
                <button onClick={() => setCurrentPage('create-profile')} className={`btn btn-primary btn-custom ${title === "create-profile" ? "border-5 border-black" : ""}`}>Create Profile</button>
                <button onClick={() => setCurrentPage('applied-jobs')} className={`btn btn-primary btn-custom ${title === "applied-jobs" ? "border-5 border-black" : ""}`}>Applied Jobs</button>
                <button onClick={() => setCurrentPage('edit-job-info')} className={`btn btn-primary btn-custom ${title === "edit-job-info" ? "border-5 border-black" : ""}`}>Edit Job info</button>
            </div>
            <button className='btn btn-primary btn-custom'>Help</button>
        </div>
    );
};

export default Navbar;
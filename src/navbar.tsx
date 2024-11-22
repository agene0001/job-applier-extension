import React from "react";
import { Page } from './App';

interface NavbarProps {
    title: string;
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

const Navbar: React.FC<NavbarProps> = ({ title, setCurrentPage }) => {
    return (
        <div className='nav-container'>
            <div className='mini-sec'>
                <button onClick={() => setCurrentPage('home')} className={`btn btn-primary btn-custom ${title === "home" ? "border-5 border-black" : ""}`}>Home</button>
                <button onClick={() => setCurrentPage('create-profile')} className={`btn btn-primary btn-custom ${title === "createpage" ? "border-5 border-black" : ""}`}>Create Profile</button>
                <button onClick={() => setCurrentPage('applied-jobs')} className={`btn btn-primary btn-custom ${title === "prevjobs" ? "border-5 border-black" : ""}`}>Applied Jobs</button>
                <button onClick={() => setCurrentPage('edit-job-info')} className={`btn btn-primary btn-custom ${title === "editjobs" ? "border-5 border-black" : ""}`}>Edit Job info</button>
            </div>
            <button className='btn btn-primary btn-custom'>Help</button>
        </div>
    );
};

export default Navbar;
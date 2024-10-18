import React from 'react';
import Navbar from "./navbar";
import { Page } from './App';

interface HomePageProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

// Function to handle page clicks and send messages to the background script
function pageClick(site: string) {
    chrome.runtime.sendMessage({ action: "openJobSite", site });
}

const HomePage: React.FC<HomePageProps> = ({ setCurrentPage }) => {
    return (
        <div className='grid-container'>
            <Navbar title='home' setCurrentPage={setCurrentPage} />
            <div className='main-section'>
                <h1>Automatic Job Applier</h1>
                <p>Create a profile to begin applying to jobs</p>
                <h2>Selected Profile: None</h2>
                <button className='btn btn-primary'>Change Profile</button>
                <label>Apply (please have window in full screen)</label>
                <div className='job-board-section'>
                    <button className='btn btn-primary' onClick={() => pageClick("linkedin")}>LinkedIn</button>
                    <button className='btn btn-primary' onClick={() => pageClick("indeed")}>Indeed</button>
                    <button className='btn btn-primary' onClick={() => pageClick("handshake")}>Handshake</button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;

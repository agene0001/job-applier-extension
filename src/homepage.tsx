import React, {ChangeEvent, useEffect, useState} from 'react';
import Navbar from "./navbar";

import { Page } from './App';
import {ResumeData} from "./types"
interface HomePageProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

// Function to handle page clicks and send messages to the background script


const initialState: ResumeData = {
    name: '',
    address: '',
    email: '',
    website: '',
    phone: '',
    education: [],
    skills: [],
    intro: '',
    employment: [],
};

const HomePage: React.FC<HomePageProps> = ({ setCurrentPage }) => {
    const [savedProfiles, setSavedProfiles] = useState<{ profileName: string; profileData: ResumeData }[]>([]);
    const [selectedProfileName, setSelectedProfileName] = useState<string>('');
    const [resumeData, setResumeData] = useState<ResumeData>(initialState);
    useEffect(() => {
        chrome.storage.sync.get(['profiles'], (result) => {
            if (result.profiles) {
                setSavedProfiles(result.profiles);
            }
        });
    }, []);
    function pageClick(site: string) {
        if(selectedProfileName!=="") chrome.runtime.sendMessage({ action: "openJobSite", site,name: selectedProfileName });
        else alert("Profile must be selected.");
    }
    const handleProfileSelect = async (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedProfileName = e.target.value;
        setSelectedProfileName(selectedProfileName);

        const selectedProfile = await new Promise<{ profileName: string; profileData: ResumeData } | undefined>((resolve) => {
            chrome.storage.sync.get(['profiles'], (result) => {
                if (result.profiles) {
                    resolve(result.profiles.find((profile: { profileName: string }) => profile.profileName === selectedProfileName));
                } else {
                    resolve(undefined);
                }
            });
        });

        if (selectedProfile) {
            setResumeData(selectedProfile.profileData);
        } else {
            setResumeData(initialState);
        }
    };

    return (
        <div className='grid-container'>
            <Navbar title='home' setCurrentPage={setCurrentPage} />
            <div className='main-section'>
                <h1>Automatic Job Applier</h1>
                <p>Create a profile to begin applying to jobs</p>
                <h2>Selected Profile: None</h2>
                <h2>Saved Profiles:</h2>
                <select onChange={handleProfileSelect} value={selectedProfileName}>
                    <option value="" disabled>Select a saved profile</option>
                    {savedProfiles.map((profile, index) => (
                        <option key={index} value={profile.profileName}>{profile.profileName}</option>))}
                </select>
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

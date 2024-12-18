import React, {ChangeEvent, useEffect, useState} from 'react';
import Navbar from "./navbar";

import { Page } from './App';
import {ResumeData} from "./types"


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

const HomePage = () => {
    const [savedProfiles, setSavedProfiles] = useState<{ profileName: string; profileData: ResumeData }[]>([]);
    const [selectedProfileName, setSelectedProfileName] = useState<string>('');
    const [resumeData, setResumeData] = useState<ResumeData>(initialState);
    const [experienceLevel, setExperienceLevel] = useState<string[]>([]);
    const [queryJob, setQueryJob] = useState<string>("");
    useEffect(() => {
        chrome.storage.sync.get(['profiles'], (result) => {
            if (result.profiles) {
                setSavedProfiles(result.profiles);
            }
        });
    }, []);
    function pageClick(site: string) {
        if(selectedProfileName!==""&&queryJob!=="") {
            chrome.runtime.sendMessage({action: "openJobSite", site, name: selectedProfileName, pageInd: 0,query: queryJob,xpLevel: experienceLevel});
        }
        else alert("Profile must be selected and must have query job.");
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
        <div>
            <div className='main-section'>
                <h1>Automatic Job Applier</h1>
                <p>Create a profile to begin applying to jobs</p>
                <h2>Selected Profile: None</h2>
                <h2>Saved Profiles:</h2>

                <label>Apply (please have window in full screen)</label>
                <select onChange={handleProfileSelect} value={selectedProfileName}>
                    <option value="" disabled>Select a saved profile</option>
                    {savedProfiles.map((profile, index) => (
                        <option key={index} value={profile.profileName}>{profile.profileName}</option>))}
                </select>

                <select
                    multiple
                    id="experience"
                    name="options"
                    onChange={(event) => {
                        const selectedValues = Array.from(event.target.selectedOptions, (option) => option.value);
                        setExperienceLevel(selectedValues); // Update state with selected values
                    }}
                    value={experienceLevel}
                >
                    <option value="" disabled>Select an option</option>
                    {/* This line isn't needed for multiple selects */}
                    <option value="1">Internship</option>
                    <option value="2">Entry Level</option>
                    <option value="3">Associate</option>
                    <option value="4">Mid-Senior Level</option>
                    <option value="5">Director</option>
                    <option value="6">Executive</option>
                </select>

                <div className='job-board-section'>
                    <button className='btn btn-primary' onClick={() => pageClick("linkedin")}>LinkedIn</button>
                    <button className='btn btn-primary' onClick={() => pageClick("indeed")}>Indeed</button>
                    <button className='btn btn-primary' onClick={() => pageClick("handshake")}>Handshake</button>
                </div>
                <div>
                    <label htmlFor="jobSearch">Search Jobs</label>
                    <input id="jobSearch" type='text' required placeholder='Search by job name'
                           onChange={e => setQueryJob(e.target.value)}/>
                </div>
            </div>
        </div>);
};

export default HomePage;

import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import Navbar from "./navbar";
import UploadDoc from "./FileUploader";
import { Page } from './App';
import LZString from 'lz-string';

interface CreateProfileProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

interface Employment {
    jobTitle: string;
    company: string;
    location: string;
    jStart: string;
    jEnd: string;
    info: string[];
}

interface Education {
    college: string;
    edStart: string;
    edEnd: string;
    degrees: string[];
    edInfo: string;  // Changed from string[] to string
    extraInfo: string[];
}

interface ResumeData {
    name: string;
    address: string;
    email: string;
    website: string;
    phone: string;
    educationInfo: Education[];
    experience: string;
    skills: string[];
    intro: string;
    employment: Employment[];
}

const initialState: ResumeData = {
    name: '',
    address: '',
    email: '',
    website: '',
    phone: '',
    educationInfo: [],
    experience: '',
    skills: [],
    intro: '',
    employment: [],
};

const CreateProfile: React.FC<CreateProfileProps> = ({ setCurrentPage }) => {
    const [resumeData, setResumeData] = useState<ResumeData>(initialState);
    const [profileName, setProfileName] = useState<string>('');
    const [selectedProfileName, setSelectedProfileName] = useState<string>('');
    const [savedProfiles, setSavedProfiles] = useState<{ profileName: string; profileData: ResumeData }[]>([]);
    const [degreesCursor, setDegreesCursor] = useState<number | null>(null);
    const degreesRef = useRef<HTMLInputElement>(null);
    const edInfoCursors = useRef<{ [index: number]: number | null }>({});

    useEffect(() => {
        chrome.storage.sync.get(['profiles'], (result) => {
            if (result.profiles) {
                setSavedProfiles(result.profiles);
            }
        });
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setResumeData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

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

    const saveProfile = () => {
        if (profileName.trim() === '') {
            alert('Please enter a name for the profile.');
            return;
        }

        const existingProfile = savedProfiles.find(profile => profile.profileName === profileName);
        if (existingProfile) {
            alert('Profile name already exists. Please choose a different name.');
            return;
        }

        const newProfiles = [...savedProfiles, { profileName, profileData: resumeData }];
        setSavedProfiles(newProfiles);
        chrome.storage.sync.set({ profiles: newProfiles }, () => {
            console.log('Profile saved to Chrome storage.');
        });
        setProfileName('');
        setResumeData(initialState);
    };

    const handleEducationChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updatedEducationInfo = [...resumeData.educationInfo];

        if (name === 'degrees') {
            if (e.target instanceof HTMLInputElement) {
                setDegreesCursor(e.target.selectionStart);
                updatedEducationInfo[index] = {
                    ...updatedEducationInfo[index], degrees: value.split(',').map(degree => degree)
                };
                setResumeData(prevState => ({
                    ...prevState,
                    educationInfo: updatedEducationInfo
                }));
            }
        } else if (name === 'edInfo') {
            if (e.target instanceof HTMLTextAreaElement) {
                edInfoCursors.current[index] = e.target.selectionStart;
                updatedEducationInfo[index] = {
                    ...updatedEducationInfo[index], edInfo: value  // Store directly as a string
                };
                setResumeData(prevState => ({
                    ...prevState,
                    educationInfo: updatedEducationInfo
                }));
            }
        } else {
            updatedEducationInfo[index] = {
                ...updatedEducationInfo[index],
                [name]: value
            };
            setResumeData(prevState => ({
                ...prevState,
                educationInfo: updatedEducationInfo
            }));
        }
    };

    useEffect(() => {
        // Set the cursor position in the degrees input field if the ref is available and a position is set.
        if (degreesRef.current && degreesCursor !== null) {
            degreesRef.current.setSelectionRange(degreesCursor, degreesCursor);
        }
    }, [resumeData.educationInfo, degreesCursor]);

    useEffect(() => {
        // Set the cursor position in each edInfo textarea if the ref is available and a position is set.
        if (edInfoCursors.current) {
            Object.keys(edInfoCursors.current).forEach((indexKey) => {
                const index = Number(indexKey);
                const cursorPosition = edInfoCursors.current[index];
                const textarea = document.getElementById(`edInfo-${index}`) as HTMLTextAreaElement | null;
                if (textarea && cursorPosition !== null) {
                    textarea.setSelectionRange(cursorPosition, cursorPosition);
                }
            });
        }
    }, [resumeData.educationInfo]);

    const handleEmploymentChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updatedEmployment = [...resumeData.employment];
        if (name === 'info') {
            updatedEmployment[index] = {
                ...updatedEmployment[index],
                info: value.split(',').map(info => info.trim())
            };
        } else {
            updatedEmployment[index] = {
                ...updatedEmployment[index],
                [name]: value
            };
        }
        setResumeData(prevState => ({
            ...prevState,
            employment: updatedEmployment
        }));
    };

    const handleFileUpload = (index: number, files: { fileName: string, fileContent: string }[]) => {
        const updatedEducationInfo = [...resumeData.educationInfo];
        updatedEducationInfo[index].extraInfo = files.map(file => file.fileName);

        // Compress the file contents
        const filesToSave = files.reduce((acc, file) => {
            const compressedContent = LZString.compress(file.fileContent);
            return {
                ...acc,
                [file.fileName]: compressedContent
            };
        }, {});

        chrome.storage.local.set(filesToSave, () => {
            console.log('Compressed files saved to Chrome local storage.');
        });

        setResumeData(prevState => ({
            ...prevState,
            educationInfo: updatedEducationInfo
        }));
    };

    const addEducation = () => {
        setResumeData(prevState => ({
            ...prevState,
            educationInfo: [...prevState.educationInfo, { college: '', edStart: '', edEnd: '', degrees: [], edInfo: '', extraInfo: [] }]
        }));
    };

    const addEmployment = () => {
        setResumeData(prevState => ({
            ...prevState,
            employment: [...prevState.employment, { jobTitle: '', company: '', location: '', jStart: '', jEnd: '', info: [] }]
        }));
    };

    const handleSkillChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = e.target;
        setResumeData(prevState => ({
            ...prevState,
            skills: value.split(',').map(skill => skill.trim())
        }));
    };

    const deleteEducation = (index: number) => {
        const updatedEducationInfo = resumeData.educationInfo.filter((_, i) => i !== index);
        setResumeData(prevState => ({
            ...prevState,
            educationInfo: updatedEducationInfo
        }));
    };

    const deleteEmployment = (index: number) => {
        const updatedEmployment = resumeData.employment.filter((_, i) => i !== index);
        setResumeData(prevState => ({
            ...prevState,
            employment: updatedEmployment
        }));
    };

    const deleteProfile = () => {
        if (!selectedProfileName) {
            alert('Please select a profile to delete.');
            return;
        }

        const updatedProfiles = savedProfiles.filter(profile => profile.profileName !== selectedProfileName);
        setSavedProfiles(updatedProfiles);
        chrome.storage.sync.set({ profiles: updatedProfiles }, () => {
            console.log('Profile deleted from Chrome storage.');
        });
        setSelectedProfileName('');
        setResumeData(initialState);
    };

    return (
        <div className='grid-container'>
            <Navbar title='createpage' setCurrentPage={setCurrentPage} />
            <div className='grid-container1'>
                <div className='left-column'>
                    <h1>Create a Profile</h1>
                    <p>Start By Adding in Resume Information then give any background/coursework relevant to the job
                        you're applying for.</p>
                    <select onChange={handleProfileSelect} value={selectedProfileName}>
                        <option value="" disabled>Select a saved profile</option>
                        {savedProfiles.map((profile, index) => (
                            <option key={index} value={profile.profileName}>{profile.profileName}</option>
                        ))}
                    </select>

                    <button onClick={deleteProfile}>Delete Selected Profile</button>

                    <input
                        type='text'
                        name='name'
                        placeholder='Name'
                        value={resumeData.name}
                        onChange={handleChange}
                    />
                    <input
                        type='text'
                        name='address'
                        placeholder='Address'
                        value={resumeData.address}
                        onChange={handleChange}
                    />
                    <input
                        type='email'
                        name='email'
                        placeholder='Email'
                        value={resumeData.email}
                        onChange={handleChange}
                    />
                    <input
                        type='text'
                        name='website'
                        placeholder='Website'
                        value={resumeData.website}
                        onChange={handleChange}
                    />
                    <input
                        type='tel'
                        name='phone'
                        placeholder='Phone'
                        value={resumeData.phone}
                        onChange={handleChange}
                    />

                    <h3>Skills</h3>
                    <textarea
                        name='skills'
                        placeholder='Skills (comma separated)'
                        value={resumeData.skills.join(', ')}
                        onChange={handleSkillChange}
                    />

                    <h3>Intro</h3>
                    <textarea
                        name='intro'
                        placeholder='Intro'
                        value={resumeData.intro}
                        onChange={handleChange}
                    />

                    <input
                        type='text'
                        placeholder='Profile Name'
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                    />
                    <div>
                        <button onClick={saveProfile}>Save Profile</button>
                    </div>
                </div>

                <div className='right-column'>
                    <h3>Education</h3>
                    {resumeData.educationInfo.map((education, index) => (
                        <div key={index}>
                            <input
                                type='text'
                                name='college'
                                placeholder='College'
                                value={education.college}
                                onChange={e => handleEducationChange(index, e)}
                            />
                            <input
                                id={`degrees-${index}`}
                                type='text'
                                ref={degreesRef}
                                name='degrees'
                                placeholder='Degrees (comma separated)'
                                value={Array.isArray(education.degrees) ? education.degrees.join(',') : ''}
                                onChange={e => handleEducationChange(index, e)}
                            />
                            <input
                                type='text'
                                name='edStart'
                                placeholder='Start Year'
                                value={education.edStart}
                                onChange={e => handleEducationChange(index, e)}
                            />
                            <input
                                type='text'
                                name='edEnd'
                                placeholder='End Year'
                                value={education.edEnd}
                                onChange={e => handleEducationChange(index, e)}
                            />
                            <div>
                                <h4>Uploaded Files:</h4>
                                {education.extraInfo.length > 0 ? (
                                    <ul>
                                        {education.extraInfo.map((fileName, idx) => (
                                            <li key={idx}>{fileName}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No files uploaded.</p>
                                )}
                            </div>
                            <UploadDoc onFileUpload={(files) => handleFileUpload(index, files)} />
                            <textarea
                                id={`edInfo-${index}`}
                                name='edInfo'
                                placeholder='Education Info'
                                value={education.edInfo}  // Use edInfo as a string
                                onChange={e => handleEducationChange(index, e)}
                            />
                            <button onClick={() => deleteEducation(index)}>Delete</button>
                        </div>
                    ))}
                    <button onClick={addEducation}>Add Education</button>

                    <h3>Employment</h3>
                    {resumeData.employment.map((employment, index) => (
                        <div key={index}>
                            <input
                                type='text'
                                name='jobTitle'
                                placeholder='Job Title'
                                value={employment.jobTitle}
                                onChange={e => handleEmploymentChange(index, e)}
                            />
                            <input
                                type='text'
                                name='company'
                                placeholder='Company'
                                value={employment.company}
                                onChange={e => handleEmploymentChange(index, e)}
                            />
                            <input
                                type='text'
                                name='location'
                                placeholder='Location'
                                value={employment.location}
                                onChange={e => handleEmploymentChange(index, e)}
                            />
                            <input
                                type='text'
                                name='jStart'
                                placeholder='Start Date'
                                value={employment.jStart}
                                onChange={e => handleEmploymentChange(index, e)}
                            />
                            <input
                                type='text'
                                name='jEnd'
                                placeholder='End Date'
                                value={employment.jEnd}
                                onChange={e => handleEmploymentChange(index, e)}
                            />
                            <textarea
                                name='info'
                                placeholder='Employment Info (comma separated)'
                                value={Array.isArray(employment.info) ? employment.info.join(', ') : ''}
                                onChange={e => handleEmploymentChange(index, e)}
                            />
                            <button onClick={() => deleteEmployment(index)}>Delete</button>
                        </div>
                    ))}
                    <button onClick={addEmployment}>Add Employment</button>
                </div>
            </div>
        </div>
    );
};

export default CreateProfile;
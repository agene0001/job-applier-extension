import React, { useState } from 'react';
import HomePage from './homepage';
import Createprofile from './createprofile';
import UploadDoc from './FileUploader';
import Navbar from "./navbar";
import EditJobInfo from "./editjobinfo";
// import AppliedJobs from './AppliedJobs'; // Assume you have this component

export type Page = 'home' | 'create-profile' | 'applied-jobs'|"edit-job-info";

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage />;
            case 'create-profile':
                return <Createprofile  />;
            case 'applied-jobs':
                break;

            case 'edit-job-info':
                return <EditJobInfo />;
            // return <AppliedJobs setCurrentPage={setCurrentPage} />;
            default:
                return <HomePage  />;
        }
    };

    return (
        <div className="app-container flex grid-container">
            <Navbar title={currentPage} setCurrentPage={setCurrentPage} />

                {renderPage()}
        </div>
    );
};

export default App;
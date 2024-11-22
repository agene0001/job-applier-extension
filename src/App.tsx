import React, { useState } from 'react';
import HomePage from './homepage';
import Createprofile from './createprofile';
import UploadDoc from './FileUploader';
// import AppliedJobs from './AppliedJobs'; // Assume you have this component

export type Page = 'home' | 'create-profile' | 'applied-jobs'|"edit-job-info";

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage setCurrentPage={setCurrentPage} />;
            case 'create-profile':
                return <Createprofile setCurrentPage={setCurrentPage} />;
            case 'applied-jobs':
                break;

            case 'edit-job-info':
                break;
            // return <AppliedJobs setCurrentPage={setCurrentPage} />;
            default:
                return <HomePage setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div className="app-container">
            {renderPage()}
        </div>
    );
};

export default App;
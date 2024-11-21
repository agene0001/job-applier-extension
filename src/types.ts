// types.ts

// Enum for Page, assuming it wasn't defined in the provided scripts
export enum Page {
    HOME = 'home',
    CREATE_PROFILE = 'createpage',
    // Add more pages here if necessary
}
export interface DriveUploadResponse {
    id: string;
    webViewLink?: string;
}
export interface DriveFileResponse {
    id: string;
    name: string;
    webViewLink: string;
    [key: string]: any; // To handle any additional properties in the response
}

export interface Employment {
    jobTitle: string;
    company: string;
    location: string;
    jStart: string;
    jEnd: string;
    info: string[];
}

export interface Education {
    college: string;
    edStart: string;
    edEnd: string;
    GPA?: number|null;
    degrees: string[];
    edInfo: string[];  // Changed from string[] to string
    extraInfo?: string[];
}
export interface openJobSite {
    action: string,
    site: string, name: string,
    pageInd: number,
    query: string,
    xpLevel: string[]

}

export interface ResumeData {
    name: string;
    address: string;
    email: string;
    website: string;
    phone: string;
    education: Education[];
    skills: string[];
    intro: string;
    employment: Employment[];
}
export interface JobDetails {
    jobTitle: string | null;
    companyName: string | null;
    extraInfo: string | null;
    jobDescription: string | null;
    jobLink: string | null;
    skills: string[];
}
// Props for HomePage component
export interface HomePageProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

// Props for CreateProfile component
export interface CreateProfileProps {
    setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
}

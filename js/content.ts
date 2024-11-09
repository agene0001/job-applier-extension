import dotenv from 'dotenv';
import {Education, Employment, ResumeData,DriveUploadResponse} from '../src/types';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { GoogleAPIService } from './gapi-service';
import createReport from "docx-templates";

declare const chrome: any; // Declare chrome as a global variable for Chrome APIs
dotenv.config();

const googleAPI = GoogleAPIService.getInstance();

// Function to initialize the GAPI client
// types.d.ts



class DriveService {
    private static resumesFolderId: string | null = null; // Singleton instance for the resumes folder ID

    private static async getToken(): Promise<string> {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_AUTH_TOKEN'
        });
        return response.token;
    }

    // Function to create or get folder ID based on folder name
    public static async createOrGetFolder(folderName: string, parentId: string | null = null): Promise<string> {
        const token = await this.getToken();

        // Search for the folder
        const queryParams = new URLSearchParams({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'${parentId ? ` and '${parentId}' in parents` : ''}`,
            fields: "files(id,name)"
        });

        const response = await fetch(
            'https://www.googleapis.com/drive/v3/files?' + queryParams,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        // If folder exists, return its ID
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }

        // Otherwise, create a new folder
        const createResponse = await fetch(
            'https://www.googleapis.com/drive/v3/files',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: parentId ? [parentId] : []
                })
            }
        );

        const newFolder = await createResponse.json();
        return newFolder.id;
    }

    // Retrieves or initializes the singleton resumes folder ID
    public static async getResumesFolderId(): Promise<string> {
        if (!this.resumesFolderId) {
            this.resumesFolderId = await this.createOrGetFolder('resumes');
        }
        return this.resumesFolderId;
    }

    public static async uploadFile(
        blob: Blob,
        filename: string,
        folderId: string
    ): Promise<DriveUploadResponse> {
        const token = await this.getToken();

        const metadata = {
            name: filename,
            parents: [folderId],
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const formData = new FormData();
        formData.append('metadata', new Blob(
            [JSON.stringify(metadata)],
            { type: 'application/json' }
        ));
        formData.append('file', blob);

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    }
}




class DocFormatter {
    public formatEducation (education: Education[]): { [key: string]: string }[]{
        return education.map(ed => ({
            college: ed.college,
            degrees: ed.degrees.join(', '),
            edStart: ed.edStart,
            edEnd: ed.edEnd,
            GPA: ed.GPA !== undefined && ed.GPA !== null ? `${ed.GPA}` : '',
            // edInfo: ed.edInfo ? ed.edInfo.join(', ') : '',
            // extraInfo: ed.extraInfo ? ed.extraInfo.join(', ') : ''
        }));
    };

    public formatEmployment(employment: Employment[]): { [key: string]: string }[] {
        return employment.map(job =>{
            return {
                jobTitle: job.jobTitle,
                company: job.company,
                location: job.location,
                jStart: job.jStart,
                jEnd: job.jEnd,
                info: job.info.join(', ')
            }
        })
    }
    // `${job.jobTitle} at ${job.company}, ${job.location} (${job.jStart} - ${job.jEnd}): ${job.info.join(', ')}`


    public loadResume(resumeFilePath: string): Promise<Uint8Array> {
        const fullPath = chrome.runtime.getURL(resumeFilePath);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', fullPath, true);
            xhr.responseType = 'arraybuffer';

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const arrayBuffer = xhr.response;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    resolve(uint8Array); // Return Uint8Array directly
                } else {
                    reject(new Error(`Failed to load the resume file. Status: ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error('An error occurred while making the XMLHttpRequest.'));
            };

            xhr.send();
        });
    }


    public async saveResume(
        templateArrayBuffer: Uint8Array,
        resumeData: ResumeData,
        companyName: string,
        jobTitle: string
    ): Promise<DriveUploadResponse> {
        try {
            // Convert Uint8Array to Buffer
            const templateBuffer = Buffer.from(templateArrayBuffer);

            const date = new Date(Date.now());
            const formattedDate = `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
            const fileName = `${jobTitle.toLowerCase().replace(/\s+/g, '')}-${companyName.toLowerCase().replace(/\s+/g, '')}-${formattedDate}.docx`;

            // Create the report using docx-templates
            const reportBuffer = await createReport({
                template: templateBuffer,
                data: {
                    name: resumeData.name,
                    address: resumeData.address,
                    email: resumeData.email,
                    website: resumeData.website,
                    phone: resumeData.phone,
                    intro: resumeData.intro,
                    skills1: resumeData.skills.slice(0, resumeData.skills.length / 2).join(', '),
                    skills2: resumeData.skills.slice(resumeData.skills.length / 2).join(', '),
                    education: this.formatEducation(resumeData.education),
                    employment: this.formatEmployment(resumeData.employment),
                },
                cmdDelimiter: ['{{', '}}'], // Adjust delimiters if needed
            });

            // Generate blob for Google Drive upload
            const blob = new Blob([reportBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            // Upload to Drive
            const resumesFolderId = await DriveService.getResumesFolderId();
            const uploadResponse = await DriveService.uploadFile(blob, fileName, resumesFolderId);

            console.log('Resume uploaded successfully:', uploadResponse.webViewLink);
            return uploadResponse;
        } catch (error) {
            console.error('Error saving resume:', error);
            throw new Error(`Failed to save resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

}
// Example usage
const resumeFilePath = './jobApplier/resume_template.docx'; // Ensure the path is correct
const outputFilePath = 'updated_resume.docx'; // Path to save the updated resume
(async () => {
    try {
        let resumeFormater = new DocFormatter()

        const resumeData: ResumeData = {
            name: 'John Doe',
            address: '1234 Mahogany Lane',
            email: 'johndoe@example.com',
            website: 'http://agene001.com',
            phone: '123-456-7890',
            education: [
                {
                    degrees: ['Bachelor of Science in Computer Science'],
                    college: 'University of Minnesota',
                    GPA: 3.8,
                    edStart: 'June 20XX',
                    edEnd: 'June 20XX',
                    edInfo: ['Distinguished member of university’s Accounting Society', 'Relevant coursework: Advanced Financial Accounting and Reporting']
                },   {
                    degrees: ['Bachelor of Science in Computer Science'],
                    college: 'University of Minnesota',
                    GPA: 3.8,
                    edStart: 'June 20XX',
                    edEnd: 'June 20XX',
                    edInfo: ['Distinguished member of university’s Accounting Society', 'Relevant coursework: Advanced Financial Accounting and Reporting']
                }
            ],
            skills: ['Python', 'JavaScript', 'C++', 'Java'],
            intro: 'Analytical, organized and detail-oriented accountant with GAAP expertise...',
            employment: [
                {
                    jobTitle: 'Software Developer',
                    company: 'XYZ Corp',
                    location: 'San Francisco, CA',
                    jStart: 'June 2020',
                    jEnd: 'Present',
                    info: ['Developed multiple web applications and improved system performance by 20%.']
                }
            ]
        };
        const jobTitle = 'Software Developer'; // Replace with the actual job title
        const companyName = "xyz co"
        // Generate the document and upload it to Google Drive, get the file URL
        const zip = await resumeFormater.loadResume(resumeFilePath);
        const reportBuffer = await createReport({
            template: zip,
            data: {
                name: resumeData.name,
                address: resumeData.address,
                email: resumeData.email,
                website: resumeData.website,
                phone: resumeData.phone,
                intro: resumeData.intro,
                skills1: resumeData.skills.slice(0, resumeData.skills.length / 2).join(', '),
                skills2: resumeData.skills.slice(resumeData.skills.length / 2).join(', '),
                education: resumeFormater.formatEducation(resumeData.education),
                employment: resumeFormater.formatEmployment(resumeData.employment),
            },
            cmdDelimiter: ['{', '}'], // Assuming the template uses {{tag}} syntax
        });
        const uploadResponse = await resumeFormater.saveResume(reportBuffer, resumeData,companyName,jobTitle);
        // const jobTitle = 'Software Developer'; // Replace with the actual job title
        // const resumesFolderId = await DriveService.getResumesFolderId();
        // const jobFolderId = await DriveService.createOrGetFolder(jobTitle, resumesFolderId);
        //
        // console.log(`Folder for "${jobTitle}" created or retrieved with ID: ${jobFolderId}`);

        console.log('Resume uploaded! View at:', uploadResponse.webViewLink);

    } catch (error) {
        console.error('An error occurred:', error);
    }
})();






console.log("Content script loaded!");
const apiKey = process.env.OPENAI_API_KEY;
// downloadResume()


// async function runPythonCode(code: string): Promise<any> {
//     let pyodide = await loadPyodide();
//     return pyodide.runPython(code);
// }
// runPythonCode("print('Hello World!')").then(console.log);
interface JobDetails {
    jobTitle: string | null;
    companyName: string | null;
    extraInfo: string | null;
    jobDescription: string | null;
    jobLink: string | null;
    skills: string[];
}

// Example usage:
const profile = {
    name: "John Doe", experience: "5 years in software development", skills: ["JavaScript", "React", "Node.js"]
};

const jobInfo = {
    title: "Senior Software Developer",
    company: "Tech Solutions Inc.",
    description: "Looking for an experienced software developer with expertise in JavaScript and React..."
};

// GPTParser(profile, jobInfo).then(result => {
//     if (result) {
//         console.log("Generated resume:", result);
//     }
// });
// Call the function and handle the response
// GPTParser().then(r => {
//     // console.log(r)
//     if (r) {
//         // console.log(r); // Print the entire response object
//         console.log(r.message.content); // Print the entire response object
//     } else {
//         console.log("No response received.");
//     }
// });

chrome.runtime.onMessage.addListener((request:any, sender:any, sendResponse:any) => {
    console.log("message: " + request.action)
    if (request.action === "runContentScript") {
        console.log("Content script activated!");
        // handlePage(); // Call your parsing function or any other actions
        main()
    } else {
        console.log("Unknown action:", request.action)
    }
});


// Define the delay function before it's used
function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Abstract Factory Interface
class JobBoardFactory {
    constructor() {
        if (new.target === JobBoardFactory) {
            throw new TypeError("Cannot construct JobBoardFactory instances directly");
        }
        // this.currentURL = currentURL;
    }

    createFactory() {
        throw new Error("Method CreateFactory() not implemented.");
    }

}

class CompositeFactory extends JobBoardFactory {
    factories: facade[] = []

    createFacade(url: string) {
        let facade: facade | null = null;
        for (const factory of this.factories) {
            if (factory.getFacade(url) != null) {
                facade = factory;
            }
        }
        if (facade != null) {
            return facade
        } else {
            console.log("No facade found with URL.");
        }
    };

    addFactory(factory: facade) {
        this.factories.push(factory)
    }
}

class facade {
    constructor() {
        if (new.target === facade) {
            throw new TypeError("Cannot construct Facade instances directly");
        }
        // this.currentURL = currentURL;
    }

    getFacade(url: string) {
        throw new Error("Method getFacade() not implemented.");

    }

    async GPTParser(profile: any, jobInfo: any) {

        // Convert profile and jobInfo to JSON strings
        const profileString = JSON.stringify(profile, null, 2);
        const jobInfoString = JSON.stringify(jobInfo, null, 2);
        // Craft the message, including the profile and job information
        const messageContent = `You are an experienced resume writer who helps clients create tailored, impactful resumes. 
                            You consider the target job's description, industry norms, and the client's work experience and background to produce ATS-optimized resumes.
                            Here is the client's profile:
                            ${profileString}
                            And here is the target job information:
                            ${jobInfoString}
                            Please transform the client's profile into a tailored resume for the provided job. I need you to return the resume info in this json format resume_data = {
    "name": "John Doe",
    "address": "1234 mahogany lane",
    "email": "johndoe@example.com",
    "website": "http://agene001.com",  # Ensure it's a full URL
    "phone": "123-456-7890",
    "education": [{"degrees": ["Bachelor of Science in Computer Science", "Bachelor of Science in Computer Science"],
                   "college": "University of Minnesota",
                   "GPA": 3.8,
                   "edStart": "June 20XX",
                   "edEnd": "June 20XX",
                   "edInfo": ["Distinguished member of university’s Accounting Society",
                              "Relevant coursework: Advanced Financial Accounting and Reporting"]}],
    "skills": ["Python", "JavaScript", "C++", "Java"],
    "intro": "Analytical, organized and detail-oriented accountant with GAAP expertise and experience in the full spectrum of public accounting. Collaborative team player with ownership mentality and a track record of delivering the highest quality strategic solutions to resolve challenges and propel business growth.",
    "employment": [
        {
            "jobTitle": "Software Developer",
            "company": "XYZ Corp",
            "location": "San Francisco, CA",
            "jStart": "June 2020",
            "jEnd": "Present",
            "info": ["Developed multiple web applications and improved system performance by 20%."]
        },
        {
            "jobTitle": "Intern",
            "company": "ABC Inc.",
            "location": "New York, NY",
            "jStart": "June 2019",
            "jEnd": "August 2019",
            "info": [
                "Assisted in the development of internal tools and conducted research on new technologies.",
                "Assisted in the development of internal tools and conducted research on new technologies."]
        }
    ],
}
Here are some requirements as your filling out the fields. 1. their is some information that shouldn't be changed like where they went to school and dates but descriptions can be changed to create a more ATS friendly.
You should decided whether more of the resume is focused on experience or education. Not all info from the profile needs to be used (besides education, name, phone, address and website ), it is more of a guide so you have a holistic view of who your making the resume for.
Try to aim for at least 1 job and all the education but don't make any experience the user didn't do. If the user doesnt have education or employment just leave that section blank. You also shouldn't lie to fulfill a posted job requirement. 

`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST", headers: {
                "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`,
            }, body: JSON.stringify({
                model: "gpt-4o-mini", // Ensure this model is available to your API key
                messages: [{role: "system", content: "You are an experienced resume writer."}, {
                    role: "user", content: messageContent
                },],
            }),
        });

        if (!response.ok) {
            const errorResponse = await response.json(); // Capture the error response
            console.error("Error:", response.statusText, errorResponse);
            return; // Exit early if there's an error
        }

        const data = await response.json();

        // console.log(data.choices[0].message.content); // Print the first choice from the response
        return data.choices[0].message.content;
    }

    getJobs(): Promise<Element[]> {
        throw new Error("Method getJobs() not implemented.");
    }

    modifyPage() {
        throw new Error("Method modifyPage() not implemented.");
    }

    parseJobs(jobs: Promise<Element[]>): Promise<JobDetails[]> {
        throw new Error("Method parseJobs() not implemented.");
    }
}

// Concrete Factories
class LinkedInFacade extends facade {
    getFacade(url: string) {
        if (url.includes("https://www.linkedin.com")) {
            return this
        } else return null
    }

    getJobs(): Promise<Element[]> {
        return new Promise((resolve, reject) => {
            const jobsContainer = document.querySelector(".jobs-search-results-list");
            if (!jobsContainer) {
                console.log("Jobs container not found.");
                reject("No jobs found.");
                return;
            }

            const foundJobs: Element[] = [];
            const jobIds = new Set();

            const logJobs = () => {
                const jobs = document.querySelectorAll(".scaffold-layout__list-container > li");
                console.log(`Total jobs found: ${jobs.length}`);

                jobs.forEach(job => {
                    const jobId = job.id;
                    const footer: HTMLElement | null = job.querySelector(".job-card-list__footer-wrapper");

                    if (jobId && !jobIds.has(jobId) && footer) {
                        jobIds.add(jobId);
                        const footerText = footer.innerText;

                        if (!footerText.includes("Applied")) {
                            foundJobs.push(job);
                        }
                    }
                });

                return foundJobs.length;
            };

            let prevJobLen = 0;
            const scrollInterval = setInterval(() => {
                jobsContainer.scrollBy(0, 400);

                const currentJobCount = logJobs();

                if (jobsContainer.scrollHeight <= jobsContainer.scrollTop + jobsContainer.clientHeight || currentJobCount === prevJobLen) {
                    clearInterval(scrollInterval);
                    resolve(foundJobs);
                }

                prevJobLen = currentJobCount;
            }, 1000);
        });
    }

    modifyPage() {
        // Implement LinkedIn specific page modifications if needed
    }

    convertToJson() {

    }

    async extractJobDetails(job: HTMLElement): Promise<JobDetails> {
        const title: HTMLAnchorElement | null = job.querySelector("a > span:first-child");
        title?.click();  // Click the job title to load the details page
        console.log(`Clicked job: ${title?.innerText}`);
        const link: HTMLAnchorElement | null = job.querySelector("a ");
        // Wait for the page to load before attempting to fetch the company name
        await delay(2000);  // Delay of 2 seconds to ensure the page loads

        const companyNameElement: HTMLElement | null = document.querySelector(".job-details-jobs-unified-top-card__company-name");
        const extraJobInfo: HTMLElement | null = document.querySelector(".job-details-jobs-unified-top-card__job-insight");
        const jobDetails: HTMLElement | null = document.querySelector("#job-details");
        const jobMatch: HTMLElement | null = document.querySelector("#how-you-match-card-container");
        const skillsBtn: HTMLElement | null | undefined = jobMatch?.querySelector(".artdeco-button");

        skillsBtn?.click();
        await delay(500);

        const modal: HTMLElement | null = document.querySelector(".artdeco-modal");
        const skills: HTMLElement | null | undefined = modal?.querySelector(".job-details-skill-match-modal__container");
        const skillsList = skills?.getElementsByTagName("li");

        const skillTexts: string[] = [];
        if (skillsList) {
            for (const skill of skillsList) {
                skillTexts.push(skill.innerText);
            }
        }

        const modalBtn: HTMLElement | null | undefined = modal?.querySelector(".artdeco-modal__dismiss");
        modalBtn?.click();
        return {
            jobTitle: title?.innerText || null,
            companyName: companyNameElement?.innerText || null,
            extraInfo: extraJobInfo?.innerText || null,
            jobDescription: jobDetails?.innerText || null,
            skills: skillTexts,
            jobLink: link?.href || null,
        };
    }

    async parseJobs(jobs: Promise<Element[]>): Promise<JobDetails[]> {
        return new Promise(async (resolve, reject) => {
            console.log(chrome.storage.local.get(["profiles"]));
            try {
                const jobElements = await jobs;
                const allJobDetails: JobDetails[] = [];
                chrome.storage.sync.get(['profiles'], async (result:any) => {
                    for (const job of jobElements) {
                        const jobDetails = await this.extractJobDetails(job as HTMLElement);
                        const pattern = /```json\n([\s\S]*?)\n```/;
                        let gptOutput;
                        // this.GPTParser(result.profiles, jobDetails).then((result1) => {
                        //     // console.log(result1)
                        //     gptOutput = result1.match(pattern)[1]
                        //     console.log(gptOutput);
                        //
                        // })
                        // if (gptOutput !== undefined) {
                        //     console.log(gptOutput)
                        // }
                        // await delay(500);
                        const applyBtn: HTMLButtonElement | null = document.querySelector(".jobs-apply-button--top-card > button");
                        // console.log(applyBtn);
                        applyBtn?.click();
                        await delay(200);
                        const modal = document.querySelector(".artdeco-modal");

                        while (true) {
                            const modalContent = modal?.querySelector(".jobs-easy-apply-content");
                            console.log(modalContent);
                            const nextBtn: HTMLButtonElement | null | undefined = modal?.querySelector("button[data-easy-apply-next-button]");
                            nextBtn?.click()
                            let upload: HTMLButtonElement | null | undefined = modal?.querySelector(".jobs-document-upload__upload-button");
                            upload?.click();
                            let submit: HTMLButtonElement | null | undefined;
                            let btnText = modal?.querySelectorAll('button span');
                            if(btnText) {
                                const reviewBtn = Array.from(btnText)
                                    .find(span => span.textContent?.trim() === 'Review')
                                    ?.closest('button');
                                reviewBtn?.click();
                                console.log("review button: " + reviewBtn);
                                const submit = Array.from(btnText)
                                    .find(span => span.textContent?.trim() === 'Submit application')
                                    ?.closest('button');

                                console.log("Submit btn: " + submit);
                            }
                            console.log("upload btn: " + upload);
                            console.log("next button: " + nextBtn)
                            let formInfo: NodeListOf<Element> | undefined = modal?.querySelectorAll(".jobs-easy-apply-form-section__grouping")
                            if (formInfo !== null && formInfo !== undefined) {

                                // alert("hi")
                                for (const info of formInfo) {
                                    // Select using a class and attribute as fallback
                                    if(info) {

                                        let checkbox = info.querySelector("fieldset");
                                        if(checkbox) {
                                            let label: HTMLLegendElement|null = info.querySelector("legend");
                                            if (label) {
                                                console.log("Label for fieldset field: " + label.textContent);
                                            }
                                            let fields = info.querySelectorAll("div[data-test-text-selectable-option]");
                                            if(fields && fields.length > 0) {
                                                for(const field of fields) {
                                                    console.log("fieldset field: "+field.textContent);
                                                }
                                            }
                                            const fieldset = document.querySelector('[data-test-form-builder-radio-button-form-component="true"]');
                                            if(fieldset) {
                                                const selectedOption = Array.from(fieldset.querySelectorAll('div[data-test-text-selectable-option]'))
                                                    .find(option => option.classList.contains('selected') || option.getAttribute('aria-selected') === 'true');

                                                if (selectedOption) {
                                                    const selectedValue = selectedOption.querySelector('input')?.value;
                                                    console.log(`Selected option: ${selectedValue}`);
                                                } else {
                                                    console.log('No option is selected');
                                                }
                                            }

                                        }
                                        else {
                                            let label: HTMLLabelElement | null = info.querySelector("label");
                                            if (label) {
                                                console.log("Label for form field: " + label.textContent);
                                            }
                                            const selectElement: HTMLSelectElement | null = info?.querySelector("select[data-test-text-entity-list-form-select]");
                                            const textElement = info?.querySelector(".artdeco-text-input--container");
                                            if (selectElement) {
                                                const selecOptions = selectElement?.querySelectorAll("option");
                                                for (const option of selecOptions) {
                                                    console.log("option: " + option.textContent);
                                                }
                                                const selectedValue = selectElement?.value;
                                                console.log("Selected value in select list: " + selectedValue);
                                            }
                                            if (textElement) {
                                                let input: HTMLInputElement | null = textElement?.querySelector("input");
                                                console.log("Text field input value: " + input?.value);
                                            }
                                        }
                                        console.log(info);
                                    }
                                }
                            }
                            if (submit !== undefined&&submit!==null) {
                                break;
                            } else {
                                nextBtn?.click();
                                await delay(200);
                            }
                        }
                        allJobDetails.push(jobDetails);
                    }
                });

                // Print all extracted job details
                resolve(allJobDetails);
            } catch (err) {
                console.log("Error occurred.");
                reject(err);
            }
        })
    }


// Usage example:

}

// class IndeedFacade extends facade{
//     getFacade(url:string) {
//         if(url.includes("https://www.indeed.com")){
//             return this
//         }
//         else{
//             return null
//         }
//     }
//     getJobs() {
//         console.log("Modifying Indeed page...");
//         const hideElements = document.querySelectorAll('.some-class-to-hide');
//         hideElements.forEach(el => el.style.display = 'none');
//         return new Promise(resolve => resolve([]));
//     }
//
//     modifyPage() {
//         // Implement Indeed specific page modifications if needed
//     }
//
//     parseJobs(jobs) {
//         // Implement parsing logic if needed
//     }
// }
//
// class HandshakeFacade extends facade {
//     getFacade(url:string) {
//         if(url.includes("https://www.handshake.com")){
//             return this
//         }
//         else{
//             return null
//         }
//     }
//     getJobs() {
//         console.log("Modifying Handshake page...");
//         const messageDiv = document.createElement('div');
//         messageDiv.textContent = "Welcome to the Handshake Job Board!";
//         messageDiv.style.fontSize = '20px';
//         document.body.prepend(messageDiv);
//     }
//
//     modifyPage() {
//         // Implement Handshake specific page modifications if needed
//     }
//
//     parseJobs(jobs) {
//         // Implement parsing logic if needed
//     }
// }

function main() {
    let factory: CompositeFactory = new CompositeFactory();
    factory.addFactory(new LinkedInFacade());
// factory.addFactory(new HandshakeFacade());
// factory.addFactory(new IndeedFacade());
// Client Code
    const currentURL = window.location.href;
    const jobBoardFacade = factory.createFacade(currentURL);
    if (jobBoardFacade) {
        // jobBoardFacade.modifyPage();
        let jobs: Promise<Element[]>;
        jobs = jobBoardFacade.getJobs()
        let parseJobs = jobBoardFacade.parseJobs(jobs).then((jobs1: JobDetails[]) => {
            chrome.storage.sync.get(['profiles'], async (result:any) => {
                if (result.profiles) {
                    // console.log(result.profiles);
                    // downloadResume();
                    for (const job of jobs1) {


                    }
                } else {
                    console.log("no profiles found.");
                }
            });
        })
    }

}

import dotenv from 'dotenv';
import {Education, Employment, ResumeData, DriveUploadResponse, JobDetails} from '../src/types';
import {DriveService} from "./drive-service";
import PizZip from 'pizzip';


import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ExternalHyperlink
} from "docx";

declare const chrome: any; // Declare chrome as a global variable for Chrome APIs
dotenv.config();

// const googleAPI = GoogleAPIService.getInstance();

// Function to initialize the GAPI client
// types.d.ts


class DocFormatter {
    public textColor = "266144";
    public hyperlinkColor = "0000FF";
    public spacingColor = "53bb89";
    public textSize = 20;
    public headingSize = 72;
    public subHeadingSize = 32;


    private spacing() {
        const pageWidthInDXA = 9000; // This is approximately 6.75 inches in DXA, which is around the page width for Letter-size

        return [new Table({
            columnWidths: [4505, 4505], borders: {
                top: {style: BorderStyle.NONE}, // bottom: { style: BorderStyle.TRIPLE ,color: "0000FF"},
                left: {style: BorderStyle.NONE},
                right: {style: BorderStyle.NONE},
                insideHorizontal: {style: BorderStyle.NONE},
                insideVertical: {style: BorderStyle.NONE},
            }, // spacing: { after: 200 }, // Adds space after the table

            rows: [new TableRow({
                tableHeader: true,

                children: [new TableCell({
                    children: [], width: {size: 4500, type: WidthType.DXA}, // Half of table width
                    margins: {
                        left: 100, right: 100, // bottom: 200, // Add spacing below the cell's content

                    }, borders: {
                        bottom: {
                            style: BorderStyle.TRIPLE, color: this.spacingColor, // Set bottom border color to blue
                            size: 36,
                        },

                    },
                }), new TableCell({
                    children: [], width: {size: 4500, type: WidthType.DXA}, // Half of table width
                    margins: {
                        left: 100, right: 100, // bottom: 200, // Add spacing below the cell's content

                    }, borders: {
                        bottom: {
                            style: BorderStyle.TRIPLE, color: this.spacingColor, // Set bottom border color to blue
                            size: 36,
                        },
                    },
                }),],
            }),],
        }), new Paragraph({
            spacing: {after: 200}, // Adds space below the table
        })]
    }

// private spacing() {
//     return new Paragraph({
//         border: {
//             bottom: {
//                 style: BorderStyle.SINGLE,
//                 size: 6,   // Increase this size for a thicker line
//                 space: 1,
//                 color: this.spacingColor || "000000" // Default black color for the line
//             }
//         },
//         children: [] // Empty content so the border is the only visible element
//     });
// }

    private getTextRun = (text: string, options: object = {}): TextRun => {
        return new TextRun({
            text: text, font: 'Calibri', // Apply Calibri font to all TextRuns
            ...options,
        });
    };
    private getBulletPoint = (): TextRun[] => {
        return [new TextRun({
            text: "•", color: this.spacingColor, // Hex color code (red in this example)
            size: this.textSize + 5,
        }), // Add a space after bullet
            new TextRun({
                text: " ", size: this.subHeadingSize
            })]
    };


    public createDoc(resumeData: ResumeData) {
        // Skills Content
        // Split the skills into two parts
        const firstHalfSkills = resumeData.skills.slice(0, Math.ceil(resumeData.skills.length / 2));
        const secondHalfSkills = resumeData.skills.slice(Math.ceil(resumeData.skills.length / 2));

        return new Document({
            background: {
                color: "#dcf1e7",
            }, sections: [{
                properties: {}, children: [// Header with name and contact info
                    new Paragraph({
                        children: [this.getTextRun(resumeData.name, {
                            bold: true, size: this.headingSize, color: this.textColor
                        })], alignment: AlignmentType.LEFT, spacing: {after: 200},
                    }), new Paragraph({
                        children: [this.getTextRun(`${resumeData.address} | ${resumeData.phone} | ${resumeData.email} |`, {
                            color: this.textColor, size: this.textSize,
                        }), new ExternalHyperlink({
                            children: [this.getTextRun(`Portfolio`, {color: this.hyperlinkColor, size: this.textSize})],
                            link: resumeData.website,
                        }),


                        ], alignment: AlignmentType.LEFT, spacing: {after: 400},
                    }),

                    // Introduction Section
                    new Paragraph({
                        children: [this.getTextRun(resumeData.intro, {
                            color: this.textColor, size: this.textSize,
                        })], alignment: AlignmentType.LEFT,
                    }),

                    // Horizontal Line
                    ...this.spacing(),

                    // Education Section Header
                    new Paragraph({
                        children: [this.getTextRun("Education", {
                            bold: true, size: this.subHeadingSize,  // Apply font size in points
                            color: this.textColor,
                        })], alignment: AlignmentType.LEFT, spacing: {after: 200},
                    }),

                    // Education Details
                    ...resumeData.education.map((education: Education) => {
                        if (education.GPA === undefined) {
                            return [new Paragraph({
                                children: [this.getTextRun(`${education.college} | ${education.degrees.join(" | ")}`, {
                                    color: this.textColor, size: this.textSize, bold: true
                                })],
                            }), new Paragraph({
                                children: [this.getTextRun(`(${education.edStart} - ${education.edEnd})`, {
                                    color: this.textColor, size: this.textSize
                                })],
                            }), ...(education.edInfo ? education.edInfo.map((edInfo) => new Paragraph({
                                children: [...this.getBulletPoint(), this.getTextRun(edInfo, {
                                    color: this.textColor, size: this.textSize
                                })]
                            })) : [])];
                        } else {
                            return [new Paragraph({
                                children: [this.getTextRun(`${education.college} | ${education.degrees.join(" | ")}`, {
                                    color: this.textColor, size: this.textSize, bold: true
                                })],
                            }), new Paragraph({
                                children: [this.getTextRun(`(${education.edStart} - ${education.edEnd})`, {
                                    color: this.textColor, size: this.textSize
                                })],
                            }), ...(education.edInfo ? education.edInfo.map((edInfo) => new Paragraph({
                                children: [...this.getBulletPoint(), this.getTextRun(edInfo, {
                                    color: this.textColor, size: this.textSize
                                })]
                            })) : []), new Paragraph({
                                children: [this.getTextRun(`GPA: ${education.GPA}`, {
                                    italics: true, color: this.textColor, size: this.textSize
                                })], spacing: {after: 200},
                            }),];
                        }
                    }).flat(),

                    // Horizontal Line after Education
                    ...this.spacing(),

                    // Experience Section Header
                    new Paragraph({
                        children: [this.getTextRun("Experience", {
                            bold: true, size: this.subHeadingSize,  // Apply font size in points
                            color: this.textColor,
                        })], alignment: AlignmentType.LEFT, spacing: {after: 200},
                    }),

                    // Experience Details
                    ...resumeData.employment.map(employment => {
                        return [new Paragraph({
                            children: [this.getTextRun(`${employment.jobTitle} | ${employment.company} | ${employment.location}`, {
                                color: this.textColor, size: this.textSize, bold: true
                            })],
                        }), new Paragraph({
                            children: [this.getTextRun(`(${employment.jStart} - ${employment.jEnd})`, {
                                color: this.textColor, size: this.textSize
                            })], spacing: {after: 200},
                        }), ...(employment.info ? employment.info.map((empInfo) => new Paragraph({
                            children: [...this.getBulletPoint(), this.getTextRun(empInfo, {
                                color: this.textColor, size: this.textSize
                            })]
                        })) : [])];
                    }).flat(),

                    // Horizontal Line after Experience
                    ...this.spacing(),

                    // Skills Section Header
                    new Paragraph({
                        children: [this.getTextRun("Skills", {
                            bold: true, size: this.subHeadingSize,  // Apply font size in points
                            color: this.textColor
                        })], alignment: AlignmentType.LEFT, spacing: {after: 200},
                    }),


                    new Table({
                        columnWidths: [4505, 4505], borders: {
                            top: {style: BorderStyle.NONE},
                            bottom: {style: BorderStyle.NONE},
                            left: {style: BorderStyle.NONE},
                            right: {style: BorderStyle.NONE},
                            insideHorizontal: {style: BorderStyle.NONE},
                            insideVertical: {style: BorderStyle.NONE},
                        }, rows: [new TableRow({
                            tableHeader: true,

                            children: [new TableCell({
                                children: firstHalfSkills.map(skill => new Paragraph({
                                    children: [...this.getBulletPoint(), this.getTextRun(skill, {
                                        color: this.textColor, size: this.textSize
                                    })], // bullet: { level: 0 },
                                    spacing: {before: 100, after: 100},
                                })), width: {size: 4500, type: WidthType.DXA}, // Half of table width
                                margins: {
                                    left: 100, right: 100,
                                },
                            }), new TableCell({
                                children: secondHalfSkills.map(skill => new Paragraph({
                                    children: [...this.getBulletPoint(), this.getTextRun(skill, {
                                        color: this.textColor, size: this.textSize
                                    })], // bullet: { level: 0 },
                                    spacing: {before: 100, after: 100},
                                })), width: {size: 4500, type: WidthType.DXA}, // Half of table width
                                margins: {
                                    left: 100, right: 100,
                                },
                            }),],
                        }),],
                    }),


                ],
            }],
        });
    }


    public async saveResume(resumeData: ResumeData, companyName: string, jobTitle: string): Promise<[DriveUploadResponse, string]> {
        try {
            const doc = this.createDoc(resumeData)


            // Generate .docx file
            const blob = await Packer.toBlob(doc);

            // Get the folder ID for resumes
            const resumesFolderId = await DriveService.getResumesFolderId();
            const date = new Date();

            // Generate file name based on job and company
            const fileName = `${jobTitle.toLowerCase().replace(" ", "")}-${companyName.toLowerCase().replace(" ", "")}-${Date.now()}.DOCX`;

            // Upload to Drive
            const uploadResponse = await DriveService.uploadFile(blob, fileName, resumesFolderId);

            console.log('Resume uploaded successfully:', uploadResponse.webViewLink);
            return [uploadResponse, fileName];
        } catch (error) {
            console.error('Error saving resume:', error);
            throw new Error(`Failed to save resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }


}

// Example usage

const resumeFilePath = './jobApplier/resume_template.docx'; // Ensure the path is correct
const outputFilePath = 'updated_resume.docx'; // Path to save the updated resume
const resumeData: ResumeData = {
    name: 'John Doe',
    address: '1234 Mahogany Lane',
    email: 'johndoe@example.com',
    website: 'http://agene001.com',
    phone: '123-456-7890',
    education: [{
        degrees: ['Bachelor of Science in Computer Science'],
        college: 'University of Minnesota',
        GPA: 3.8,
        edStart: 'June 20XX',
        edEnd: 'June 20XX',
        edInfo: ['Distinguished member of university’s Accounting Society', 'Relevant coursework: Advanced Financial Accounting and Reporting']
    }, {
        degrees: ['Bachelor of Science in Computer Science', 'Bachelor of Science in Computer Science'],
        college: 'University of Minnesota',
        GPA: 3.8,
        edStart: 'June 20XX',
        edEnd: 'June 20XX',
        edInfo: ['Distinguished member of university’s Accounting Society', 'Relevant coursework: Advanced Financial Accounting and Reporting']
    }],
    skills: ['Python', 'JavaScript', 'C++', 'Java'],
    intro: 'Analytical, organized and detail-oriented accountant with GAAP expertise...',
    employment: [{
        jobTitle: 'Software Developer',
        company: 'XYZ Corp',
        location: 'San Francisco, CA',
        jStart: 'June 2020',
        jEnd: 'Present',
        info: ['Developed multiple web applications and improved system performance by 20%.', 'Developed multiple web applications and improved system performance by 20%.']
    }]
};
// (async () => {
//     try {
//         let resumeFormater = new DocFormatter()
//
//
//         const jobTitle = 'Software Developer'; // Replace with the actual job title
//         const companyName = "xyz co"
//         // Generate the document and upload it to Google Drive, get the file URL
//         // const zip = await resumeFormater.loadResume(resumeFilePath);
//         const uploadResponse = await resumeFormater.saveResume(resumeData, companyName, jobTitle);
//         // const jobTitle = 'Software Developer'; // Replace with the actual job title
//         // const resumesFolderId = await DriveService.getResumesFolderId();
//         // const jobFolderId = await DriveService.createOrGetFolder(jobTitle, resumesFolderId);
//         //
//         // console.log(`Folder for "${jobTitle}" created or retrieved with ID: ${jobFolderId}`);
//         //
//         console.log('Resume uploaded! View at:', uploadResponse[0].webViewLink);
//
//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// })();


console.log("Content script loaded!");
const apiKey = process.env.OPENAI_API_KEY;
// downloadResume()


// async function runPythonCode(code: string): Promise<any> {
//     let pyodide = await loadPyodide();
//     return pyodide.runPython(code);
// }
// runPythonCode("print('Hello World!')").then(console.log);


// Example usage:
// const profile = {
//     name: "John Doe", experience: "5 years in software development", skills: ["JavaScript", "React", "Node.js"]
// };
//
// const jobInfo = {
//     title: "Senior Software Developer",
//     company: "Tech Solutions Inc.",
//     description: "Looking for an experienced software developer with expertise in JavaScript and React..."
// };

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

chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
    console.log("message: " + request.action)
    if (request.action === "runContentScript") {
        console.log("Content script activated!");
        // handlePage(); // Call your parsing function or any other actions
        main(request.query,request.xpLevel)
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
                            Please transform the client's profile into a tailored resume for the provided job. I need you to return the resume info in this json format """ {
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
""". this is the exact format that the resume needs to be in.
Here are some requirements as your filling out the fields.You need to include all of the fields i provided, especially if If it is provided 1. their is some information that shouldn't be changed like where they went to school and dates but descriptions can be changed to create a more ATS friendly.
please do not make up any experience, skills or education just format them and use words, terms and topics that better match the job description. for example if their a job for a welding gig but most of their resume data is focused on data science, just keep the skills that are relavent to to the welding job that are in the users skills but dont add any since their skillset doesn't seem
to align with the job. You help tailor their experience to make a better resume not to deceive employers.
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

    parseJobs(jobs: Element[]): Promise<JobDetails[]> {
        throw new Error("Method parseJobs() not implemented.");
    }
}

// Concrete Factories
class LinkedInFacade extends facade {
    public docformater = new DocFormatter();

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

            let prevJobLen = -1;
            const scrollInterval = setInterval(() => {
                jobsContainer.scrollBy(0, 400);

                const currentJobCount = logJobs();
                console.log(currentJobCount);
                if (jobsContainer.scrollHeight <= jobsContainer.scrollTop + jobsContainer.clientHeight) {
                    clearInterval(scrollInterval);
                    resolve(foundJobs);
                }
                else if(prevJobLen === currentJobCount) {
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
        // title?.click();  // Click the job title to load the details page

        const link: HTMLAnchorElement | null = job.querySelector("a ");
        let href = link?.href.match(/\/jobs\/view\/(\d+)\//);
         let jobId = href ? href[1] : null;
        console.log(`Clicked job: ${link?.innerText}`);
        console.log(`Job URL: ${link?.href}`);
        console.log(`Job: ${link?.outerHTML}`);
        console.log(`id: ${jobId}`);
        if (jobId) {
            // Parse the current URL
            const url = new URL(window.location.href);

            // Set the new currentJobId without changing anything else
            url.searchParams.set("currentJobId", jobId);

            // Update the browser's URL without reloading the page
            window.history.pushState(null, "", url.toString());

            // Manually trigger the 'popstate' event to notify the page of the change
            const popstateEvent = new PopStateEvent("popstate");
            window.dispatchEvent(popstateEvent);
            console.log(`Updated URL to job: ${url.toString()}`);
        } else {
            console.log("Job ID not found.");
        }
        // Wait for the page to load before attempting to fetch the company name
        await delay(200);  // Delay of 2 seconds to ensure the page loads

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

    private static async getToken(): Promise<string> {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_AUTH_TOKEN'
        });
        return response.token;
    }

// Function to handle user interaction that triggers file input
//     public triggerFileSelection(fileInput: HTMLInputElement, uploadLabel: HTMLLabelElement) {
//         uploadLabel.addEventListener('click', async () => {
//             this.simulateFileUploadViaUrl(fileInput, await DriveService.getResumesFolderId(), 'resume.docx', uploadLabel)
//                 .catch((error) => console.error('Error during file upload:', error));
//         });
//     }

    async fetchCsrfToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        throw new Error('CSRF token not found');
    }

// Function to make the API request


// Function to simulate file input change event with fetched file
    async simulateFileUploadViaUrl(fileInput: HTMLInputElement, url: string, fileName: string, uploadLabel: HTMLLabelElement) {
        try {
            await this.fetchCsrfToken()
            const file = await DriveService.fetchFileFromUrl(url, fileName);
            // chrome.webRequest.onHeadersReceived.addListener(
            //     function(details:any) {
            //         // Search for the CSRF token in the response headers
            //         let csrfToken = null;
            //         for (const header of details.responseHeaders) {
            //             if (header.name.toLowerCase() === 'set-cookie' && header.value.includes('csrftoken')) {
            //                 // Extract the CSRF token from the cookie string
            //                 csrfToken = header.value.split('csrftoken=')[1].split(';')[0];
            //                 break;
            //             }
            //         }
            //         if (csrfToken) {
            //             console.log("CSRF Token: using web request", csrfToken);
            //         }
            //     },
            //     { urls: ["https://www.linkedin.com/*"] }, // Your target domain
            //     ["responseHeaders"]
            // );
            // async function fetchCsrfToken() {
            //     const response = await fetch(document.URL, {
            //         method: 'GET',
            //         credentials: 'include'  // Ensure cookies are sent
            //     });
            //
            //     const text = await response.text();
            //     const csrfTokenMatch = text.match(/csrftoken=(\w+)/);  // Regex to match CSRF token in the page body
            //     if (csrfTokenMatch) {
            //         return csrfTokenMatch[1];
            //     } else {
            //         throw new Error('CSRF token not found in page content');
            //     }
            // }
            //     console.log("CSrf token fetch : ",await fetchCsrfToken());
            console.log(`File size: ${file.size} bytes`);

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;

            const inputEvent = new Event('change', {bubbles: true, cancelable: true});  // 'input' can be more appropriate for file uploads
            fileInput.dispatchEvent(inputEvent);

            // Simulate the click to upload


            uploadLabel?.click();
            // uploadLabel?.click();
        } catch (error) {
            console.error('Error fetching or uploading file:', error);
        }
    }

    async getApplyButton(): Promise<HTMLButtonElement | null> {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                // Primary check: Try to find the apply button using the direct selector
                let applyButton = document.querySelector(".jobs-apply-button--top-card > button") as HTMLButtonElement | null;

                // Fallback check: If not found, look for any button containing "Easy Apply" text
                if (!applyButton) {
                    const buttons = Array.from(document.querySelectorAll("button")) as HTMLButtonElement[];
                    applyButton = buttons.find(button => button.textContent?.includes("Apply")) || null;
                }

                // If button is found, clear the interval and resolve
                if (applyButton) {
                    clearInterval(interval);
                    resolve(applyButton);
                }
            }, 500); // Retry every 500 ms

            // Timeout after 5 seconds if button isn’t found
            setTimeout(() => {
                clearInterval(interval);
                console.log("Apply button not found within timeout.");
                resolve(null);
            }, 5000);
        });
    }


    async parseJobs(jobs: Element[]): Promise<JobDetails[]> {
        return new Promise(async (resolve, reject) => {
            console.log(chrome.storage.local.get(["profiles"]));
            try {
                const jobElements = jobs;
                const allJobDetails: JobDetails[] = [];
                await chrome.storage.sync.get(['profiles'], async (result: any) => {
                    for (const job of jobElements) {
                        const jobDetails = await this.extractJobDetails(job as HTMLElement);
                        const pattern = /```json\n([\s\S]*?)\n```/;
                        let gptOutput;
                        let gptJson: ResumeData | null = null;
                        let result1 = await this.GPTParser(result.profiles, jobDetails)
                        // console.log(result1)
                        gptOutput = result1.match(pattern)[1]
                        // console.log(gptOutput);
                        // console.log(gptOutput);

                        gptJson = JSON.parse(gptOutput);
                        console.log(gptJson);

                        let fileName;
                        let fileId;
                        if (gptJson && jobDetails.companyName && jobDetails.jobTitle) {
                            let temp = await this.docformater.saveResume(gptJson, jobDetails.companyName, jobDetails.jobTitle)
                            fileName = temp[1];
                            fileId = temp[0].id;

                            await delay(200);

                            // const applyBtn: HTMLButtonElement | null = document.querySelector(".jobs-apply-button--top-card > button");
                            const applyBtn: HTMLButtonElement | null = await this.getApplyButton();
                            console.log(applyBtn);
                            if (applyBtn) {
                                applyBtn.click();
                                await delay(200);

                                while (true) {
                                    // await delay(5000);

                                    let modal = document.querySelector(".artdeco-modal");
                                    const modalContent = modal?.querySelector(".jobs-easy-apply-content");
                                    console.log(modalContent);
                                    let upload: HTMLButtonElement | null | undefined = modal?.querySelector(".js-jobs-document-upload__container");
                                    let uploadLabel: HTMLLabelElement | null | undefined = upload?.querySelector(".jobs-document-upload__upload-button");

                                    let uploadInput: HTMLInputElement | null | undefined = upload?.querySelector("input");

                                    if (uploadInput && uploadLabel && fileName && fileId) {
                                        // chrome.runtime.sendMessage({type: 'GET_AUTH_TOKEN'}, (response: {
                                        //     error: any;
                                        //     token: any;
                                        // }) => {
                                        //     if (response.error) {
                                        //         console.error('Error:', response.error);
                                        //     } else {
                                        //         // Store the token in chrome storage
                                        //         chrome.storage.local.set({authToken: response.token}, () => {
                                        //             console.log('Token saved successfully');
                                        //         });
                                        //     }
                                        // });
                                        await this.simulateFileUploadViaUrl(uploadInput, fileId, fileName, uploadLabel);
                                        // await delay(100000)
                                    }
                                    const nextBtn: HTMLButtonElement | null | undefined = modal?.querySelector("button[data-easy-apply-next-button]");
                                    // nextBtn?.click()
                                    // upload?.click();
                                    let submit: HTMLButtonElement | null | undefined;
                                    let btnText = modal?.querySelectorAll('button span');
                                    if (btnText) {
                                        const reviewBtn = Array.from(btnText)
                                            .find(span => span.textContent?.trim() === 'Review')
                                            ?.closest('button');
                                        reviewBtn?.click();
                                        console.log("review button: " + reviewBtn);
                                        submit = Array.from(btnText)
                                            .find(span => span.textContent?.trim().toLowerCase() === 'submit application')
                                            ?.closest('button');


                                    }
                                    // let closeBtn: NodeListOf<HTMLButtonElement> | undefined | null = modal?.querySelectorAll("button[aria-label=Dismiss]");
                                    // console.log("upload btn: " + upload);
                                    console.log("next button: " + nextBtn)
                                    console.log(submit)

                                    if (submit !== undefined && submit !== null) {
                                        await chrome.runtime.onMessage.addListener(function (message: {
                                            csrfToken: any;
                                        }, sender: any, sendResponse: any) {
                                            if (message.csrfToken) {
                                                console.log('Received CSRF Token in content script:', message.csrfToken);
                                                // You can now use the CSRF token in your form or requests
                                            } else {
                                                console.log('No token received');
                                            }
                                        });

                                        submit?.click();
                                        modal?.setAttribute('aria-hidden', 'true');

                                        // while (true) {
                                        //
                                        //     closeBtn = modal?.querySelectorAll("button[aria-label=Dismiss]");
                                        //     if (closeBtn) {
                                        //
                                        //         modal = document.querySelector(".artdeco-modal");
                                        //
                                        //     }
                                        //     else{
                                        //         modal = null;
                                        //     }
                                        //     if (modal == null) break;
                                        // }
                                        await delay(500)


                                        // while(true){}
                                        // setTimeout( ()=>{submit?.click();},5000)
                                        break;

                                    } else {
                                        nextBtn?.click();
                                        await delay(200);
                                    }
                                    if (!modal) {
                                        break;
                                    }
                                }

                                await delay(500)
                                allJobDetails.push(jobDetails);
                            }


                            await delay(200);
                        }
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

async function main(query: string,xpLevel: string[]) {
    let factory: CompositeFactory = new CompositeFactory();
    factory.addFactory(new LinkedInFacade());
// factory.addFactory(new HandshakeFacade());
// factory.addFactory(new IndeedFacade());
// Client Code
    const currentURL = window.location.href;
    const jobBoardFacade = factory.createFacade(currentURL);
    let ind = 0
    if (jobBoardFacade) {
        // jobBoardFacade.modifyPage();
        let jobs: Element[] = await jobBoardFacade.getJobs();
        await jobBoardFacade.parseJobs(jobs);
        // jobs = await jobBoardFacade.getJobs()

        let site = "linkedin"
        if (currentURL.includes("start=25")) await chrome.runtime.sendMessage({
            action: "openJobSite",
            site,
            pageInd: ind + 50,
            query: query,
            xpLevel: xpLevel,
        }); else if (!currentURL.includes("start=50")) await chrome.runtime.sendMessage({
            action: "openJobSite",
            site,
            pageInd: ind + 25,
            query: query,
            xpLevel: xpLevel
        });



    }

}

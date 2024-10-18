// content.js
// import OpenAI from "openai";
// const openai = new OpenAI();
//
// const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//         { role: "system", content: "You are a helpful assistant." },
//         {
//             role: "user",
//             content: "Write a haiku about recursion in programming.",
//         },
//     ],
// });
// console.log(completion.choices[0].message.content);
import dotenv from 'dotenv';
console.log("Content script loaded!");
const apiKey = process.env.OPENAI_API_KEY; // Access the API key from
dotenv.config();
async function GPTParser(json) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o", // Ensure this model is available to your API key
            messages: [
                { role: "You are an experienced resume writer who helps clients create tailored, " +
                        "impactful resumes. You consider the target job's description, industry norms, " +
                        "and the client's work experience and background to produce ATS-optimized resumes.", content: "write a haiku about ai" },
            ],
        }),
    });

    if (!response.ok) {
        const errorResponse = await response.json(); // Capture the error response
        console.error("Error:", response.statusText, errorResponse);
        return; // Exit early if there's an error
    }

    const data = await response.json();

    console.log(data.choices[0]); // Print the first choice from the response
    return data.choices[0]
}

// Call the function and handle the response
GPTParser().then(r => {
    // console.log(r)
    if (r) {
        // console.log(r); // Print the entire response object
        console.log(r.message.content); // Print the entire response object
    } else {
        console.log("No response received.");
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("message: "+request.action)
    if (request.action === "runContentScript") {
        console.log("Content script activated!");
        handlePage(); // Call your parsing function or any other actions
    } else {
        console.log("Unknown action:", request.action)
    }
});
// console.log("Content script loaded");

// Function to perform actions based on the current URL
function handlePage() {
    const currentURL = window.location.href;
    let factory;
    if (currentURL.includes("linkedin.com/jobs/search")) {
        factory = new LinkedInFactory(currentURL);
    } else if (currentURL.includes("indeed.com")) {
        factory = new IndeedFactory(currentURL);
        // modifyIndeedPage();
    } else if (currentURL.includes("handshake.com")) {
        factory = new HandshakeFactory(currentURL);
        // modifyHandshakePage();
    }
    factory.getJobsList().then(async (jobs)=>{
        for (const job of jobs) {
            const title = job.querySelector("a");
            if (title) {
                title.click();  // Click the job title to load the details page
                console.log(`Clicked job: ${title.innerText}`);

                // Wait for the page to load before attempting to fetch the company name
                await delay(2000);  // Delay of 2 seconds to ensure the page loads

                const companyNameElement = document.querySelector(".job-details-jobs-unified-top-card__company-name");
                let extraJobInfo = document.querySelector(".job-details-jobs-unified-top-card__job-insight");
                console.log("Salary and extra info "+ extraJobInfo.innerText);
                let jobDetails = document.querySelector("#job-details");
                console.log(jobDetails.innerText);
                let jobMatch = document.querySelector("#how-you-match-card-container");
                let skillsBtn = jobMatch.querySelector(".artdeco-button");
                skillsBtn.click()
                await delay(500);
                let modal = document.querySelector(".artdeco-modal");
                let skills = modal.querySelector(".job-details-skill-match-modal__container");
                let skillsList = skills.getElementsByTagName("li");
                console.log(skillsList);
                for (const skill of skillsList) {
                    console.log(skill.innerText);
                }
                modal.querySelector(".artdeco-modal__dismiss").click()

                if (companyNameElement) {
                    console.log(`Company: ${companyNameElement.innerText}`);
                } else {
                    console.log("Company name not found.");
                }

                // Optionally, add an additional delay before moving to the next job
                // await delay(1000);  // Delay between processing each job
            }
        }
        // factory.parseJobs(jobs);
        // console.log("Found jobs:", jobs);
    }).catch(err=>{
        console.error(err)
        console.log("Error occurred.");
    });
}

// Define the delay function before it's used
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class JobBoardFactory {
    constructor(title) {
        this.title = title
    }

    getJobsList() {
        throw new Error("Method getJobsList(callback) not implemented.")
    }

    parseJobs(jobs) {
        throw new Error("Method parseJobs(jobs) not implemented.")

    }
}

class LinkedInFactory extends JobBoardFactory {
    getJobsList() {
        return new Promise((resolve,reject) => {

            const jobsContainer = document.querySelector(".jobs-search-results-list");

            if (!jobsContainer) {
                console.log("Jobs container not found.");
                reject("No jobs found.");
            }

            const foundJobs = []; // Store found job elements
            const jobIds = new Set(); // Track unique job IDs to avoid duplicates

            const logJobs = () => {
                const jobs = document.querySelectorAll(".scaffold-layout__list-container > li");
                console.log(`Total jobs found: ${jobs.length}`);

                jobs.forEach((job, index) => {
                    // console.log("job html "+job.innerHTML);
                    const jobId = job.id;
                    const footer = job.querySelector(".job-card-list__footer-wrapper");

                    if (jobId && !jobIds.has(jobId) && footer) { // Unique job and valid footer
                        jobIds.add(jobId); // Add job ID to the set
                        const footerText = footer.innerText;

                        // console.log(`Footer: ${footerText}`);

                        // Skip jobs that are already "Applied" or "Viewed" -- can add more l8r
                        if (!footerText.includes("Applied")) {

                            foundJobs.push(job); // Add job to the found jobs list
                        }
                    }
                    // }
                });

                return foundJobs.length; // Return total jobs found
            };
            let prevJobLen = 0;
            // Set interval to scroll and load more jobs
            const scrollInterval = setInterval(() => {
                jobsContainer.scrollBy(0, 400); // Scroll down

                const currentJobCount = logJobs(); // Log jobs on each scroll

                // Stop scrolling when reaching the bottom of the job list
                if (jobsContainer.scrollHeight <= jobsContainer.scrollTop + jobsContainer.clientHeight) {
                    clearInterval(scrollInterval);
                    console.log("Reached the bottom of the job list.");
                    resolve(foundJobs); // Callback with found jobs
                }
                if (currentJobCount == prevJobLen) {
                    clearInterval(scrollInterval);
                    console.log("no new jobs found.");
                    resolve(foundJobs); //
                }
                prevJobLen = currentJobCount;
            }, 1000); // Adjust scroll speed if necessary
        });

    }
}

class IndeedFactory extends JobBoardFactory{

    getJobsList(callback) {
        console.log("Modifying Indeed page...");
        // Example modification: Hide some elements
        const hideElements = document.querySelectorAll('.some-class-to-hide'); // Adjust selector based on actual structure
        hideElements.forEach(el => el.style.display = 'none');

    }
    parseJobs(jobs){}


}
class HandshakeFactory extends JobBoardFactory{

    getJobsList(callback) {
        console.log("Modifying Handshake page...");
        // Example modification: Add a custom message
        const messageDiv = document.createElement('div');
        messageDiv.textContent = "Welcome to the Handshake Job Board!";
        messageDiv.style.fontSize = '20px';
        document.body.prepend(messageDiv);
    }
    parseJobs(jobs){}


}
// // Modify LinkedIn page
// function modifyLinkedInPage() {
// }
//
// // Modify Indeed page
// function modifyIndeedPage() {
// }
//
// // Modify Handshake page
// function modifyHandshakePage() {
//
// }

// Call the handlePage function when the content script loads
// const factory = new JobBoardFactory(window.location.href);
// handlePage();
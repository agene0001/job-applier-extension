import {openJobSite} from "../src/types";

export{}
let accessToken: string | undefined;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_AUTH_TOKEN') {
        getAuthToken().then(token => {
            sendResponse({ token });
        }).catch(error => {
            console.error('Error getting auth token:', error);
            sendResponse({ error: error.message });
        });
        return true; // Required for async response
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'authorizeLinkedIn') {
        openOAuthPopup();
    }
});

function openOAuthPopup() {
    const clientId = '86y4n3pza7cs0g';
    const redirectUri = chrome.identity.getRedirectURL(); // Get the redirect URL from Chrome's identity API
    const state = generateRandomState(); // For security against CSRF
    const scope = 'r_liteprofile r_emailaddress w_member_social'; // Add required scope
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    // Open a new popup window for OAuth authorization
    chrome.identity.launchWebAuthFlow(
        {
            url: authUrl,
            interactive: true
        },
        function(redirectUrl) {
            if (redirectUrl) {
                // Extract the authorization code from the redirect URL
                const urlParams = new URLSearchParams(new URL(redirectUrl).search);
                const authCode = urlParams.get('code');
                const stateParam = urlParams.get('state');

                if (authCode && stateParam === state) {
                    exchangeAuthCodeForToken(authCode); // Call your function to exchange the code
                }
            }
        }
    );
}

function generateRandomState() {
    return Math.random().toString(36).substring(2);
}





function exchangeAuthCodeForToken(authCode: string) {
    const clientId = '86y4n3pza7cs0g';
    const clientSecret = 'WPL_AP1.mSEQ98SZRLU6poyo.hYI+9A==';
    const redirectUri = chrome.identity.getRedirectURL(); // Use the same redirect URL

    const url = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

        },
        body: params.toString()
    })
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                // Store the access token securely
                console.log('Access token:', data.access_token);
                // Optionally, send it back to your content script if necessary
            } else {
                console.error('Failed to obtain access token:', data);
            }
        })
        .catch(error => {
            console.error('Error exchanging code for token:', error);
        });
}

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCSRFToken") {
        chrome.cookies.get({
            url: request.domain,
            name: 'csrftoken'
        }, function(cookie) {
            if (cookie) {
                sendResponse({ token: cookie.value });
            } else {
                sendResponse({ error: 'No CSRF token found' });
            }
        });
        return true; // Important! Keeps the message channel open for async response
    }
});
// background.js (Service Worker)
// chrome.webRequest.onBeforeSendHeaders.addListener(
//     function(details) {
//         if (details.requestHeaders) {
//             // Loop through the request headers to find the CSRF token
//             for (let header of details.requestHeaders) {
//                 if (header.name.toLowerCase() === 'csrf-token') {
//                     console.log('CSRF Token:', header.value);
//                     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//                         if (tabs[0].id) {
//                             chrome.tabs.sendMessage(tabs[0].id, { csrfToken: header.value });
//                         }
//                     });
//                     return; // Exit after finding the CSRF token
//                 }
//             }
//             console.log('CSRF Token not found in this request');
//         }
//     },
//     {
//         urls: ["https://*.linkedin.com/*"], // Modify to match the URL
//     },
//     ["requestHeaders"]
// );


async function getAuthToken(): Promise<string> {
    if (accessToken) {
        return accessToken;
    }

    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true}, (token) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            accessToken = token;
            if(token)
            chrome.storage.sync.set({ accessToken }, () => {
                return resolve(token);
            });

        });

    });
}
chrome.runtime.onMessage.addListener((request:openJobSite, sender, sendResponse) => {
    if (request.action === "openJobSite") {
        const site = request.site;
        const pageInd = request.pageInd;
        const query = request.query;
        const xpLevel = request.xpLevel;
        console.log(request.query);
        let url;

        switch (site) {
            case "linkedin":
                // const query = "Data Scientist";
                const formattedQuery = encodeURIComponent(query);
                url = `https://www.linkedin.com/jobs/search?keywords=${formattedQuery}&f_AL=true&start=${pageInd}`;
                if(xpLevel.length !== 0){
                    const xpFormat = encodeURIComponent(xpLevel.join(","));
                    url += `&f_E=${xpFormat}`;
                }
                break;

            case "indeed":
                url = "https://www.indeed.com"; // Example URL
                break;

            case "handshake":
                url = "https://www.joinhandshake.com"; // Example URL
                break;

            default:
                console.error("Unknown site: " + site);
                return;
        }

        // Create a new tab and send a message to the content script once it's loaded
        chrome.tabs.create({ url, active: true }, function (tab) {
            if (tab && tab.id !== undefined) {
                const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
                    if (tabId === tab.id && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        chrome.tabs.sendMessage(tabId, { action: "runContentScript",query: query,xpLevel: xpLevel });
                    }
                    // else{
                    //     console.error("could not find tab id for tab id: " + tabId);
                    // }
                };
                chrome.tabs.onUpdated.addListener(listener);
            } else {
                console.error("Failed to create a tab or tab ID is undefined.");
            }
        });
    }
});

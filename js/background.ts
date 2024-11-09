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

async function getAuthToken(): Promise<string> {
    if (accessToken) {
        return accessToken;
    }

    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openJobSite") {
        const site = request.site;
        let url;

        switch (site) {
            case "linkedin":
                const query = "Data Scientist";
                const formattedQuery = encodeURIComponent(query);
                url = `https://www.linkedin.com/jobs/search?keywords=${formattedQuery}&f_AL=true`;
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
                        chrome.tabs.sendMessage(tabId, { action: "runContentScript" });
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);
            } else {
                console.error("Failed to create a tab or tab ID is undefined.");
            }
        });
    }
});

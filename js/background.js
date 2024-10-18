// import OpenAI from "/openai";
// const openai = new OpenAI();


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
                // Logic for Indeed (define the URL as needed)
                url = "https://www.indeed.com"; // Example URL
                break;

            case "handshake":
                // Logic for Handshake (define the URL as needed)
                url = "https://www.joinhandshake.com"; // Example URL
                break;

            default:
                console.error("Unknown site: " + site);
                return;
        }

        // Create a new tab and send a message to the content script once it's loaded
        chrome.tabs.create({ url, active: true }, function (tab) {
            if (tab && tab.id !== undefined) {
                // Create a listener for when the tab is updated
                const listener = (tabId, changeInfo) => {
                    if (tabId === tab.id && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        chrome.tabs.sendMessage(tabId, { action: "runContentScript" });
                    }
                };

                // Add the listener to detect tab updates
                chrome.tabs.onUpdated.addListener(listener);
            } else {
                console.error("Failed to create a tab or tab ID is undefined.");
            }
        });
    }
});

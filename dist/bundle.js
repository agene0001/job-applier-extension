/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./js/background.js":
/*!**************************!*\
  !*** ./js/background.js ***!
  \**************************/
/***/ (() => {

eval("// import OpenAI from \"/openai\";\n// const openai = new OpenAI();\n\nchrome.runtime.onMessage.addListener((request, sender, sendResponse) => {\n  if (request.action === \"openJobSite\") {\n    const site = request.site;\n    let url;\n    switch (site) {\n      case \"linkedin\":\n        const query = \"Data Scientist\";\n        const formattedQuery = encodeURIComponent(query);\n        url = `https://www.linkedin.com/jobs/search?keywords=${formattedQuery}&f_AL=true`;\n        break;\n      case \"indeed\":\n        // Logic for Indeed (define the URL as needed)\n        url = \"https://www.indeed.com\"; // Example URL\n        break;\n      case \"handshake\":\n        // Logic for Handshake (define the URL as needed)\n        url = \"https://www.joinhandshake.com\"; // Example URL\n        break;\n      default:\n        console.error(\"Unknown site: \" + site);\n        return;\n    }\n\n    // Create a new tab and send a message to the content script once it's loaded\n    chrome.tabs.create({\n      url,\n      active: true\n    }, function (tab) {\n      if (tab && tab.id !== undefined) {\n        // Create a listener for when the tab is updated\n        const listener = (tabId, changeInfo) => {\n          if (tabId === tab.id && changeInfo.status === 'complete') {\n            chrome.tabs.onUpdated.removeListener(listener);\n            chrome.tabs.sendMessage(tabId, {\n              action: \"runContentScript\"\n            });\n          }\n        };\n\n        // Add the listener to detect tab updates\n        chrome.tabs.onUpdated.addListener(listener);\n      } else {\n        console.error(\"Failed to create a tab or tab ID is undefined.\");\n      }\n    });\n  }\n});\n\n//# sourceURL=webpack://job-applier-extension/./js/background.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./js/background.js"]();
/******/ 	
/******/ })()
;
// src/Popup.js
import React, { useState } from 'react';

function colorchange() {
    const [color, setColor] = useState('blue');

    return (
        <div style={{height:"500px"}}>
            <h1 style={{color:"black"}}>Automatic Job Applier</h1>
            <button onClick={() => setColor('blue')}>Blue</button>
            <button onClick={() => setColor('red')}>Red</button>
            <button onClick={() => setColor('green')}>Green</button>
            <button
                onClick={() => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0] && tabs[0].id) {  // Add this check to prevent 'undefined'

                            chrome.scripting.executeScript({

                                target: {tabId: tabs[0].id},
                                func: (newColor) => {
                                    document.body.style.backgroundColor = newColor;
                                },
                                args: [color],
                            });
                        }
                    });
                }}
            >
                Change Color
            </button>
        </div>
    );
}

export default colorchange;

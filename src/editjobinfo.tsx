import React, { ChangeEvent, useEffect, useState } from 'react';
import Navbar from "./navbar";
import { ResumeData } from "./types";

// Interface for the QA storage data structure
interface QAStorage {
    [key: string]: string;
}

const EditJobInfo = () => {
    // State to hold QA data from storage
    const [QAs, setQAs] = useState<QAStorage | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null); // Track which key is being edited
    const [newValue, setNewValue] = useState<string>("");

    useEffect(() => {
        // Retrieve qaStorage from chrome.local storage
        chrome.storage.local.get("qaStorage", (result: { qaStorage: QAStorage }) => {
            if (result.qaStorage) {
                setQAs(result.qaStorage);
            }
        });
    }, []);

    const handleLabelClick = (key: string, currentValue: string) => {
        setEditingKey(key);
        setNewValue(currentValue);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setNewValue(e.target.value);
    };

    const handleSave = () => {
        if (editingKey && newValue !== "") {
            // Update qaStorage with the new value
            const updatedQA = { ...QAs, [editingKey]: newValue };
            setQAs(updatedQA); // Update local state
            chrome.storage.local.set({ qaStorage: updatedQA }); // Update chrome storage
            setEditingKey(null); // Close the input field
            setNewValue(""); // Clear the input field
        }
    };

    const handleCancel = () => {
        setEditingKey(null); // Close the input field without saving
        setNewValue(""); // Clear the input field
    };

    const handleDelete = (key: string) => {
        if (QAs && key) {
            const updatedQA = { ...QAs };
            delete updatedQA[key]; // Delete the selected key
            setQAs(updatedQA); // Update the local state
            chrome.storage.local.set({ qaStorage: updatedQA }); // Update the chrome storage
        }
    };

    const handleDeleteAll = () => {
        // Clear all QA data
        setQAs(null); // Clear local state
        chrome.storage.local.remove("qaStorage", () => {
            console.log("All QA data deleted from storage.");
        }); // Remove data from Chrome storage
    };

    return (
        <div>
            <div className="main-section">
                {QAs ? (
                    Object.entries(QAs).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: "10px" }}>
                            <label
                                style={{ cursor: "pointer", fontWeight: "bold" }}
                                onClick={() => handleLabelClick(key, value)}
                            >
                                {key}:
                            </label>
                            {editingKey === key ? (
                                <div>
                                    <input
                                        type="text"
                                        value={newValue}
                                        onChange={handleInputChange}
                                        style={{
                                            marginLeft: "10px",
                                            padding: "5px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                        }}
                                    />
                                    <button
                                        onClick={handleSave}
                                        style={{
                                            marginLeft: "10px",
                                            padding: "5px 10px",
                                            backgroundColor: "#28a745",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        style={{
                                            marginLeft: "10px",
                                            padding: "5px 10px",
                                            backgroundColor: "#dc3545",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <span style={{ marginLeft: "10px" }}>{value}</span>
                            )}
                            <button
                                onClick={() => handleDelete(key)}
                                style={{
                                    marginLeft: "10px",
                                    padding: "5px 10px",
                                    backgroundColor: "#ffc107",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p>Loading QA data...</p>
                )}
                <button
                    onClick={handleDeleteAll}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                    }}
                >
                    Delete All
                </button>
            </div>
        </div>
    );
};

export default EditJobInfo;

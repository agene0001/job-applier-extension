import React, { useState } from 'react';
import LZString from "lz-string";

interface UploadDocProps {
    onFileUpload: (files: { fileName: string, fileContent: string }[]) => void;
}

const UploadDoc: React.FC<UploadDocProps> = ({ onFileUpload }) => {
    const [fileNames, setFileNames] = useState<string[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const filePromises = Array.from(files).map(file => readFileAsBase64(file));
            const fileContents = await Promise.all(filePromises);
            const uploadedFiles = Array.from(files).map((file, index) => ({
                fileName: file.name,
                fileContent: LZString.compress(fileContents[index]),
            }));
            setFileNames(uploadedFiles.map(file => file.fileName));
            onFileUpload(uploadedFiles);
        }
    };

    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    resolve(reader.result.toString());
                } else {
                    reject('Failed to read file.');
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    };

    return (
        <div>
            <input type="file" id="fileInput" onChange={handleFileUpload} multiple />
            {fileNames.length > 0 && <p>Uploaded Files: {fileNames.join(', ')}</p>}
        </div>
    );
};

export const loadFileFromChromeStorage = (fileName: string) => {
    chrome.storage.sync.get([fileName], (result) => {
        if (result[fileName]) {
            const fileContent = LZString.decompress(result[fileName]);
            console.log('File retrieved:', fileContent);

            const link = document.createElement('a');
            link.href = fileContent;
            link.download = fileName;
            link.click();
        } else {
            console.log('File not found in storage.');
        }
    });
};

export default UploadDoc;
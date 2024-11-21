import {DriveUploadResponse} from "../src/types";

export class DriveService {
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

        const response = await fetch('https://www.googleapis.com/drive/v3/files?' + queryParams, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        // If folder exists, return its ID
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }

        // Otherwise, create a new folder
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST', headers: {
                'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'
            }, body: JSON.stringify({
                name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : []
            })
        });

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
// Function to fetch a file from a URL and create a File object as .docx
    public static async fetchFileFromUrl(url: string, fileName: string): Promise<File> {
        try {
            let token = await this.getToken()
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${url}?alt=media`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
            }

            const blob = await response.blob();
            // const url1 = URL.createObjectURL(blob);
            //
            // // Create an anchor element
            // const a = document.createElement('a');
            //
            // // Set the download attribute with the desired file name
            // a.href = url1;
            // a.download = "temp.docx";
            //
            // // Programmatically click the anchor to trigger the download
            // a.click();
            //
            // // Release the URL object after the download starts
            // URL.revokeObjectURL(url1);
            // Double-check the MIME type for debugging purposes
            const mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            console.log(`Fetched file type: ${blob.type}, expected: ${mimeType}`);

            return new File([blob], fileName, { type: mimeType });
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    }
    public static async uploadFile(blob: Blob, filename: string, folderId: string): Promise<DriveUploadResponse> {
        const token = await this.getToken();

        const metadata = {
            name: filename,
            parents: [folderId],
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        formData.append('file', blob);
        // const url = URL.createObjectURL(blob);
        //
        // // Create an anchor element
        // const a = document.createElement('a');
        //
        // // Set the download attribute with the desired file name
        // a.href = url;
        // a.download = "temp.docx";
        //
        // // Programmatically click the anchor to trigger the download
        // a.click();

        // Release the URL object after the download starts
        // URL.revokeObjectURL(url);
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
            method: 'POST', headers: {
                'Authorization': `Bearer ${token}`
            }, body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    }
}
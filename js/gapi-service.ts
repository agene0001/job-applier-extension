export class GoogleAPIService {
    private static instance: GoogleAPIService;
    private initialized: boolean = false;

    private constructor() {}

    public static getInstance(): GoogleAPIService {
        if (!GoogleAPIService.instance) {
            GoogleAPIService.instance = new GoogleAPIService();
        }
        return GoogleAPIService.instance;
    }

    public async authenticate(): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    reject(`Authentication failed: ${chrome.runtime.lastError?.message}`);
                    return;
                }
                console.log('Authentication successful, token:', token);
                resolve(token);
            });
        });
    }

    public async getToken(): Promise<string> {
        try {
            return await this.authenticate();
        } catch (error) {
            throw new Error(`Failed to get token: ${error}`);
        }
    }
}

// Usage example
const googleAPI = GoogleAPIService.getInstance();

async function initializeAndAuthenticate() {
    try {
        const token = await googleAPI.authenticate();
        console.log('Authentication successful, token:', token);
        return token;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

declare var gapi: {
    load: (api: string, callback: () => void) => void;
    auth2: {
        init: (params: {
            client_id: string;
            scope: string;
        }) => Promise<any>;
        getAuthInstance: () => {
            signIn: () => Promise<{
                getAuthResponse: () => {
                    access_token: string;
                }
            }>;
        };
    };
    client: {
        load: (name: string, version: string, callback?: () => void) => void | Promise<void>;
        init: (params: { apiKey: string; clientId: string; discoveryDocs: string[]; scope: string }) => Promise<void>;
        drive?: any; // Basic declaration for Drive API
        people?: any; // Basic declaration for People API
        request<T>(params: {
            path: string;
            method?: string;
            params?: { [key: string]: any };
            headers?: { [key: string]: string };
            body?: any;
        }): Promise<T>;

        // Additional sub-clients, if any
        [key: string]: any;
    };
};

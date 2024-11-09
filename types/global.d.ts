// global.d.ts
declare global {
    interface Window {
        loadPyodide: () => Promise<any>;
        gapi:any;
    }
}

export {};

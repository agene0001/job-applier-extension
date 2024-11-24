// Question-answer storage
export class questionSaver {
    private qaStorage: { [key: string]: string } = {}; // In-memory cache of QA pairs

    constructor() {
        this.loadFromStorage(); // Load data from Chrome storage on initialization
    }

    // Function to normalize a question
    private normalizeQuestion(question: string) {
        return question
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(" ")
            .filter((word) => !["the", "a", "is", "of", "with", "do", "you", "have"].includes(word)) // Remove stopwords
            .join(" ");
    }

    // Function to save a question-answer pair
    public async saveQuestionAnswer(question: string, answer: string) {
        const normalizedKey = this.normalizeQuestion(question);
        this.qaStorage[normalizedKey] = answer;
        console.log(`Saved: [${normalizedKey}] -> ${answer}`);
        await this.saveToStorage(); // Persist data to Chrome storage
    }

    // Function to find an answer for a new question
    public async findAnswer(question: string) {
        const normalizedKey = this.normalizeQuestion(question);
        const keys = Object.keys(this.qaStorage);

        // Use a simple similarity check (or replace with Fuse.js for advanced matching)
        let bestMatch: string | null = null;
        let bestScore = 0;
        keys.forEach((key) => {
            const score = this.calculateSimilarity(normalizedKey, key); // Custom function
            if (score > bestScore) {
                bestScore = score;
                bestMatch = key;
            }
        });

        if (bestMatch && bestScore > 0.7) {
            return this.qaStorage[bestMatch];
        }

        return null;
    }

    // Simple similarity score function (replace with advanced algorithm as needed)
    private calculateSimilarity(str1: string, str2: string) {
        const set1 = new Set(str1.split(" "));
        const set2 = new Set(str2.split(" "));
        const intersection = [...set1].filter((word) => set2.has(word));
        return intersection.length / Math.max(set1.size, set2.size);
    }

    // Load data from Chrome storage
    private loadFromStorage() {
        chrome.storage.local.get("qaStorage", (result: { qaStorage: { [key: string]: string; }; }) => {
            if (result.qaStorage) {
                this.qaStorage = result.qaStorage;
                console.log("Loaded from storage:", this.qaStorage);
            }
        });
    }

    // Save data to Chrome storage
    private async saveToStorage() {
        return new Promise<void>((resolve) => {
            chrome.storage.local.set({qaStorage: this.qaStorage}, () => {
                console.log("Saved to storage:", this.qaStorage);
                resolve();
            });
        });
    }
}
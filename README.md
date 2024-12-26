

# 🚀 Career Clicker - An automatic job applier 

**Version 1.0**

🌟 Effortlessly apply to jobs with just a few clicks! This Chrome extension is designed to automate job applications on popular job boards, starting with **LinkedIn**. Future support for Indeed and Handshake is on the roadmap.

---

## 🌟 Features

- **Automated Job Search:** Easily search and apply for jobs on LinkedIn using custom queries and experience levels.
- **OAuth Integration:** Securely authenticate and connect with LinkedIn using OAuth 2.0.
- **CSRF Token Handling:** Seamlessly handles CSRF tokens for enhanced security.
- **Custom Profiles:** Save and manage multiple resume profiles for tailored applications.

---

## 🛠️ How It Works

1. **Authenticate with LinkedIn:**  
   Log in to LinkedIn via a secure popup to allow the extension to manage job applications.

2. **Search for Jobs:**  
   Input a job query and specify experience levels. The extension will open LinkedIn's job search page tailored to your preferences.

3. **Apply:**  
   Select saved profiles and let the extension assist in pre-filling job applications (LinkedIn support is complete; more platforms coming soon).

---

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/job-applier-extension/automatic-job-applier.git
   ```
2. Navigate to the project directory:
   ```bash
   cd automatic-job-applier
   ```
3. **Install Dependencies**:
    - Run `npm install` in the root directory to install all required packages.

4. **Build the Project**:
    - Run `npm run build` to compile the source code into the `dist` folder.

5. Load the extension into Chrome:
    - Open `chrome://extensions/`.
    - Enable **Developer mode**.
    - Click **Load unpacked** and select the project folder.

---

## 🛡️ Permissions

This extension requests the following permissions:

- **Storage:** To save user profiles and application preferences.
- **Tabs & Active Tab:** To navigate and manipulate job board sites.
- **Identity:** For OAuth authentication with LinkedIn.
- **Cookies:** To manage CSRF tokens.

---

## 🔍 Roadmap

✅ **LinkedIn Integration**  
⏳ **Indeed Support**  
⏳ **Handshake Integration**  
⏳ **Resume Template Uploads**

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

---

## 🛠️ Technology Stack

- **React.js:** Frontend for the popup and profile management.
- **TypeScript:** Ensuring type safety in the codebase.
- **Chrome Extensions API:** For background tasks, content scripts, and storage.
- **OAuth 2.0:** For secure authentication with LinkedIn.

---

## 🎨 Screenshots

Coming soon!

---

Start applying to your dream jobs today! 🚀

---

Feel free to modify the placeholder fields (`your-repo-name`, screenshots section, etc.) as needed.
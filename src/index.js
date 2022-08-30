import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAX7f0vZOEykcy_k29bR2mOQzdECZGbhMs",
    authDomain: "vmafweb.firebaseapp.com",
    projectId: "vmafweb",
    storageBucket: "vmafweb.appspot.com",
    messagingSenderId: "230522819943",
    appId: "1:230522819943:web:3639156345480612d8cbc2",
    measurementId: "G-EL45E9VNRT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

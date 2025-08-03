import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: " ",
  authDomain: "realtime-feedback-board.firebaseapp.com",
  projectId: "realtime-feedback-board",
  storageBucket: " ",
  messagingSenderId: " ",
  appId: " "
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// Elements
const form = document.getElementById("feedbackForm");
const feedbackList = document.getElementById("feedbackList");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userInfo = document.getElementById("userInfo");

// Auth State
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (user) {
    userInfo.innerHTML = `<p>Signed in as <strong>${user.displayName}</strong></p>`;
    signInBtn.style.display = "none";
    signOutBtn.style.display = "inline-block";
    form.style.display = "block";
  } else {
    userInfo.innerHTML = "<p>Not signed in</p>";
    signInBtn.style.display = "inline-block";
    signOutBtn.style.display = "none";
    form.style.display = "none";
  }

  // Reload feedbacks when auth state changes
  loadFeedbacks();
});

// Sign in
signInBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch((err) => {
    alert("Sign-in failed: " + err.message);
  });
});

// Sign out
signOutBtn.addEventListener("click", () => {
  signOut(auth);
});

// Add feedback
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!currentUser) {
    alert("You must be signed in.");
    return;
  }

  if (name && message) {
    try {
      await addDoc(collection(db, "feedbacks"), {
        name,
        message,
        uid: currentUser.uid,
        email: currentUser.email,
        timestamp: serverTimestamp()
      });
      form.reset();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
});

// Load Feedbacks
function loadFeedbacks() {
  const q = query(collection(db, "feedbacks"), orderBy("timestamp", "desc"));

  onSnapshot(q, (snapshot) => {
    feedbackList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const feedback = docSnap.data();
      const div = document.createElement("div");
      div.className = "feedback";
      div.innerHTML = `
        <strong>${feedback.name}</strong>
        <p>${feedback.message}</p>
      `;

      if (currentUser && feedback.uid === currentUser.uid) {
        const btn = document.createElement("button");
        btn.textContent = "Delete";
        btn.className = "delete-btn";
        btn.onclick = () => deleteDoc(doc(db, "feedbacks", docSnap.id));
        div.appendChild(btn);
      }

      feedbackList.appendChild(div);
    });
  });
}

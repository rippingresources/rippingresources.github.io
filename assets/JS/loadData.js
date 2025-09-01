import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA0wO3s4xKCiyTF_cFjSEZGFvFuG4Ofa0o",
    authDomain: "flplibraryvotes.firebaseapp.com",
    projectId: "flplibraryvotes",
    storageBucket: "flplibraryvotes.firebasestorage.app",
    messagingSenderId: "257498428001",
    appId: "1:257498428001:web:bd66606c9210359e1ff020"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
await signInAnonymously(auth);

let flpData = [];

// Load CSV data
async function loadData() {
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2LKv2QcODF4I3v6H7EJ5PYBzmtF8Vt_oa6iCLTUzb9iDF3jIF8W3fJzqgBXAvlz1DYOD22TlCbMDL/pub?output=csv";
    const res = await fetch(url);
    const csv = await res.text();
    flpData = Papa.parse(csv, { header: true }).data;
    displayData(flpData);
}

// Display cards
function displayData(data) {
    const container = document.getElementById("flp-list");
    container.innerHTML = "";
    data.forEach((row, idx) => {
        if (!row.Title) return;

        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
        <h2>${row.Title}</h2>
        <p>Creator: ${row.Creator}</p>
        <p>DAW version: ${row['DAW version']}</p>
        <p>Plugins: ${row.Plugins}</p>
        <p>Notes: ${row.notes || ""}</p>
        <a href="${row.Link}" target="_blank">Download</a>

        <div class="rating" data-field="accuracy">
        <span>Accuracy:</span>
        ${[1,2,3,4,5].map(n => `<img src="/assets/Images/Fire.svg" class="fire" data-value="${n}">`).join('')}
        <span class="avg-score accuracy-score">0</span>
        </div>

        <div class="rating" data-field="easeOfUse">
        <span>Ease of Use:</span>
        ${[1,2,3,4,5].map(n => `<img src="/assets/Images/Fire.svg" class="fire" data-value="${n}">`).join('')}
        <span class="avg-score ease-score">0</span>
        </div>

        <p>Combined: <span class="avg-score combined-score">0</span></p>
        `;
        container.appendChild(div);

        attachRatingHandlers(div, `flp-${idx}`);
    });
}

// Attach rating logic with persisted votes
async function attachRatingHandlers(cardEl, projectId) {
    const ratingDivs = cardEl.querySelectorAll('.rating');
    const accuracySpan = cardEl.querySelector('.accuracy-score');
    const easeSpan = cardEl.querySelector('.ease-score');
    const combinedSpan = cardEl.querySelector('.combined-score');

    // Get user's previous votes for this project
    const userRef = doc(db, 'ratings', projectId, 'userRatings', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    let userVotes = {};
    if (userSnap.exists()) userVotes = userSnap.data();

    ratingDivs.forEach(ratingDiv => {
        const fires = ratingDiv.querySelectorAll('.fire');
        const field = ratingDiv.dataset.field;
        let currentValue = userVotes[field] || 0;

        // Highlight initial vote
        fires.forEach((f, idx) => f.classList.toggle('highlight', idx < currentValue));

        function updateHighlight(upTo) {
            fires.forEach((f, idx) => f.classList.toggle('highlight', idx < upTo));
        }

        fires.forEach((fire, idx) => {
            fire.addEventListener('mouseenter', () => updateHighlight(idx + 1));
            fire.addEventListener('click', async () => {
                currentValue = idx + 1;
                updateHighlight(currentValue);
                await setDoc(userRef, { [field]: currentValue }, { merge: true });
            });
            fire.addEventListener('mouseleave', () => updateHighlight(currentValue));
        });
    });

    // Update averages
    onSnapshot(collection(db, 'ratings', projectId, 'userRatings'), snap => {
        let sumAccuracy = 0, sumEase = 0, countAccuracy = 0, countEase = 0;
        snap.docs.forEach(d => {
            const data = d.data();
            if (data.accuracy != null) { sumAccuracy += data.accuracy; countAccuracy++; }
            if (data.easeOfUse != null) { sumEase += data.easeOfUse; countEase++; }
        });
        const avgAccuracy = countAccuracy ? sumAccuracy / countAccuracy : 0;
        const avgEase = countEase ? sumEase / countEase : 0;
        const combined = (avgAccuracy + avgEase) / ((countAccuracy && countEase) ? 2 : 1);

        accuracySpan.textContent = avgAccuracy.toFixed(1);
        easeSpan.textContent = avgEase.toFixed(1);
        combinedSpan.textContent = combined.toFixed(1);
    });
}

// Search
document.getElementById("searchBox").addEventListener("input", () => {
    const query = document.getElementById("searchBox").value.toLowerCase();
    const filtered = flpData.filter(row =>
    (row.Title && row.Title.toLowerCase().includes(query)) ||
    (row.Creator && row.Creator.toLowerCase().includes(query)) ||
    (row.Plugins && row.Plugins.toLowerCase().includes(query))
    );
    displayData(filtered);
});

loadData();

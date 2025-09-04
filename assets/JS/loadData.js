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
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2LKv2QcODF4I3v6H7EJ5PYBzmtF8Vt_oa6iCLTUzb9iDF3jIF8W3fJzqgBXAvlz1DYOD22TlCbMDL/pub?output=csv&gid=1604710042";
    const res = await fetch(url);
    const csv = await res.text();
    flpData = Papa.parse(csv, { header: true }).data;
    displayData(flpData);
}

// Got lazy... lol
// stolen from https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url/43467144#43467144
function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function makeCard(row) {
    var html = "";

    html += `<h2 title="${row.Title || "Untitled"}">${row.Title || "Untitled"}</h2>\n`
    html += `<p title="${row.Creator || "Unknown"}">Creator: ${row.Creator || "Unknown"}</p>\n`
    html += `<p>DAW: ${row['DAW version'] || "Unknown"}</p>\n`
    html += `<p title="${row.Plugins || "None"}">Plugins: ${row.Plugins || "None"}</p>\n`

    if (row.notes.length !== 0) {
        html += `<p>Notes:</p>\n<textarea disabled class="notes">${row.notes || ""}</textarea>\n`
    }

    //Check Download Link
    if (isValidHttpUrl(row.Link)) {
        html += `<a href="${row.Link}" target="_blank" class="download">Download</a>\n`
    } else {
        html += `<a target="_blank" class="download unavailable">Download</a>\n`
    }

    //Rating's system
    html += `
    <div class="rating-container">

    <div class="rating" data-field="accuracy">
    <span>Accuracy:</span>
    <div class="fire-container">
    ${[1,2,3,4,5].map(n => `<img src="/assets/Images/Fire.svg" class="fire" data-value="${n}">`).join('')}
    <span class="avg-score accuracy-score">0.0</span>
    </div>
    </div>

    <div class="rating" data-field="easeOfUse">
    <span>Ease of Use:</span>
    <div class="fire-container">
    ${[1,2,3,4,5].map(n => `<img src="/assets/Images/Fire.svg" class="fire" data-value="${n}">`).join('')}
    <span class="avg-score ease-score">0.0</span>
    </div>
    </div>

    <!-- Im being lazy... Remind me to make proper classes for these -->
    <p style ="margin-top: 10px; margin-bottom: 0;">Combined: <span style="float: right;" class="avg-score combined-score">0.0</span></p>
    </div>
    `


    return html;
}

// Display cards
function displayData(data) {
    const container = document.getElementById("flp-list");
    container.innerHTML = "";
    data.forEach((row, idx) => {
        if (!row.Title) return;

        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = makeCard(row);
        container.appendChild(div);

        attachRatingHandlers(div, `flp-${row.Id}`);
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
        const fires = ratingDiv.querySelectorAll('.fire-container')[0].querySelectorAll('.fire');
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

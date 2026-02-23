/* --- DHWANI SUTRA: FULL JAVASCRIPT --- */

// --- GLOBAL STATE ---
let audio = new Audio();
let playlist = [];
let queue = [];
let history = []; 
let likedSongs = [];
let myPlaylists = {"My Favorites": []}; 
let currentIdx = 0;
let isShuffle = false;
let isAutoplay = true;

// --- INITIALIZATION ---
window.onload = async () => { 
    injectModernDhwaniStyles(); 
    await syncState(); 
    loadHome(); 
    setupEventListeners(); 
};

function injectModernDhwaniStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- CHATGPT STYLE FIX FOR AI CHAT & RECS --- */
        #chat-tab.active, #rec-tab.active {
            display: flex !important;
            flex-direction: column;
            height: calc(100vh - 135px);
            padding-bottom: 0;
            overflow: hidden;
        }

        #chat-box {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            border: 1px solid #282828;
            background: rgba(18, 18, 18, 0.8) !important;
            border-radius: 12px;
            margin-bottom: 10px;
            scrollbar-width: thin;
        }

        #rec-list {
            flex: 1;
            overflow-y: auto;
            scrollbar-width: thin;
            padding-right: 10px;
        }

        #rec-tab .tab-search-box, 
        #chat-tab .tab-search-box {
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent !important;
            padding: 10px 0 15px 0;
            width: 100%;
            flex-shrink: 0;
        }

        #rec-tab .tab-search-box input,
        #chat-tab .tab-search-box input {
            background: #fff !important;
            color: #000 !important;
            border: none !important;
            border-radius: 500px 0 0 500px !important;
            padding: 14px 25px !important;
            width: 450px;
            font-size: 14px;
            font-weight: 500;
            outline: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        #rec-tab .tab-search-box button,
        #chat-tab .tab-search-box button {
            background: #1DB954 !important;
            color: white !important;
            border: none !important;
            border-radius: 0 500px 500px 0 !important;
            padding: 14px 35px !important;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        #rec-tab .tab-search-box button:hover,
        #chat-tab .tab-search-box button:hover {
            background: #1ed760 !important;
            transform: translateY(-2px);
        }

        /* --- RICH RECOMMENDATION ROWS --- */
        .rich-row {
            display: flex;
            align-items: center;
            padding: 10px 15px;
            background: #181818;
            border-radius: 8px;
            margin-bottom: 10px;
            transition: background 0.2s;
            gap: 15px;
            border: 1px solid transparent;
        }
        .rich-row:hover {
            background: #282828;
            border-color: #333;
        }
        .rich-row img {
            width: 50px;
            height: 50px;
            border-radius: 4px;
            object-fit: cover;
        }
        .rich-row .row-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .rich-row .row-title {
            font-size: 15px;
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .rich-row .row-artist {
            font-size: 13px;
            color: #b3b3b3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 4px;
        }
        .rich-row .fa-play-circle {
            font-size: 28px;
            color: #1DB954;
            opacity: 0;
            transition: opacity 0.2s, transform 0.2s;
        }
        .rich-row:hover .fa-play-circle {
            opacity: 1;
            transform: scale(1.1);
        }

        /* CURSOR FIXES */
        .now-playing, .track-info, #main-heart, .fa-ellipsis-h, 
        .autoplay-toggle, .buttons i, .play-trigger, .nav-item, 
        .card img, .song-row, .context-menu div, .rich-row, .card {
            cursor: pointer !important;
        }
    `;
    document.head.appendChild(style);
}

async function syncState() {
    try {
        const res = await fetch('/api/user_state');
        const data = await res.json();
        history = data.history || [];
        likedSongs = data.liked || [];
        myPlaylists = data.playlists || {"My Favorites": []};
        if (data.last_song) {
            playlist = [data.last_song];
            currentIdx = 0;
            audio.src = `/proxy-audio?yt_id=${data.last_song.youtube_id}`;
            audio.currentTime = data.last_time || 0;
            document.getElementById('p-title').innerText = data.last_song.name;
            document.getElementById('p-artist').innerText = data.last_song.primaryArtists;
            document.getElementById('p-img').src = data.last_song.image[2].url;
            document.getElementById('p-img').style.display = 'block';
            updateHeartUI();
        }
    } catch (e) { console.error("Sync Connection Failed."); }
}

async function saveState() {
    const currentTrack = playlist[currentIdx];
    if (!currentTrack) return;
    await fetch('/api/user_state', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            history: history, liked: likedSongs,
            playlists: myPlaylists, 
            last_song: currentTrack, last_time: audio.currentTime
        })
    });
}

function setupEventListeners() {
    const inputMap = {'homeSearch': handleHomeSearch, 'chatInput': handleChat, 'recInput': handleRec};
    Object.keys(inputMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') inputMap[id](); });
    });
    window.onclick = (e) => {
        const menu = document.getElementById('more-menu');
        if (menu && !e.target.closest('.more-container')) menu.style.display = 'none';
    };
}

/* --- DYNAMIC HOME DISCOVERY ENGINE (OPTIMIZED FOR SPEED) --- */
async function loadHome() {
    const grid = document.getElementById('home-grid');
    const currentTrack = playlist[currentIdx];
    grid.innerHTML = "<div style='padding:20px; color:#1DB954;'><i class='fa fa-spinner fa-spin'></i> Loading Dhwani Sutra...</div>";

    let vibeKey = ""; 
    if (currentTrack) {
        const meta = (currentTrack.name + " " + currentTrack.primaryArtists).toLowerCase();
        if (meta.match(/arijit|jubin|neha|badshah|shreya|t-series|vishal|shekhar/)) vibeKey = "Bollywood ";
        else if (meta.match(/bts|blackpink|twice|stray kids|newjeans/)) vibeKey = "K-Pop ";
        else if (meta.match(/sidhu|diljit|karan|ap dhillon/)) vibeKey = "Punjabi ";
        else if (meta.match(/anirudh|ar rahman|sid sriram/)) vibeKey = "South Indian Movie ";
        else if (meta.match(/bad bunny|j balvin|karol g/)) vibeKey = "Latin ";
        else vibeKey = "Global English ";
        vibeKey += currentTrack.primaryArtists + " ";
    }

    const fetchTasks = [];

    // Queue 'More of what you love' if playing
    if (currentTrack && audio.src) {
        fetchTasks.push(
            fetch(`/api/search?q=${encodeURIComponent(vibeKey + "latest collection")}`)
            .then(res => res.json())
            .then(data => data.length ? `<div class="genre-section"><h2 class="genre-title">More of what you love</h2><div class="horizontal-scroll">${renderGridToString(data)}</div></div>` : "")
        );
    }

    // Queue all Genre requests to run CONCURRENTLY
    const genreSets = [
        { label: "Feel Good", query: `${vibeKey}upbeat happy party dance` },
        { label: "Action", query: `${vibeKey}high energy gym intense workout` },
        { label: "Romance", query: `${vibeKey}romantic love soul slow hits` },
        { label: "Lo-Fi", query: `${vibeKey}chill study aesthetic lofi beats` }
    ];

    genreSets.forEach(g => {
        fetchTasks.push(
            fetch(`/api/search?q=${encodeURIComponent(g.query)}`)
            .then(res => res.json())
            .then(data => data.length ? `<div class="genre-section"><h2 class="genre-title">${g.label}</h2><div class="horizontal-scroll">${renderGridToString(data)}</div></div>` : "")
        );
    });

    // Wait for all fetches to finish at the same time (Massive speed boost)
    const results = await Promise.all(fetchTasks);
    grid.innerHTML = results.join('');
}

function renderGridToString(songs) {
    return songs.map((s) => {
        const data = btoa(unescape(encodeURIComponent(JSON.stringify(s)))); 
        // FIXED: Click anywhere on the card plays the song
        return `<div class="card" onclick="playExternalTrack('${data}')"><img src="${s.image[2].url}"><div class="title">${s.name}</div><div class="artist">${s.primaryArtists}</div></div>`;
    }).join('');
}

function playExternalTrack(encodedData) {
    const track = JSON.parse(decodeURIComponent(escape(atob(encodedData))));
    playlist.splice(currentIdx + 1, 0, track);
    playTrack(currentIdx + 1);
}

/* --- CORE PLAYER ENGINE --- */
function playTrack(idx, fromQueue = false) {
    let track;
    if (fromQueue) {
        track = queue[idx];
        playlist.splice(currentIdx + 1, 0, track);
        queue.splice(idx, 1);
        renderQueue();
        currentIdx++;
    } else {
        track = playlist[idx];
        currentIdx = idx;
    }
    if (!track) return;
    
    audio.src = `/proxy-audio?yt_id=${track.youtube_id}`;
    audio.play();
    document.getElementById('play-icon').className = 'fa fa-pause';
    document.getElementById('p-title').innerText = track.name;
    document.getElementById('p-artist').innerText = track.primaryArtists;
    document.getElementById('p-img').src = track.image[2].url;
    document.getElementById('p-img').style.display = 'block';

    addToHistory(track);
    updateHeartUI();
    if (isAutoplay && !fromQueue) fetchAutoplayQueue(track);
}

/* --- PERSISTENT HISTORY --- */
function addToHistory(track) {
    history = history.filter(s => s.youtube_id !== track.youtube_id);
    history.unshift(track);
    if (history.length > 100) history.pop(); 
    saveState();
}

async function deleteFromHistory(yt_id) {
    await fetch('/api/delete_history', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ yt_id }) });
    history = history.filter(s => s.youtube_id !== yt_id);
    renderHistory();
}

function renderHistory() {
    const grid = document.getElementById('history-grid');
    if (!grid) return;
    grid.innerHTML = history.length ? history.map(s => {
        const data = btoa(unescape(encodeURIComponent(JSON.stringify(s))));
        // FIXED: Click anywhere on card to play. Added stopPropagation to delete button.
        return `<div class="card" onclick="playExternalTrack('${data}')"><div class="history-del-btn" onclick="event.stopPropagation(); deleteFromHistory('${s.youtube_id}')">×</div><img src="${s.image[2].url}"><div class="title">${s.name}</div><div class="artist">${s.primaryArtists}</div></div>`;
    }).join('') : "<p style='padding:20px;'>No listening history found.</p>";
}

/* --- QUEUE & NAVIGATION --- */
function nextTrack() {
    if (isShuffle && playlist.length > 0) {
        playTrack(Math.floor(Math.random() * playlist.length));
    }
    else if (queue.length > 0) playTrack(0, true);
    else if (currentIdx < playlist.length - 1) playTrack(currentIdx + 1);
    else playTrack(0);
}

function prevTrack() {
    if (currentIdx > 0) playTrack(currentIdx - 1);
    else playTrack(playlist.length - 1);
}

async function fetchAutoplayQueue(track) {
    const res = await fetch('/stream-ai', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ prompt: `"${track.name}" by ${track.primaryArtists}`, is_autoplay: true })
    });
    const text = await res.text();
    const suggestions = text.split('\n').filter(l => l.trim().length > 3 && l.includes('-'));
    queue = [];
    for (let s of suggestions.slice(0, 10)) {
        const search = await fetch(`/api/search?q=${encodeURIComponent(s + " official audio")}`);
        const data = await search.json();
        if (data.length) queue.push(data[0]);
    }
    renderQueue();
}

function renderQueue() {
    const qList = document.getElementById('queue-list');
    if (!qList) return;
    qList.innerHTML = queue.length ? queue.map((s, i) => `
        <div class="q-item" onclick="playTrack(${i}, true)">
            <img src="${s.image[2].url}">
            <div class="q-info"><span>${s.name}</span><small>${s.primaryArtists}</small></div>
            <i class="fa fa-bars"></i>
        </div>`).join('') : "<div style='padding:20px; text-align:center;'>Predicting next tracks...</div>";
}

/* --- UI ACTIONS --- */
function toggleAutoplay() {
    isAutoplay = !isAutoplay;
    const label = document.getElementById('autoplay-label');
    const icon = document.getElementById('autoplay-icon');
    if (label && icon) {
        label.innerText = isAutoplay ? "AUTO ON" : "AUTO OFF";
        label.style.color = isAutoplay ? "#1DB954" : "#b3b3b3";
        icon.className = isAutoplay ? "fa fa-toggle-on" : "fa fa-toggle-off";
        icon.style.color = isAutoplay ? "#1DB954" : "#b3b3b3";
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    const btn = document.getElementById('shuffle-btn');
    if (btn) btn.style.color = isShuffle ? '#1DB954' : '#fff';
}

function showTab(id) {
    document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(id + '-tab').classList.add('active');
    document.getElementById('nav-' + id).classList.add('active');
    if (id === 'home') loadHome();
    if (id === 'history') renderHistory();
    if (id === 'fav') renderLikedSongs();
    if (id === 'playlist') renderPlaylists();
}

function togglePlay() {
    if(audio.paused) { audio.play(); document.getElementById('play-icon').className = 'fa fa-pause'; }
    else { audio.pause(); document.getElementById('play-icon').className = 'fa fa-play'; }
}

function toggleQueue() { document.getElementById('queue-panel').classList.toggle('active'); }
function toggleMoreMenu(e) { e.stopPropagation(); const m = document.getElementById('more-menu'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; }

function updateHeartUI() {
    const track = playlist[currentIdx];
    const heart = document.getElementById('main-heart');
    if (!heart) return;
    const isLiked = track && likedSongs.some(s => s.youtube_id === track.youtube_id);
    heart.className = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";
    heart.style.color = isLiked ? "#ff4d4d" : "#b3b3b3";
}

function toggleLikeCurrent() {
    const track = playlist[currentIdx];
    if (!track) return;
    const idx = likedSongs.findIndex(s => s.youtube_id === track.youtube_id);
    if (idx === -1) likedSongs.push(track);
    else likedSongs.splice(idx, 1);
    updateHeartUI();
    saveState();
}

/* --- PLAYLIST MANAGEMENT --- */
function addToPlaylist() {
    const track = playlist[currentIdx];
    if (!track) {
        alert("Play a song first!");
        return;
    }
    
    let names = Object.keys(myPlaylists);
    let msg = `Existing Playlists:\n- ${names.join("\n- ")}\n\nType the name of an existing playlist, or type a NEW name to create one:`;
    let choice = prompt(msg, "My Favorites");
    
    if (choice) {
        choice = choice.trim();
        if (!myPlaylists[choice]) {
            myPlaylists[choice] = []; 
        }
        
        if (!myPlaylists[choice].some(s => s.youtube_id === track.youtube_id)) {
            myPlaylists[choice].push(track);
            saveState();
            alert(`Added to "${choice}"`);
        } else {
            alert("This song is already in that playlist.");
        }
    }
    document.getElementById('more-menu').style.display = 'none';
}

function deletePlaylist(name) {
    if(confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
        delete myPlaylists[name];
        saveState();
        renderPlaylists();
    }
}

function removeSongFromPlaylist(pName, yt_id) {
    if(confirm(`Remove this song from ${pName}?`)) {
        myPlaylists[pName] = myPlaylists[pName].filter(s => s.youtube_id !== yt_id);
        saveState();
        renderPlaylists();
    }
}

function renderPlaylists() {
    const container = document.getElementById('playlist-container');
    if (!container) return;
    let html = "";
    for (let name in myPlaylists) {
        // FIXED: Added Delete Playlist Option
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 20px 0 10px 0;">
                <h3 style="color:var(--green); margin:0;">${name}</h3>
                <button onclick="deletePlaylist('${name}')" style="background:transparent; color:red; border:none; cursor:pointer; font-weight:bold;"><i class="fa fa-trash"></i> Delete Playlist</button>
            </div>
            <div class="horizontal-scroll">`;
            
        html += myPlaylists[name].map((s, idx) => {
            const data = btoa(unescape(encodeURIComponent(JSON.stringify(s))));
            // FIXED: Click anywhere to play + Remove Song Option inside playlist
            return `
                <div class="card" onclick="playFromPlaylist('${name}', ${idx})">
                    <div class="history-del-btn" onclick="event.stopPropagation(); removeSongFromPlaylist('${name}', '${s.youtube_id}')" title="Remove from playlist">×</div>
                    <img src="${s.image[2].url}">
                    <div class="title">${s.name}</div>
                    <div class="artist">${s.primaryArtists}</div>
                </div>`;
        }).join('') || "<p style='color:#666; padding:10px;'>No songs added yet.</p>";
        html += `</div>`;
    }
    container.innerHTML = html;
}

function playFromPlaylist(name, idx) {
    playlist = [...myPlaylists[name]];
    playTrack(idx);
}

audio.ontimeupdate = () => {
    if(!audio.duration) return;
    document.getElementById('progress').style.width = (audio.currentTime / audio.duration) * 100 + '%';
    document.getElementById('curTime').innerText = formatTime(audio.currentTime);
    document.getElementById('totTime').innerText = formatTime(audio.duration);
    if(audio.currentTime >= audio.duration) nextTrack();
    if(Math.floor(audio.currentTime) % 15 === 0) saveState(); 
};

function formatTime(s) { if(isNaN(s)) return "0:00"; const m = Math.floor(s/60); const sc = Math.floor(s%60); return `${m}:${sc < 10 ? '0' : ''}${sc}`; }
function seek(e) { const rect = e.currentTarget.getBoundingClientRect(); audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration; saveState(); }

/* --- AI & SEARCH (OPTIMIZED RECS LOAD) --- */
async function handleRec() {
    const input = document.getElementById('recInput');
    const list = document.getElementById('rec-list');
    if(!input.value) return;
    
    list.innerHTML = "<div style='padding:20px; color:#1DB954;'><i class='fa fa-spinner fa-spin'></i> Dhwani Sutra is calculating recommendations...</div>";
    
    const res = await fetch('/stream-ai', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({prompt: input.value, is_recommendation: true}) });
    const text = await res.text();
    const lines = text.split('\n').filter(line => line.trim().length > 5 && line.includes('-'));
    
    if (lines.length === 0) { 
        list.innerHTML = "<div style='padding:20px; color:white;'>No matches found. Try another artist!</div>"; 
        return; 
    }

    list.innerHTML = "<div style='padding:20px; color:#1DB954;'><i class='fa fa-spinner fa-spin'></i> Fetching covers...</div>";

    // Concurrently fetch YouTube details for the cover photos
    const promises = lines.map(async (song) => {
        const cleanSong = song.replace(/^\d+\.\s*/, '').replace(/"/g, '').trim();
        try {
            const searchRes = await fetch(`/api/search?q=${encodeURIComponent(cleanSong)}`);
            const data = await searchRes.json();
            if(data.length > 0) return data[0];
        } catch(e) { return null; }
        return null;
    });

    const tracks = await Promise.all(promises);
    const validTracks = tracks.filter(t => t !== null);

    if(validTracks.length === 0) {
        list.innerHTML = "<div style='padding:20px; color:white;'>Failed to load track details.</div>";
        return;
    }

    list.innerHTML = validTracks.map(track => {
        const data = btoa(unescape(encodeURIComponent(JSON.stringify(track))));
        const imgUrl = track.image[2]?.url || track.image[0]?.url || "";
        return `
            <div class="song-row rich-row" onclick="playExternalTrack('${data}')">
                <img src="${imgUrl}" alt="cover">
                <div class="row-info">
                    <div class="row-title">${track.name}</div>
                    <div class="row-artist">${track.primaryArtists}</div>
                </div>
                <i class="fa fa-play-circle"></i>
            </div>`;
    }).join('');
}

async function handleChat() {
    const input = document.getElementById('chatInput');
    const box = document.getElementById('chat-box');
    const prompt = input.value; if(!prompt) return;
    input.value = ""; box.innerHTML += `<div class="bubble user">${prompt}</div>`;
    box.scrollTop = box.scrollHeight;
    const res = await fetch('/stream-ai', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({prompt}) });
    let aiBubble = document.createElement('div'); aiBubble.className = "bubble assistant"; box.appendChild(aiBubble);
    const reader = res.body.getReader(); const decoder = new TextDecoder();
    while(true) {
        const {done, value} = await reader.read(); if(done) break;
        aiBubble.innerText += decoder.decode(value); 
        box.scrollTop = box.scrollHeight;
    }
}

async function quickSearchAndPlay(q) {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if(data.length) { playlist = data; currentIdx = 0; playTrack(0); showTab('home'); }
}

async function handleHomeSearch() {
    const q = document.getElementById('homeSearch').value;
    if(!q) return;
    
    const grid = document.getElementById('home-grid');
    grid.innerHTML = "<div style='padding:20px; color:#1DB954;'><i class='fa fa-spinner fa-spin'></i> Searching...</div>";

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    playlist = data;
    grid.innerHTML = `<div class="genre-section"><h2 class="genre-title">Results for "${q}"</h2><div class="horizontal-scroll">${renderGridToString(data)}</div></div>`;
}

function renderLikedSongs() {
    const grid = document.getElementById('fav-grid');
    if (!likedSongs.length) { grid.innerHTML = "<p style='padding:20px;'>No liked songs yet.</p>"; return; }
    // FIXED: Click anywhere to play
    grid.innerHTML = likedSongs.map((s, idx) => `<div class="card" onclick="playFromFav(${idx})"><img src="${s.image[2].url}"><div class="title">${s.name}</div><div class="artist">${s.primaryArtists}</div></div>`).join('');
}
function playFromFav(idx) { playlist = [...likedSongs]; playTrack(idx); }

async function downloadCurrent() {
    const track = playlist[currentIdx];
    if (!track) return;
    window.open(`/proxy-audio?yt_id=${track.youtube_id}`, '_blank');
}

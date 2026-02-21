# Dhwani Sutra (ध्वని సూత్రం | ध्वनि सूत्र) 🎵
### *A Hybrid ML & Generative AI Music Discovery Engine*

**Dhwani Sutra** (Sanskrit for "The Sound Algorithm") is a full-stack music streaming platform that bridges the gap between mathematical audio analysis and creative cultural intelligence. Unlike standard recommendation engines, it uses a dual-layer logic to provide "Vibe-Locked" discovery.

---

## 🧠 The Architecture: Hybrid Intelligence

Dhwani Sutra operates on a **Dual-Engine Logic** to solve the "Cold Start" problem in music discovery:

### 1. The Sutra (Classical ML Layer)
For tracks within our curated ground-truth dataset (Spotify Top 2018), the engine uses a **K-Nearest Neighbors (KNN)** model. 
- **The Math:** It calculates **Cosine Similarity** across a multi-dimensional feature space (Tempo, Valence, Energy, Danceability, Acousticness).
- **The Result:** Sub-millisecond, mathematically precise matches for classic hits.

### 2. The Dhwani (Generative AI Layer)
For tracks outside the training set (new releases, niche regional indie), the system handshakes with **Llama 3.2 (via Ollama)**.
- **The Intelligence:** Acts as a "Digital Curator," analyzing regional cinema links (Bollywood, Tollywood, Punjabi, etc.), linguistic nuances, and era-specific vibes.
- **The Result:** Seamless cultural continuity that algorithms alone often miss.



---

## ✨ Key Features

- **🚀 Hybrid Discovery:** Automatically switches between KNN Vector Search and LLM Generation based on data availability.
- **💾 IP-Persistent Memory:** Recognizes users by IP to maintain a rolling **100-song history** and resumes playback at the exact millisecond across sessions.
- **🛡️ The "Shorts-Killer" Filter:** Multi-stage validation purging low-quality uploads and teasers, ensuring only full-length official audio.
- **🌍 Dynamic Regional Mapping:** The UI re-calibrates in real-time. Playing a regional artist locks the discovery rows to that specific cultural/linguistic "vibe."
- **⚡ Asynchronous Proxying:** Real-time audio streaming via a Python-based proxy, bypassing local storage constraints.

---

## 🛠️ Tech Stack

- **Backend:** Python (Flask), Scikit-Learn (KNN), Pandas, yt-dlp
- **AI/LLM:** Ollama (Llama 3.2)
- **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Modern Grid & Flexbox)
- **Data:** JSON-DB for IP persistence, Pickle for ML serialization

---

## ⚙️ Installation & Setup

1. **Clone the Repo:**
   ```bash
   git clone [https://github.com/yourusername/dhwani-sutra.git](https://github.com/yourusername/dhwani-sutra.git)
   cd dhwani-sutra
2. **set up environment**
   python -m venv virtu
source virtu/bin/activate  # Windows: .\virtu\Scripts\activate
pip install flask flask-cors pandas scikit-learn yt-dlp requests python-dotenv youtube-search ollama

3.**Train the "Sutra" (ML Model):**
Place your top2018.csv or your own dataset in the root folder and run:
python train_model.py

4.**Launch Ollama:**
Ensure Ollama is running and you have pulled the model:
ollama pull llama3.2

5.**Run the App:**
python app.py

📜 Acknowledgments
Dataset: Spotify Top 2018 Tracks (Kaggle)

Concept: Rooted in Sanskrit philosophy where every sound (Dhwani) follows a mathematical thread (Sutra).

Developed with ❤️ by Chevuri Lokesh

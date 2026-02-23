import pandas as pd
import pickle
import os
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

# The 11 core audio features we need for the KNN Math
FEATURE_COLS = ['danceability', 'energy', 'key', 'loudness', 'mode', 
                'speechiness', 'acousticness', 'instrumentalness', 
                'liveness', 'valence', 'tempo']

def train_universal_model():
    all_data = []
    csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]
    
    print(f"🔍 Found {len(csv_files)} CSV files in the folder. Scanning...\n")
    
    for file in csv_files:
        try:
            df = pd.read_csv(file, low_memory=False)
        except Exception as e:
            print(f"❌ Error reading {file}: {e}")
            continue
            
        # --- 1. THE UNIVERSAL DICTIONARY ---
        # Forces all column names to lowercase to avoid case-sensitivity issues
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        # Maps weird column names from the internet to our standard format
        col_mapping = {
            'track': 'name', 'track_name': 'name', 'song name': 'name', 'title': 'name',
            'artist': 'artists', 'artist_name': 'artists', 'artist_0': 'artists', 'performer': 'artists',
            'bpm': 'tempo', 'beats_per_minute': 'tempo', 'volts': 'energy'
        }
        df = df.rename(columns=col_mapping)
        
        # --- 2. DATA VALIDATION ---
        if 'name' not in df.columns or 'artists' not in df.columns:
            print(f"⚠️ Skipping '{file}': Cannot find Song Name or Artist columns.")
            continue
            
        # Check how many of the 11 features are present
        available_features = [col for col in FEATURE_COLS if col in df.columns]
        
        # If the file has NO audio features (like the 2023 albums dataset), we MUST skip it
        if len(available_features) < 4: 
            print(f"⚠️ Skipping '{file}': Missing core audio features. The AI needs these numbers to calculate 'vibes'.")
            continue
        
        # --- 3. DATA CLEANING & AUTO-FIXING ---
        # If a file is just missing 1 or 2 features, fill them safely
        for col in FEATURE_COLS:
            if col not in df.columns:
                print(f"   ↳ 🛠️ Auto-fixing missing '{col}' in {file}")
                # Default mode/key to 0, tempo to 120, others to neutral 0.5
                if col in ['mode', 'key']: df[col] = 0
                elif col in ['loudness']: df[col] = -6.0
                elif col in ['tempo']: df[col] = 120.0
                else: df[col] = 0.5 
        
        # Force features to be numeric (removes corrupted text data)
        for col in FEATURE_COLS:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Drop rows with no name/artist, fill NaN numbers with 0
        df = df.dropna(subset=['name', 'artists'])
        df[FEATURE_COLS] = df[FEATURE_COLS].fillna(0)
        
        # Keep only what Dhwani Sutra needs
        final_cols = ['name', 'artists'] + FEATURE_COLS
        all_data.append(df[final_cols])
        print(f"✅ Successfully extracted {len(df)} songs from '{file}'")

    if not all_data:
        print("\n❌ CRITICAL ERROR: No datasets with valid audio features found.")
        return

    # --- 4. MERGE & TRAIN ---
    print("\n🧬 Merging all datasets into the Master Brain...")
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Drop exact duplicates (same song, same artist) to keep the app fast
    initial_count = len(combined_df)
    combined_df['name_lower'] = combined_df['name'].astype(str).str.lower()
    combined_df['artist_lower'] = combined_df['artists'].astype(str).str.lower()
    combined_df = combined_df.drop_duplicates(subset=['name_lower', 'artist_lower']).drop(columns=['name_lower', 'artist_lower'])
    
    print(f"🧹 Removed {initial_count - len(combined_df)} duplicate tracks.")

    print("🧠 Training the K-Nearest Neighbors AI...")
    X = combined_df[FEATURE_COLS]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Algorithm set to 'brute' for best performance with massive datasets
    model = NearestNeighbors(n_neighbors=11, metric='cosine', algorithm='brute')
    model.fit(X_scaled)

    # --- 5. EXPORT ---
    print("💾 Saving the Master Model (music_model.pkl, scaler.pkl, music_data.pkl)...")
    with open('music_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    combined_df.to_pickle('music_data.pkl')

    print(f"\n✨ COMPLETE! Dhwani Sutra now has a brain with {len(combined_df)} unique tracks.")

if __name__ == "__main__":
    train_universal_model()

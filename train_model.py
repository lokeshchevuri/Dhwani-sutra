import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import pickle
import os

# 1. Load your dataset
FILE_NAME = 'top2018.csv'

if not os.path.exists(FILE_NAME):
    print(f"Error: {FILE_NAME} not found!")
else:
    df = pd.read_csv(FILE_NAME)
    print(f"Dataset loaded: {len(df)} songs found.")

    # 2. Select numerical features from your top2018.csv
    features = [
        'danceability', 'energy', 'key', 'loudness', 'mode', 
        'speechiness', 'acousticness', 'instrumentalness', 
        'liveness', 'valence', 'tempo'
    ]

    # 3. Scale the features
    scaler = StandardScaler()
    X = scaler.fit_transform(df[features])

    # 4. Train KNN (Cosine Similarity is best for "vibes")
    # We set n_neighbors=11 because the first result is always the song itself
    model = NearestNeighbors(n_neighbors=11, metric='cosine')
    model.fit(X)

    # 5. Save the components to the current folder
    with open('music_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    
    # Save a processed version of the dataframe for quick lookups in Flask
    # We include 'artists' and 'name' to show in the UI
    df[['name', 'artists'] + features].to_pickle('music_data.pkl')

    print("✅ Success! 'music_model.pkl', 'scaler.pkl', and 'music_data.pkl' are ready.")
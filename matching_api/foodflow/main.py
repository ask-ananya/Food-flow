import os
import sys
from fastapi import FastAPI
from fastapi import Query
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import openrouteservice
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "matching")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "knn")))

from matching import matching_alg
from knn import knn_sort

foodflow = FastAPI(title="Foodflow", version="1.0.0")

# Firestore credentials
cred = credentials.Certificate("foodflow/foodflowcertificate.json")
firebase_admin.initialize_app(cred)

# Firestore DB
db = firestore.client()

@foodflow.get("/{individual_id}")
def index(individual_id: str):
    docs = db.collection('users').stream()

    # Distance Client
    distanceClient = openrouteservice.Client(key='5b3ce3597851110001cf624832fdc07e4faf477fa76a70c083547c65')

    public_recipients = {doc.id for doc in db.collection("publicRecipients").stream()}
    public_donors = {doc.id for doc in db.collection("publicDonors").stream()}

    # Convert Firebase documents to a DataFrame
    data = []
    for doc in docs:
        doc_dict = doc.to_dict()
        doc_dict['id'] = doc.id
        # Replace None values with default placeholders
        cleaned_dict = {k: (v if v is not None else "N/A") for k, v in doc_dict.items()}
        data.append(cleaned_dict)

    df = pd.DataFrame(data)

    # Replace NaN and infinite values in DataFrame
    df.replace([np.nan, pd.NA, float("inf"), float("-inf")], None, inplace=True)

    # Filter recipients and donors based on their presence in public collections
    rec_df = df[(df["userType"] == "Recipient") & (df["id"].isin(public_recipients))]
    indiv_df = df[df["userType"] == "Individual"]
    donor_df = df[(df["userType"] == "Donor") & (df["id"].isin(public_donors))]

    # Run matching algorithm
    best_array = matching_alg(rec_df, donor_df, distanceClient)

    # Ensure `best_array` does not contain NaN or invalid values before passing to KNN
    if not best_array:
        return {"error": "No valid donor-recipient matches found"}

    result = knn_sort(best_array, indiv_df, individual_id, 3)

    # Ensure output is JSON-safe
    return result
#matching.py
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

from supabase import create_client, Client
import pandas as pd
import openrouteservice
import numpy as np
import logging
logging.basicConfig(level=logging.DEBUG)

from pairing.pairing import pairing_alg
from knn.knn import knn_pred

matching = Flask(__name__)

CORS(matching)

SUPABASE_URL = "https://pxuhseuevmelbdcvzrph.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dWhzZXVldm1lbGJkY3Z6cnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzMzNzUsImV4cCI6MjA1NjUwOTM3NX0.XwXYzHDkICmfVB-baNjlnJrP9_atnKaD8LgY6zdaFxk"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@matching.route("/health", methods=['GET'])
def health_check():
    return {"status": "healthy"}, 200

@matching.route("/<individual_id>", methods=['GET'])
def index(individual_id: str):
    try:
        logging.debug("Starting request for individual_id: %s", individual_id)
        response = supabase.table('users').select("*").execute()
        docs = response.data

        # Distance Client
        distanceClient = openrouteservice.Client(key='5b3ce3597851110001cf624832fdc07e4faf477fa76a70c083547c65')

        # Fix: Use dictionary access instead of dot notation
        public_recipients = {doc['id'] for doc in docs if doc['user_type'] == "recipient" and doc['public']}
        public_donors = {doc['id'] for doc in docs if doc['user_type'] == "donor" and doc['public']}

        # Convert Supabase documents to a DataFrame
        data = []
        for doc in docs:
            # Remove to_dict() since doc is already a dictionary
            doc_dict = doc
            doc_dict['id'] = doc['id']
            # Replace None values with default placeholders
            cleaned_dict = {k: (v if v is not None else "N/A") for k, v in doc_dict.items()}
            data.append(cleaned_dict)

        df = pd.DataFrame(data)

        # Replace NaN and infinite values in DataFrame
        df.replace([np.nan, pd.NA, float("inf"), float("-inf")], None, inplace=True)

        # Filter recipients and donors based on their presence in public collections
        rec_df = df[(df["user_type"] == "recipient") & (df["id"].isin(public_recipients))]
        indiv_df = df[df["user_type"] == "individual"]
        donor_df = df[(df["user_type"] == "donor") & (df["id"].isin(public_donors))]

        # Run matching algorithm
        best_array = pairing_alg(rec_df, donor_df, distanceClient)

        # Ensure `best_array` does not contain NaN or invalid values before passing to KNN
        if not best_array:
            return jsonify({"error": "No valid donor-recipient matches found"}), 404

        # Get the result from knn_pred
        result = knn_pred(best_array, indiv_df, individual_id, rec_df, donor_df, 3)
        
        return jsonify(result)
    
    except Exception as e:
        logging.error("Error occurred: %s", str(e), exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    matching.run(debug=True,host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
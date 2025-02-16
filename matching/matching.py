#matching.py
import os
import sys
from flask import Flask, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import openrouteservice
import numpy as np
import logging
logging.basicConfig(level=logging.DEBUG)

from pairing.pairing import pairing_alg
from knn.knn import knn_pred

matching = Flask(__name__)

# Firestore credentials
cred = credentials.Certificate("foodflowcertificate.json")
firebase_admin.initialize_app(cred)

# Firestore DB
db = firestore.client()

@matching.route("/health", methods=['GET'])
def health_check():
    return {"status": "healthy"}, 200

@matching.route("/<individual_id>", methods=['GET'])
def index(individual_id: str):
    try:
        logging.debug("Starting request for individual_id: %s", individual_id)
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
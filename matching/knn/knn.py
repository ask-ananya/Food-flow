from collections import Counter
from sklearn.neighbors import KNeighborsClassifier
import numpy as np

def extract_features(data_dict):
    """
    Extract features from a dictionary.
    :param data_dict: Dictionary containing data.
    :return: List of features.
    """
    features = []
    for key, value in data_dict.items():
        if isinstance(value, (int, float)):
            features.append(value)
        elif isinstance(value, str):
            features.append(hash(value) % 1000)
        elif isinstance(value, bool):
            features.append(1 if value else 0)
    return features

def knn_pred(best_array, indiv_df, individual_id, rec_df, donor_df, k = 3):
    """
    Predicts the likelihood of acceptance for recipient-donor pairs based on past decisions.
    
    Args:
        best_array: List of [recipient, donor] pairs to be ranked
        indiv_df: DataFrame containing user decisions
        individual_id: ID of the user whose preferences we're predicting
        k: Number of neighbors for KNN
        rec_df: DataFrame containing recipient information
        donor_df: DataFrame containing donor information
        
    Returns:
        List of (recipient_id, donor_id) pairs sorted by acceptance probability
    """
    # Filter decisions for the target individual
    user_decisions = indiv_df[
        (indiv_df["user_type"] == "individual") & 
        (indiv_df["decisions"].notna())
    ]

    if len(user_decisions) == 0:
        return [(pair[0]["id"], pair[1]["id"]) for pair in best_array]

    # Extract valid decisions and their features
    training_features = []
    training_labels = []
    
    for _, row in user_decisions.iterrows():
        decisions = row["decisions"]
        if not isinstance(decisions, list):
            continue
            
        for decision in decisions:
            if not isinstance(decision, dict) or decision.get("id") != individual_id:
                continue
                
            # Get recipient and donor details from their IDs
            recipient_id = decision.get("recipient")
            donor_id = decision.get("donor")
            
            if recipient_id is None or donor_id is None:
                continue
                
            recipient = rec_df[rec_df["id"] == recipient_id].iloc[0].to_dict() if len(rec_df[rec_df["id"] == recipient_id]) > 0 else None
            donor = donor_df[donor_df["id"] == donor_id].iloc[0].to_dict() if len(donor_df[donor_df["id"] == donor_id]) > 0 else None
            
            if recipient is None or donor is None:
                continue
                
            # Extract features from both recipient and donor
            recipient_features = extract_features(recipient)
            donor_features = extract_features(donor)
            combined_features = recipient_features + donor_features
            
            training_features.append(combined_features)
            training_labels.append(1 if decision.get("decision", False) else 0)

    if len(training_features) == 0:
        return [(pair[0]["id"], pair[1]["id"]) for pair in best_array]

    # Train KNN model
    knn = KNeighborsClassifier(n_neighbors=min(k, len(training_features)))
    knn.fit(training_features, training_labels)

    # Extract features for each pair in best_array
    test_features = []
    for recipient, donor in best_array:
        recipient_features = extract_features(recipient)
        donor_features = extract_features(donor)
        combined_features = recipient_features + donor_features
        test_features.append(combined_features)

    # Get acceptance probabilities
    probabilities = knn.predict_proba(test_features)[:, 1]

    # Sort pairs by probability and return sorted (recipient_id, donor_id) pairs
    sorted_pairs = sorted(zip(probabilities, best_array), reverse=True)
    return [(pair[0]["id"], pair[1]["id"]) for _, pair in sorted_pairs]
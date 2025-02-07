from collections import Counter
from sklearn.neighbors import KNeighborsClassifier
import numpy as np

def knn_sort(best_array, indiv_df, individual_id, k):
    """
    Predicts the likelihood of acceptance for each item in best_array based on past decisions.
    :param individual_id: The unique ID of the individual.
    :param k: Number of nearest neighbors for KNN.
    :return: Sorted best_array based on probability of acceptance.
    """
    # Filter decisions for the given individual
    decisions = indiv_df[indiv_df["userType"] == "Individual"]

    # Filter out NaN values and ensure we're only looking at valid decision arrays
    decisions = decisions[decisions["decisions"].notna()]

    if len(decisions) == 0:
        return best_array  # No past data to predict, return as is

    # Extract decisions that match our individual_id
    valid_decisions = []
    for _, row in decisions.iterrows():
        decision_list = row["decisions"]
        if isinstance(decision_list, list):
            for decision in decision_list:
                if isinstance(decision, dict) and decision.get("donorId") == individual_id:
                    valid_decisions.append(decision)

    if not valid_decisions:
        return best_array  # No relevant decisions found

    # Extracting features and labels
    features = []
    labels = []
    for decision in valid_decisions:
        if "recipientId" in decision and "decision" in decision:
            # Using hash of recipientId as a feature
            features.append([hash(decision["recipientId"]) % 1000])
            labels.append(1 if decision["decision"] else 0)

    if not features:
        return best_array  # No valid features found

    # Train KNN model
    knn = KNeighborsClassifier(n_neighbors=min(k, len(features)))
    knn.fit(features, labels)

    # Predict probabilities for best_array
    best_features = [[hash(item[1]["id"]) % 1000] for item in best_array]  # Using recipient ID from best_array
    probabilities = knn.predict_proba(best_features)[:, 1]  # Probability of acceptance

    # Sort best_array based on acceptance probability
    sorted_best_array = [x for _, x in sorted(zip(probabilities, best_array), reverse=True)]

    return sorted_best_array
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';

export default function DetailsPage({ route, navigation }) {
  const {
    recipientName,
    recipientImage,
    recipientId,
    donorName,
    donorImage,
    donorId,
  } = route.params;

  const [recipientDetails, setRecipientDetails] = useState(null);
  const [donorDetails, setDonorDetails] = useState(null);

  useEffect(() => {
    fetchRecipientDetails();
    fetchDonorDetails();
  }, []);

  const fetchRecipientDetails = async () => {
    try {
      const recipientRef = doc(FIREBASE_DB, 'users', recipientId);
      const recipientDoc = await getDoc(recipientRef);
      if (recipientDoc.exists()) {
        setRecipientDetails(recipientDoc.data().recipientDetails);
      } else {
        console.error('Recipient not found.');
      }
    } catch (error) {
      console.error('Error fetching recipient details:', error);
    }
  };

  const fetchDonorDetails = async () => {
    try {
      // Use donorId (the actual document ID) instead of donorName
      const donorRef = doc(FIREBASE_DB, 'users', donorId);
      const donorDoc = await getDoc(donorRef);
      if (donorDoc.exists()) {
        setDonorDetails(donorDoc.data().donorDetails);
      } else {
        console.error('Donor not found.');
      }
    } catch (error) {
      console.error('Error fetching donor details:', error);
    }
  };

  // Function to update the decision in the current user's document.
  // decisionValue is a boolean: true for accept, false for decline.
  const updateDecision = async (decisionValue) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('User not logged in');
        return;
      }
      const currentUserId = currentUser.uid;

      const userRef = doc(FIREBASE_DB, 'users', currentUserId);
      // Save as an object instead of an array to avoid nested arrays.
      await updateDoc(userRef, {
        decisions: arrayUnion({
          recipientId,
          donorId, // donor's document id
          decision: decisionValue,
        }),
      });
      navigation.navigate('MainPage');
    } catch (error) {
      console.error('Error updating decision:', error);
      Alert.alert('Error', 'There was an error submitting your decision.');
    }
  };

  const handleAccept = () => {
    updateDecision(true);
  };

  const handleDecline = () => {
    updateDecision(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('MainPage')}
        >
          <Ionicons name="arrow-back" size={24} color="#303F9F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        {/* This empty view ensures the header is centered */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Recipient Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECIPIENT</Text>
          <Text style={styles.organizationName}>{recipientName}</Text>
          
          <View style={styles.imageCard}>
            <Image source={{ uri: recipientImage }} style={styles.image} />
          </View>

          {recipientDetails && (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>
                  {recipientDetails?.location ? (
                    `${recipientDetails.location.street}\n${recipientDetails.location.city}, ${recipientDetails.location.state} ${recipientDetails.location.zipCode}`
                  ) : (
                    'No address available'
                  )}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capacity</Text>
                <Text style={styles.detailValue}>
                  {recipientDetails.capacity || 'Not specified'} lbs
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Donor Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DONOR</Text>
          <Text style={styles.organizationName}>{donorName}</Text>
          
          <View style={styles.imageCard}>
            <Image source={{ uri: donorImage }} style={styles.image} />
          </View>

          {donorDetails && (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food Types Available</Text>
                <View style={styles.foodTypesList}>
                  {Object.entries(donorDetails.food_types || {}).map(
                    ([type, value]) =>
                      value && (
                        <Text key={type} style={styles.foodTypeItem}>
                          {type
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())}
                        </Text>
                      )
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>
                  {donorDetails.lastUpdated
                    ? new Date(donorDetails.lastUpdated).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Decision Buttons */}
        <View style={styles.decisionButtonsContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.returnButton}
          onPress={() => navigation.navigate('MainPage')}
        >
          <Text style={styles.buttonText}>Return to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#303F9F',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#666',
    marginBottom: 8,
  },
  organizationName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  imageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  detailRow: {
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3949AB',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  foodTypesList: {
    marginTop: 4,
  },
  foodTypeItem: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 24,
    paddingVertical: 2,
    fontWeight: '500',
  },
  decisionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  returnButton: {
    backgroundColor: '#303F9F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

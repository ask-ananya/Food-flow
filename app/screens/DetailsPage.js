import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';

export default function DetailsPage({ route, navigation }) {
    const { name, image, donationCenterId } = route.params;
    const [donationNeeds, setDonationNeeds] = useState([]);
    const [response, setResponse] = useState(null); // To track accept/decline response
    useEffect(() => {
        fetchDonationNeeds();
    }, []);

    const fetchDonationNeeds = async () => {
        try {
            const centerRef = doc(FIREBASE_DB, 'donationCenters', donationCenterId);
            const centerDoc = await getDoc(centerRef);
            if (centerDoc.exists()) {
                setDonationNeeds(centerDoc.data().needs || []);
            } else {
                console.error('Donation center not found.');
            }
        } catch (error) {
            console.error('Error fetching donation needs:', error);
        }
    };

    const handleResponse = async (decision) => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userResponse = {
            userId: currentUser.uid,
            donationCenterId,
            response: decision,
            timestamp: new Date().toISOString(),
        };

        try {
            const responsesRef = doc(FIREBASE_DB, 'responses', `${currentUser.uid}_${donationCenterId}`);
            await updateDoc(responsesRef, userResponse, { merge: true });
            setResponse(decision);
        } catch (error) {
            console.error('Error saving response:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{name}</Text>
            <Image source={{ uri: image }} style={styles.image} />

            <View style={{ marginVertical: 20 }}>
                <Text style={styles.subTitle}>Donation Required:</Text>
                {donationNeeds.length > 0 ? (
                    donationNeeds.map((need, index) => (
                        <Text key={index} style={styles.needItem}>- {need}</Text>
                    ))
                ) : (
                    <Text style={styles.noNeeds}>No specific requirements listed.</Text>
                )}
            </View>

            {response ? (
                <View style={styles.responseContainer}>
                    <Text style={styles.responseText}>
                        {response === 'accept' ? 'Accepted!' : 'Declined!'}
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('MainPage')}
                    >
                        <Text style={styles.buttonText}>Back to MainPage</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleResponse('accept')}
                    >
                        <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.declineButton}
                        onPress={() => handleResponse('decline')}
                    >
                        <Text style={styles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 20,
    },
    subTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    needItem: {
        fontSize: 16,
        color: '#333',
        marginVertical: 2,
    },
    noNeeds: {
        fontSize: 16,
        color: 'gray',
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
    },
    declineButton: {
        backgroundColor: '#F44336',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    responseContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    responseText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 5,
    },
});

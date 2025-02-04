import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';

export default function DetailsPage({ route, navigation }) {
    const { recipientName, recipientImage, recipientId, donorName, donorImage, donorId } = route.params;

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
                setRecipientDetails(recipientDoc.data().recipientDetails); // Store recipient info
            } else {
                console.error('Recipient not found.');
            }
        } catch (error) {
            console.error('Error fetching recipient details:', error);
        }
    };

    const fetchDonorDetails = async () => {
        try {
            const donorRef = doc(FIREBASE_DB, 'users', donorId);
            const donorDoc = await getDoc(donorRef);
            if (donorDoc.exists()) {
                setDonorDetails(donorDoc.data().donorDetails); // Store donor info
            } else {
                console.error('Donor not found.');
            }
        } catch (error) {
            console.error('Error fetching donor details:', error);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.section}>
                <Text style={styles.title}>Recipient: {recipientName}</Text>
                <Image source={{ uri: recipientImage }} style={styles.image} />
                {recipientDetails && (
                    <View style={styles.infoContainer}>
                        <Text style={styles.subTitle}>Urgency:</Text>
                        <Text style={styles.textItem}>
                            {recipientDetails.isUrgent ? 'Urgent Need' : 'Not Urgent'}
                        </Text>
                        
                        <Text style={styles.subTitle}>Address:</Text>
                        <Text style={styles.textItem}>
                            {recipientDetails.address || 'No address available'}
                        </Text>

                        <Text style={styles.subTitle}>Capacity:</Text>
                        <Text style={styles.textItem}>
                            {recipientDetails.capacity || 'Capacity not specified'} lbs
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.title}>Donor: {donorName}</Text>
                <Image source={{ uri: donorImage }} style={styles.image} />
                {donorDetails && (
                    <View style={styles.infoContainer}>
                        <Text style={styles.subTitle}>Food Types Available:</Text>
                        {Object.entries(donorDetails["food_types"]).map(
                            ([type, value]) =>
                                value && (
                                    <Text key={type} style={styles.textItem}>
                                        {type.replace(/([A-Z])/g, ' $1')}
                                    </Text>
                                )
                        )}

                        <Text style={styles.subTitle}>Last Updated:</Text>
                        <Text style={styles.textItem}>
                            {new Date(donorDetails.lastUpdated).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack(null)}
            >
                <Text style={styles.buttonText}>Return back to Home</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    section: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
    },
    infoContainer: {
        marginTop: 10,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
    },
    textItem: {
        fontSize: 16,
        color: '#333',
        marginTop: 5,
    },
    backButton: {
        backgroundColor: '#2196F3',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 20,
    },
});

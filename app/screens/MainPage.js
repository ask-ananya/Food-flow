import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Checkbox from 'expo-checkbox'; // Install with `expo install expo-checkbox`

export default function MainPage() {
    const [modalVisible, setModalVisible] = useState(false);
    const [donorModalVisible, setDonorModalVisible] = useState(false);
    const [capacity, setCapacity] = useState('');
    const [foodTypes, setFoodTypes] = useState({
        dairyFree: false,
        glutenFree: false,
        halal: false,
        kosher: false,
        vegan: false,
        vegetarian: false,
    });

    useEffect(() => {
        checkUserTypeAndShowPopup();
    }, []);

    const checkUserTypeAndShowPopup = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);

        try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userType = userDoc.data().userType;

                if (userType === 'Recipient') {
                    setModalVisible(true);
                } else if (userType === 'Donor') {
                    setDonorModalVisible(true);
                }
            }
        } catch (error) {
            console.error('Error checking user type:', error);
        }
    };

    const handleSubmitRecipient = async () => {
        if (!capacity) return;

        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);

        try {
            await updateDoc(userRef, {
                'recipientDetails.current_capacity': Number(capacity),
                'recipientDetails.last_updated': new Date().toISOString(),
            });
            console.log('Storage capacity updated successfully');
            setModalVisible(false);
            setCapacity('');
        } catch (error) {
            console.error('Error updating capacity:', error);
        }
    };

    const handleSubmitDonor = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);

        try {
            await updateDoc(userRef, {
                'donorDetails.food_types': foodTypes,
                'donorDetails.last_updated': new Date().toISOString(),
            });
            console.log('Donor food types updated successfully');
            setDonorModalVisible(false);
            setFoodTypes({
                dairyFree: false,
                glutenFree: false,
                halal: false,
                kosher: false,
                vegan: false,
                vegetarian: false,
            });
        } catch (error) {
            console.error('Error updating donor food types:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text>MainPage</Text>

            {/* Recipient Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>
                            How much food storage capacity do you currently have? (in pounds)
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={capacity}
                            onChangeText={setCapacity}
                            keyboardType="numeric"
                            placeholder="Enter capacity"
                        />
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.submitButton]}
                                onPress={handleSubmitRecipient}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Donor Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={donorModalVisible}
                onRequestClose={() => setDonorModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Select the types of food you will donate:</Text>
                        {Object.keys(foodTypes).map((key) => (
                            <View key={key} style={styles.checkboxContainer}>
                                <Checkbox
                                    value={foodTypes[key]}
                                    onValueChange={(newValue) =>
                                        setFoodTypes((prev) => ({ ...prev, [key]: newValue }))
                                    }
                                />
                                <Text style={styles.checkboxLabel}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                            </View>
                        ))}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setDonorModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.submitButton]}
                                onPress={handleSubmitDonor}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 16,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    checkboxLabel: {
        marginLeft: 10,
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 5,
        padding: 10,
        elevation: 2,
        minWidth: 100,
    },
    submitButton: {
        backgroundColor: '#2196F3',
    },
    cancelButton: {
        backgroundColor: '#ff4444',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

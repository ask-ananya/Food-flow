import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';

export default function MainPage() {
    const [modalVisible, setModalVisible] = useState(false);
    const [capacity, setCapacity] = useState('');

    useEffect(() => {
        checkRecipientAndShowPopup();
    }, []);

    const checkRecipientAndShowPopup = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);
        
        try {
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists() && userDoc.data().userType === 'Recipient') {
                setModalVisible(true);
            }
        } catch (error) {
            console.error('Error checking recipient status:', error);
        }
    };

    const handleSubmit = async () => {
        if (!capacity) return;

        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);

        try {
            await updateDoc(userRef, {
                'recipientDetails.current_capacity': Number(capacity),
                'recipientDetails.last_updated': new Date().toISOString()
            });
            console.log('Storage capacity updated successfully');
            setModalVisible(false);
            setCapacity('');
        } catch (error) {
            console.error('Error updating capacity:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text>MainPage</Text>

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
                                onPress={handleSubmit}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
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
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%'
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 16
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    button: {
        borderRadius: 5,
        padding: 10,
        elevation: 2,
        minWidth: 100
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
        textAlign: 'center'
    }
});
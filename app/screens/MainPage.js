import {
    SafeAreaView,
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ScrollView,
    Image,
    Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Install with `expo install expo-linear-gradient`
import { useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Checkbox from 'expo-checkbox'; // Install with `expo install expo-checkbox`
import { Ionicons } from '@expo/vector-icons';

export default function MainPage({ navigation }) {
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
        <View style={{
            backgroundColor: 'white',
            ...styles.container
        }}>
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    // Background Linear Gradient
                    colors={['rgba(255, 255, 255, 1)', 'rgba(80,104,154,1)']}
                    style={styles.background}
                />
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>FoodFlow</Text>
                    <View style={styles.headerIcons}>
                        <Ionicons name="person-circle-outline" size={30} color="black" style={styles.icon} />
                        <Ionicons name="notifications-outline" size={24} color="black" style={styles.icon} />
                    </View>
                </View>

                <View style={{ flex: 1, padding: 16, backgroundColor: "" }}>

                    {/* Input Section */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="gray" />
                        <TextInput
                            style={styles.input}
                            placeholder="Make a donation today..."
                            placeholderTextColor="gray"
                        />
                    </View>

                    {/* Space Between Sections */}
                    <View style={{ flex: 1 }} />

                    {/* Recommendations Section */}
                    <ScrollView contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'flex-end'
                    }}>
                        {/* Metrics Section */}
                        <View style={styles.metricsContainer}>
                            <View style={styles.metricCard}>
                                <Text style={styles.metricNumber}>0</Text>
                                <Text style={styles.metricLabel}>Donation Spots</Text>
                            </View>
                            <View style={[styles.metricCard, styles.primaryMetricCard]}>
                                <Text style={{ ...styles.metricNumber, fontSize: 40 }}>0</Text>
                                <Text
                                    style={{
                                        ...styles.metricLabel,
                                        fontWeight: 'normal',
                                        fontSize: 18,
                                        textAlign: 'center',
                                    }}
                                >
                                    Total Donations
                                </Text>
                            </View>
                            <View style={styles.metricCard}>
                                <Text style={styles.metricNumber}>0</Text>
                                <Text style={styles.metricLabel}>Drivers Nearby</Text>
                            </View>
                        </View>

                        {/* Urgent Need Section */}
                        <View style={styles.urgentContainer}>
                            {/* Card 1 */}
                            <View style={styles.urgentCard}>
                                <View style={styles.urgentLabelContainer}>
                                    <Ionicons name="alert-circle-outline" size={18} color="red" style={styles.icon} />
                                    <Text style={styles.urgentLabel}>Urgent Need</Text>
                                </View>
                                <View style={styles.cardContent}>
                                    <Image
                                        source={{ uri: 'https://tapinto-production.s3.amazonaws.com/uploads/articles/ed/best_crop_ca81afaa67fa1758964a_Edison_Senior_Center.jpg?id=5473061' }}
                                        style={styles.urgentImageLeft}
                                    />
                                    <View style={styles.cardText}>
                                        <Text style={styles.urgentTitle}>Edison Senior Center</Text>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity
                                                style={styles.detailsButton}
                                                onPress={() =>
                                                    navigation.navigate('DetailsPage', {
                                                        name: 'Edison Senior Center',
                                                        image: 'https://tapinto-production.s3.amazonaws.com/uploads/articles/ed/best_crop_ca81afaa67fa1758964a_Edison_Senior_Center.jpg?id=5473061',
                                                        donationCenterId: "sahilghostyboi",
                                                    })
                                                }
                                            >
                                                <Text style={styles.detailsButtonText}>Details...</Text>
                                            </TouchableOpacity>
                                            <Ionicons name="thumbs-up-outline" size={24} color="gray" />
                                            <Ionicons name="thumbs-down-outline" size={24} color="gray" />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Card 2 */}
                            <View style={styles.urgentCard}>
                                <View style={styles.cardContent}>
                                    <Image
                                        source={{ uri: 'https://www.dprplaymore.org/ImageRepository/Document?documentID=511' }}
                                        style={styles.urgentImageLeft}
                                    />
                                    <View style={styles.cardText}>
                                        <Text style={styles.urgentTitle}>Johnson Center</Text>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity
                                                style={styles.detailsButton}
                                                onPress={() =>
                                                    navigation.navigate('DetailsPage', {
                                                        name: 'Johnson Center',
                                                        image: 'https://www.dprplaymore.org/ImageRepository/Document?documentID=511',
                                                        donationCenterId: "sahilghostyboi",
                                                    })
                                                }
                                            >
                                                <Text style={styles.detailsButtonText}>Details...</Text>
                                            </TouchableOpacity>
                                            <Ionicons name="thumbs-up-outline" size={24} color="gray" />
                                            <Ionicons name="thumbs-down-outline" size={24} color="gray" />
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* View More Recommendations Button */}
                            <TouchableOpacity style={styles.recommendationsButton}>
                                <Text style={styles.recommendationsButtonText}>
                                    View 5 more recommendations...
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

                {/* Bottom Navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="home-outline" size={24} color="black" />
                        <Text style={styles.navLabel}>Explore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="time-outline" size={24} color="black" />
                        <Text style={styles.navLabel}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="settings-outline" size={24} color="black" />
                        <Text style={styles.navLabel}>Settings</Text>
                    </TouchableOpacity>
                </View>

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
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%'
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginVertical: 30,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        width: '90%',
        height: '8%',
        alignSelf: 'center',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        paddingVertical: 10,
    },
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginVertical: 10,
        marginBottom: 30,
        flexWrap: "wrap",
        alignItems: "flex-end"
    },
    metricCard: {
        alignItems: 'center',
        backgroundColor: 'rgb(78, 126, 171)',
        padding: 5,
        borderRadius: 10,
        flex: "auto"
    },
    primaryMetricCard: {
        backgroundColor: 'rgb(91, 151, 206)',
        fontSize: 18,
        fontWeight: "bold"
    },
    metricNumber: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'white'
    },
    metricLabel: {
        fontSize: 14,
        color: 'white',
    },
    urgentContainer: {
        flex: 1,
        marginHorizontal: 15,
    },
    urgentLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginLeft: -15,
    },
    urgentLabel: {
        color: 'red',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    urgentImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    urgentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    detailsButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    detailsButtonText: {
        color: 'white',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    navItem: {
        alignItems: 'center',
        // marginBottom: 20,
    },
    navLabel: {
        fontSize: 12,
        color: 'gray',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height
    },
    urgentCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginVertical: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        flexDirection: 'col',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    urgentImageLeft: {
        width: 160,
        height: 80,
        flex: "auto",
        borderRadius: 10,
        marginRight: 10,
    },
    cardText: {
        flex: 1,
        justifyContent: 'center',
    },
    recommendationsButton: {
        backgroundColor: '#4A4A8A',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 10,
        marginTop: 20,
    },
    recommendationsButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    metricBackground: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'red',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
});

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
    Dimensions,
    ActivityIndicator
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import React, {useEffect, useState} from 'react';
import {FIREBASE_AUTH} from '../../FirebaseConfig';
import {doc, collection, getDoc, getDocs, updateDoc, setDoc, deleteDoc} from 'firebase/firestore';
import {FIREBASE_DB} from '../../FirebaseConfig';
import Checkbox from 'expo-checkbox';
import {Ionicons} from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

export default function MainPage({navigation}) {
    const [isPublicDonor, setIsPublicDonor] = useState(false);
    const [donorList, setDonorList] = useState([]);
    const [recipientModalVisible, setRecipientModalVisible] = useState(false);
    const [donorModalVisible, setDonorModalVisible] = useState(false);
    const [capacity, setCapacity] = useState('');
    const [isPublicRecipient, setIsPublicRecipient] = useState(false);
    const [foodTypes, setFoodTypes] = useState({
        dairyFree: false,
        glutenFree: false,
        halal: false,
        kosher: false,
        vegan: false,
        vegetarian: false,
    });

    const [recipientList, setRecipientList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState(null);

    useEffect(() => {
        checkUserTypeAndShowPopup();
        checkIfPublicRecipient();
        checkIfPublicDonor();
        loadMatches();
    }, []);

    const checkIfPublicDonor = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        try {
            const publicDonorRef = doc(FIREBASE_DB, 'publicDonors', currentUser.uid);
            const publicDonorDoc = await getDoc(publicDonorRef);
            setIsPublicDonor(publicDonorDoc.exists());
        } catch (error) {
            console.error('Error checking public donor status:', error);
        }
    };

    const loadPublicDonors = async () => {
        let donorsList = [];
        const querySnapshot = await getDocs(collection(FIREBASE_DB, 'publicDonors'));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            donorsList.push({
                id: doc.id,
                name: data.name,
            });
        });
        setDonorList(donorsList);
        console.log(donorsList);
    };

    const checkIfPublicRecipient = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        try {
            const publicRecipientRef = doc(FIREBASE_DB, 'publicRecipients', currentUser.uid);
            const publicRecipientDoc = await getDoc(publicRecipientRef);
            setIsPublicRecipient(publicRecipientDoc.exists());
        } catch (error) {
            console.error('Error checking public recipient status:', error);
        }
    };

    const loadPublicRecipients = async () => {
        let recipientsList = [];
        const querySnapshot = await getDocs(collection(FIREBASE_DB, 'publicRecipients'));
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            recipientsList.push({
                id: doc.id,
                name: data.name,
            });
        });
        setRecipientList(recipientsList);
        console.log(recipientsList);
    }

    const checkUserTypeAndShowPopup = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) return;

        const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);

        try {
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const usertype = userDoc.data().userType;
                console.log("User type:", usertype)
                setUserType(usertype);

                if (usertype === 'Recipient') {
                    setRecipientModalVisible(true);
                } else if (usertype === 'Donor') {
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
        if (!currentUser) {
            console.error('No authenticated user found');
            return;
        }

        try {
            // First update user details
            const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);
            await updateDoc(userRef, {
                'recipientDetails.current_capacity': Number(capacity),
                'recipientDetails.last_updated': new Date().toISOString(),
            });

            // Then handle public recipient status
            if (isPublicRecipient) {
                const publicRecipientRef = doc(FIREBASE_DB, 'publicRecipients', currentUser.uid);

                // Get current user data
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }

                const userData = userDoc.data();

                // Add to public recipients with all required fields
                await setDoc(publicRecipientRef, {
                    name: userData.recipientDetails.name || 'Unknown Recipient',
                });

                console.log('Successfully added to public recipients');
            } else {
                // Remove from public recipients if exists
                const publicRecipientRef = doc(FIREBASE_DB, 'publicRecipients', currentUser.uid);
                await deleteDoc(publicRecipientRef);
                console.log('Successfully removed from public recipients');
            }

            setRecipientModalVisible(false);
            setCapacity('');
            await loadPublicRecipients(); // Reload the list

        } catch (error) {
            console.error('Detailed error:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            // Show more specific error based on the operation
            if (error.code === 'permission-denied') {
                console.error('Permission denied. Please check if you are properly authenticated.');
            }
        }
    };

    const handleSubmitDonor = async () => {
        const currentUser = FIREBASE_AUTH.currentUser;
        if (!currentUser) {
            console.error('No authenticated user found');
            return;
        }

        try {
            // First update user details
            const userRef = doc(FIREBASE_DB, 'users', currentUser.uid);
            await updateDoc(userRef, {
                'donorDetails.food_types': foodTypes,
                'donorDetails.last_updated': new Date().toISOString(),
            });

            // Then handle public donor status
            if (isPublicDonor) {
                const publicDonorRef = doc(FIREBASE_DB, 'publicDonors', currentUser.uid);

                // Get current user data
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }

                const userData = userDoc.data();
                console.log(userData);

                // Add to public donors with all required fields
                await setDoc(publicDonorRef, {
                    name: userData.donorDetails.name || 'Unknown Donor'
                });

                console.log('Successfully added to public donors');
            } else {
                // Remove from public donors if exists
                const publicDonorRef = doc(FIREBASE_DB, 'publicDonors', currentUser.uid);
                await deleteDoc(publicDonorRef);
                console.log('Successfully removed from public donors');
            }

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
            console.error('Detailed error:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            if (error.code === 'permission-denied') {
                console.error('Permission denied. Please check if you are properly authenticated.');
            }
        }
    };

    const loadMatches = async () => {
        try {
            let recs = [], dons = [];
            const response = await fetch(`https://matching-79369524935.us-east1.run.app/${FIREBASE_AUTH.currentUser?.uid}`);
            const data = await response.json();
            
            for (let i = 0; i < data.length; i++) {
                let recipient = await getDoc(doc(FIREBASE_DB, 'users', data[i][1]));
                let donor = await getDoc(doc(FIREBASE_DB, 'users', data[i][0]));
                
                if (recipient.exists() && donor.exists()) {
                    let r = recipient.data();
                    let d = donor.data();
                    recs.push({id: recipient.id, name: r.recipientDetails.name});
                    dons.push({id: donor.id, name: d.donorDetails.name});
                }
            }
            
            setRecipientList(recs);
            setDonorList(dons);
        } catch (error) {
            console.error('Error loading matches:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderMatchCard = (recipientInfo, donorInfo, index) => {
        return (
            <View key={`match-${index}`} style={styles.urgentCard}>
                <View style={styles.combinedCardContent}>
                    {/* Recipient Section */}
                    <View style={styles.cardHalf}>
                        <Text style={styles.cardSectionTitle}>RECIPIENT</Text>
                        <Text style={styles.cardOrganizationName}>{recipientInfo.name}</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Donor Section */}
                    <View style={styles.cardHalf}>
                        <Text style={styles.cardSectionTitle}>DONOR</Text>
                        <Text style={styles.cardOrganizationName}>{donorInfo.name}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() =>
                        navigation.navigate('DetailsPage', {
                            recipientName: recipientInfo.name,
                            recipientId: recipientInfo.id,
                            donorName: donorInfo.name,
                            donorId: donorInfo.id,
                        })
                    }
                >
                    <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderSingleEntityCard = (entityInfo, index, type) => {
        return (
            <View key={`entity-${index}`} style={styles.urgentCard}>
                <View style={styles.combinedCardContent}>
                    <View style={styles.cardHalf}>
                        <Text style={styles.cardSectionTitle}>{type}</Text>
                        <Text style={styles.cardOrganizationName}>{entityInfo.name}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                        const navigationParams = type === "RECIPIENT" 
                            ? { recipientName: entityInfo.name, recipientId: entityInfo.id }
                            : { donorName: entityInfo.name, donorId: entityInfo.id };
                        
                        navigation.navigate('DetailsPage', navigationParams);
                    }}
                >
                    <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.mainContainer}>
          <LinearGradient
              colors={['#F5F7FF', '#EDF0FF']}
              style={styles.background}
          />
            <SafeAreaView style={styles.container}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>FoodFlow</Text>
                    <View style={styles.headerIcons}>
                        <Ionicons name="person-circle-outline" size={30} color="#303F9F" style={styles.icon}/>
                        <Ionicons name="notifications-outline" size={24} color="#303F9F" style={styles.icon}/>
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Search Input */}
                    <View style={styles.searchInputContainer}>
                        <Ionicons name="location-outline" size={20} color="#666"/>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Make a donation today..."
                            placeholderTextColor="#888"
                        />
                    </View>

                    {/* Content Section */}
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Metrics Section */}
                        <View style={styles.metricsContainer}>
                            <View style={[styles.metricCard, styles.smallMetricCard]}>
                                <LinearGradient
                                    colors={['#E8EAF6', '#C5CAE9']}
                                    style={styles.metricGradient}
                                >
                                    <Text style={styles.metricNumber}>0</Text>
                                    <Text style={styles.metricLabel}>Donation{"\n"}Spots</Text>
                                </LinearGradient>
                            </View>
                            
                            <View style={[styles.metricCard, styles.primaryMetricCard]}>
                                <LinearGradient
                                    colors={['#303F9F', '#3949AB']}
                                    style={styles.metricGradient}
                                >
                                    <Text style={[styles.metricNumber, {color: 'white'}]}>0</Text>
                                    <Text style={[styles.metricLabel, {color: 'white'}]}>Total Donations</Text>
                                </LinearGradient>
                            </View>
                            
                            <View style={[styles.metricCard, styles.smallMetricCard]}>
                                <LinearGradient
                                    colors={['#E8EAF6', '#C5CAE9']}
                                    style={styles.metricGradient}
                                >
                                    <Text style={styles.metricNumber}>0</Text>
                                    <Text style={styles.metricLabel}>Drivers{"\n"}Nearby</Text>
                                </LinearGradient>
                            </View>
                        </View>

                        {/* Matches/Recommendations Section */}
                        <View style={styles.recommendationsSection}>
                            <Text style={styles.sectionTitle}>Recommended Matches</Text>
                            
                            {/* Loading State */}
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <Progress.Circle size={30} indeterminate={true} color="#303F9F" />
                                    <Text style={styles.loadingText}>Looking for matches...</Text>
                                </View>
                            ) : userType === null ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#303F9F" />
                                    <Text style={styles.loadingText}>Loading user data...</Text>
                                </View>
                            ) : (
                                <>
                                    {/* Individual User Match Display */}
                                    {userType === "Individual" ? (
                                        <>
                                            {/* Render match cards */}
                                            {recipientList.length > 0 && donorList.length > 0 ? (
                                                recipientList.slice(0, 2).map((recipient, index) => (
                                                    donorList[index] && renderMatchCard(recipient, donorList[index], index)
                                                ))
                                            ) : (
                                                <Text style={styles.noMatchesText}>No matches found at this time.</Text>
                                            )}
                                            
                                            {/* Show "View More" button if more than 2 recommendations */}
                                            {recipientList.length > 2 && (
                                                <TouchableOpacity style={styles.viewMoreButton}>
                                                    <Text style={styles.viewMoreButtonText}>
                                                        View {recipientList.length - 2} more recommendations
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Donor or Recipient User Display */}
                                            {userType === "Donor" ? (
                                                recipientList.slice(0, 4).map((recipient, index) => (
                                                    renderSingleEntityCard(recipient, index, "RECIPIENT")
                                                ))
                                            ) : (
                                                donorList.slice(0, 4).map((donor, index) => (
                                                    renderSingleEntityCard(donor, index, "DONOR")
                                                ))
                                            )}
                                            
                                            {/* Show "View More" button if needed */}
                                            {(userType === "Donor" && recipientList.length > 4) || 
                                             (userType === "Recipient" && donorList.length > 4) ? (
                                                <TouchableOpacity style={styles.viewMoreButton}>
                                                    <Text style={styles.viewMoreButtonText}>
                                                        View more options
                                                    </Text>
                                                </TouchableOpacity>
                                            ) : null}
                                        </>
                                    )}
                                </>
                            )}
                        </View>
                    </ScrollView>
                </View>

                {/* Bottom Navigation */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('MainPage')}
                    >
                        <Ionicons name="home" size={24} color="#303F9F"/>
                        <Text style={[styles.navLabel, {color: '#303F9F'}]}>Home</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('History')}
                    >
                        <Ionicons name="time-outline" size={24} color="#666"/>
                        <Text style={styles.navLabel}>History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color="#666"/>
                        <Text style={styles.navLabel}>Settings</Text>
                    </TouchableOpacity>
                </View>

                {/* Recipient Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={recipientModalVisible}
                    onRequestClose={() => setRecipientModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Storage Capacity</Text>
                            <Text style={styles.modalSubtitle}>
                                Please enter your current food storage capacity
                            </Text>

                            <View style={styles.modalInputContainer}>
                                <TextInput
                                    style={styles.capacityInput}
                                    value={capacity}
                                    onChangeText={setCapacity}
                                    placeholder="Enter capacity in square feet"
                                    keyboardType="numeric"
                                    placeholderTextColor="#A0AEC0"
                                />
                                <Text style={styles.unitText}>sq. ft.</Text>
                            </View>

                            <View style={styles.checkboxContainer}>
                                <Checkbox
                                    style={styles.checkbox}
                                    value={isPublicRecipient}
                                    onValueChange={setIsPublicRecipient}
                                    color={isPublicRecipient ? '#3949AB' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>
                                    Make my organization visible to donors
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmitRecipient}
                            >
                                <Text style={styles.submitButtonText}>Update Capacity</Text>
                            </TouchableOpacity>
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
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalTitle}>Food Types Available</Text>
                            <Text style={styles.modalSubtitle}>
                                Please select the types of food you have available today
                            </Text>

                            <View style={styles.foodTypesContainer}>
                                {Object.entries(foodTypes).map(([key, value]) => (
                                    <View key={key} style={styles.checkboxContainer}>
                                        <Checkbox
                                            style={styles.checkbox}
                                            value={value}
                                            onValueChange={(newValue) =>
                                                setFoodTypes(prev => ({
                                                    ...prev,
                                                    [key]: newValue
                                                }))
                                            }
                                            color={value ? '#3949AB' : undefined}
                                        />
                                        <Text style={styles.checkboxLabel}>
                                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.checkboxContainer}>
                                <Checkbox
                                    style={styles.checkbox}
                                    value={isPublicDonor}
                                    onValueChange={setIsPublicDonor}
                                    color={isPublicDonor ? '#3949AB' : undefined}
                                />
                                <Text style={styles.checkboxLabel}>
                                    Make my organization visible to recipients
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={handleSubmitDonor}
                            >
                                <Text style={styles.submitButtonText}>Update Food Types</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white', // Changed from rgba with transparency
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#303F9F',
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 15,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginVertical: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#2d3748',
        height: 40,
        paddingVertical: 0,
        selectionColor: '#3949AB',
    },
    scrollContent: {
        paddingBottom: 80,
    },
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        gap: 12,
        marginTop: 20,
    },
    metricCard: {
        borderRadius: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.15,
        shadowRadius: 12,
        overflow: 'hidden',
    },
    metricGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    smallMetricCard: {
        width: 90,
        height: 90,
    },
    primaryMetricCard: {
        width: 120,
        height: 120,
        elevation: 8,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    metricNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#303F9F',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
        color: '#303F9F',
        textAlign: 'center',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#303F9F',
        marginBottom: 16,
        marginLeft: 4,
    },
    recommendationsSection: {
        marginTop: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    noMatchesText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginVertical: 24,
    },
    urgentCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    combinedCardContent: {
        flexDirection: 'row',
        borderRadius: 15,
        overflow: 'hidden',
    },
    cardHalf: {
        flex: 1,
        padding: 16,
    },
    cardDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 16,
    },
    cardSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        color: '#666',
        marginBottom: 8,
    },
    cardOrganizationName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
        lineHeight: 24,
    },
    detailsButton: {
        backgroundColor: '#3949AB',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 16,
        alignSelf: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    detailsButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    viewMoreButton: {
        backgroundColor: '#4A4A8A',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 8,
    },
    viewMoreButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 8,
        // Add these properties to extend to bottom
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    navLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
        width: '90%',
        maxWidth: 480,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#303F9F',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        marginBottom: 24,
        width: '100%',
        },
        capacityInput: {
            flex: 1,
            fontSize: 18,
            padding: 12,
            color: '#2D3748',
        },
        unitText: {
            fontSize: 16,
            color: '#4A5568',
            fontWeight: '500',
        },
        foodTypesContainer: {
            width: '100%',
            marginBottom: 16,
        },
        checkboxContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            width: '100%',
            paddingHorizontal: 4,
        },
        checkbox: {
            marginRight: 12,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: '#3949AB',
        },
        checkboxLabel: {
            fontSize: 16,
            color: '#4A5568',
            flex: 1,
        },
        submitButton: {
            backgroundColor: '#3949AB',
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        submitButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
        },
    });
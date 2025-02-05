import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    Platform,
} from 'react-native';
import { FIREBASE_AUTH, FIREBASE_DB } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function Settings({ navigation }) {
    const [userType, setUserType] = useState('');
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // Form states
    const [location, setLocation] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
    });
    const [operatingHours, setOperatingHours] = useState({});
    const [capacity, setCapacity] = useState('');
    const [establishmentType, setEstablishmentType] = useState('');
    const [donationFrequency, setDonationFrequency] = useState('');
    const [typicalDonations, setTypicalDonations] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const user = FIREBASE_AUTH.currentUser;
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(FIREBASE_DB, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(data);
                setUserType(data.userType);

                // Set form data based on user type
                if (data.userType === 'Recipient' && data.recipientDetails) {
                    setLocation(data.recipientDetails.location);
                    setOperatingHours(data.recipientDetails.operatingHours);
                    setCapacity(data.recipientDetails.capacity);
                } else if (data.userType === 'Donor' && data.donorDetails) {
                    setLocation(data.donorDetails.location);
                    setOperatingHours(data.donorDetails.operatingHours);
                    setEstablishmentType(data.donorDetails.establishmentType);
                    setDonationFrequency(data.donorDetails.donationFrequency);
                    setTypicalDonations(data.donorDetails.typicalDonations);
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'Failed to load user data');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const user = FIREBASE_AUTH.currentUser;
        if (!user) return;

        try {
            const userRef = doc(FIREBASE_DB, 'users', user.uid);
            const updateData = {};

            if (userType === 'Recipient') {
                updateData.recipientDetails = {
                    ...userData.recipientDetails,
                    location,
                    operatingHours,
                    capacity,
                };
            } else if (userType === 'Donor') {
                updateData.donorDetails = {
                    ...userData.donorDetails,
                    location,
                    operatingHours,
                    establishmentType,
                    donationFrequency,
                    typicalDonations,
                };
            }

            await updateDoc(userRef, updateData);
            Alert.alert('Success', 'Settings updated successfully');
            setEditMode(false);
        } catch (error) {
            console.error('Error updating settings:', error);
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(FIREBASE_AUTH);
            navigation.navigate('Login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.navigate('MainPage')}
                    >
                        <Ionicons name="arrow-back" size={24} color="#303F9F" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 24 }} /> {/* Keeps header centered */}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{FIREBASE_AUTH.currentUser?.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Account Type</Text>
                        <Text style={[styles.value, styles.accountType]}>{userType || 'Donor'}</Text>
                    </View>
                </View>

                {!editMode ? (
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => setEditMode(true)}
                    >
                        <Ionicons name="create-outline" size={20} color="white" style={{marginRight: 8}} />
                        <Text style={styles.buttonText}>Edit Profile</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Edit Profile</Text>
                        
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Street"
                            value={location.street}
                            onChangeText={(text) => setLocation(prev => ({...prev, street: text}))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="City"
                            value={location.city}
                            onChangeText={(text) => setLocation(prev => ({...prev, city: text}))}
                        />
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, styles.stateInput]}
                                placeholder="State"
                                value={location.state}
                                maxLength={2}
                                autoCapitalize="characters"
                                onChangeText={(text) => setLocation(prev => ({...prev, state: text}))}
                            />
                            <TextInput
                                style={[styles.input, styles.zipInput]}
                                placeholder="ZIP Code"
                                value={location.zipCode}
                                keyboardType="numeric"
                                maxLength={5}
                                onChangeText={(text) => setLocation(prev => ({...prev, zipCode: text}))}
                            />
                        </View>

                        {userType === 'Recipient' && (
                            <>
                                <Text style={styles.label}>Storage Capacity</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Storage Capacity"
                                    value={capacity}
                                    onChangeText={setCapacity}
                                    keyboardType="numeric"
                                />
                            </>
                        )}

                        {userType === 'Donor' && (
                            <>
                                <Text style={styles.label}>Establishment Type</Text>
                                <Picker
                                    style={styles.picker}
                                    selectedValue={establishmentType}
                                    onValueChange={setEstablishmentType}
                                >
                                    <Picker.Item label="Select Type" value="" />
                                    <Picker.Item label="Restaurant" value="restaurant" />
                                    <Picker.Item label="Bakery" value="bakery" />
                                    <Picker.Item label="Grocery Store" value="grocery" />
                                    <Picker.Item label="Cafe" value="cafe" />
                                    <Picker.Item label="Other" value="other" />
                                </Picker>

                                <Text style={styles.label}>Donation Frequency</Text>
                                <Picker
                                    style={styles.picker}
                                    selectedValue={donationFrequency}
                                    onValueChange={setDonationFrequency}
                                >
                                    <Picker.Item label="Select Frequency" value="" />
                                    <Picker.Item label="Daily" value="daily" />
                                    <Picker.Item label="Weekly" value="weekly" />
                                    <Picker.Item label="Bi-weekly" value="biweekly" />
                                    <Picker.Item label="Monthly" value="monthly" />
                                    <Picker.Item label="As Available" value="asAvailable" />
                                </Picker>

                                <Text style={styles.label}>Typical Donations</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Typical Donation Items and Quantities"
                                    value={typicalDonations}
                                    onChangeText={setTypicalDonations}
                                    multiline
                                    numberOfLines={3}
                                />
                            </>
                        )}

                        <TouchableOpacity 
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Ionicons name="save-outline" size={20} color="white" style={{marginRight: 8}} />
                            <Text style={styles.buttonText}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity 
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                >
                    <Ionicons name="log-out-outline" size={20} color="white" style={{marginRight: 8}} />
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '100%',
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
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#303F9F',
        flex: 1,
        textAlign: 'center',
        marginLeft: -24, // Compensate for back button to ensure true center
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 16,
    },
    infoRow: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3949AB',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#4A5568',
    },
    accountType: {
        color: '#3949AB',
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stateInput: {
        flex: 1,
        marginRight: 12,
    },
    zipInput: {
        flex: 2,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    picker: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        marginBottom: 12,
    },
    editButton: {
        flexDirection: 'row',
        backgroundColor: '#3949AB',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#3949AB',
        padding: 16,
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    signOutButton: {
        flexDirection: 'row',
        backgroundColor: '#DC2626',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        padding: 8,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
}); 
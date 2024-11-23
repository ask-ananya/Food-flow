import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { setDoc, doc } from 'firebase/firestore';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState('Individual');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const [recipientDetails, setRecipientDetails] = useState({
        capacity: '',
        location: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
        dietaryRestrictions: {
            halal: false,
            kosher: false,
            vegetarian: false,
            vegan: false,
            glutenFree: false,
            dairyFree: false,
        },
        operatingHours: {
            monday: { open: '', close: '', accepting: false },
            tuesday: { open: '', close: '', accepting: false },
            wednesday: { open: '', close: '', accepting: false },
            thursday: { open: '', close: '', accepting: false },
            friday: { open: '', close: '', accepting: false },
            saturday: { open: '', close: '', accepting: false },
            sunday: { open: '', close: '', accepting: false },
        }
    });
    const [donorDetails, setDonorDetails] = useState({
        establishmentType: '',
        typicalDonations: '',
        donationFrequency: '',
        location: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
        },
        operatingHours: {
            monday: { open: '', close: '', available: false },
            tuesday: { open: '', close: '', available: false },
            wednesday: { open: '', close: '', available: false },
            thursday: { open: '', close: '', available: false },
            friday: { open: '', close: '', available: false },
            saturday: { open: '', close: '', available: false },
            sunday: { open: '', close: '', available: false },
        }
    });

    const signUp = async () => {
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        
        if (userType === 'Recipient') {
            const { street, city, state, zipCode } = recipientDetails.location;
            if (!recipientDetails.capacity || !street || !city || !state || !zipCode) {
                alert("Please fill in all required recipient details");
                return;
            }
            
            if (zipCode.length !== 5) {
                alert("Please enter a valid 5-digit ZIP code");
                return;
            }
            
            if (state.length !== 2) {
                alert("Please enter a valid 2-letter state code");
                return;
            }
        }
        
        if (userType === 'Donor') {
            const { street, city, state, zipCode } = donorDetails.location;
            if (!donorDetails.establishmentType || !donorDetails.typicalDonations || 
                !donorDetails.donationFrequency || !street || !city || !state || !zipCode) {
                alert("Please fill in all required donor details");
                return;
            }
            
            if (zipCode.length !== 5) {
                alert("Please enter a valid 5-digit ZIP code");
                return;
            }
            
            if (state.length !== 2) {
                alert("Please enter a valid 2-letter state code");
                return;
            }
        }
        
        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
            
            const userData = {
                email: email,
                userType: userType,
                createdAt: new Date().toISOString()
            };

            if (userType === 'Recipient') {
                userData.recipientDetails = recipientDetails;
            } else if (userType === 'Donor') {
                userData.donorDetails = donorDetails;
            }

            await setDoc(doc(FIREBASE_DB, 'users', response.user.uid), userData);

            alert('Account created successfully!');
            navigation.navigate('Login');
        } catch (error) {
            console.log(error);
            alert('Sign up failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    const renderRecipientFields = () => {
        if (userType !== 'Recipient') return null;

        return (
            <View>
                <TextInput
                    style={styles.input}
                    placeholder="Storage Capacity (warehouse square footage)"
                    keyboardType="numeric"
                    value={recipientDetails.capacity}
                    onChangeText={(text) => setRecipientDetails(prev => ({
                        ...prev,
                        capacity: text
                    }))}
                />
                
                <Text style={styles.sectionTitle}>Location Details:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Street Address"
                    value={recipientDetails.location.street}
                    onChangeText={(text) => setRecipientDetails(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            street: text
                        }
                    }))}
                />
                <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={recipientDetails.location.city}
                    onChangeText={(text) => setRecipientDetails(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            city: text
                        }
                    }))}
                />
                <View style={styles.addressRow}>
                    <TextInput
                        style={[styles.input, styles.stateInput]}
                        placeholder="State"
                        value={recipientDetails.location.state}
                        autoCapitalize="characters"
                        maxLength={2}
                        onChangeText={(text) => setRecipientDetails(prev => ({
                            ...prev,
                            location: {
                                ...prev.location,
                                state: text
                            }
                        }))}
                    />
                    <TextInput
                        style={[styles.input, styles.zipInput]}
                        placeholder="ZIP Code"
                        value={recipientDetails.location.zipCode}
                        keyboardType="numeric"
                        maxLength={5}
                        onChangeText={(text) => setRecipientDetails(prev => ({
                            ...prev,
                            location: {
                                ...prev.location,
                                zipCode: text
                            }
                        }))}
                    />
                </View>

                <Text style={styles.sectionTitle}>Dietary Restrictions Catered To:</Text>
                {Object.keys(recipientDetails.dietaryRestrictions).map((restriction) => (
                    <TouchableOpacity 
                        key={restriction}
                        style={[
                            styles.restrictionButton,
                            recipientDetails.dietaryRestrictions[restriction] && styles.restrictionButtonActive
                        ]}
                        onPress={() => setRecipientDetails(prev => ({
                            ...prev,
                            dietaryRestrictions: {
                                ...prev.dietaryRestrictions,
                                [restriction]: !prev.dietaryRestrictions[restriction]
                            }
                        }))}
                    >
                        <Text style={styles.restrictionText}>
                            {restriction.charAt(0).toUpperCase() + restriction.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>Operating Hours:</Text>
                {Object.entries(recipientDetails.operatingHours).map(([day, hours]) => (
                    <View key={day} style={styles.dayContainer}>
                        <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                        <View style={styles.hoursContainer}>
                            <TextInput
                                style={[
                                    styles.timeInput,
                                    !hours.accepting && styles.timeInputDisabled
                                ]}
                                placeholder="Open"
                                value={hours.open}
                                onChangeText={(text) => setRecipientDetails(prev => ({
                                    ...prev,
                                    operatingHours: {
                                        ...prev.operatingHours,
                                        [day]: { ...prev.operatingHours[day], open: text }
                                    }
                                }))}
                                editable={hours.accepting}
                            />
                            <TextInput
                                style={[
                                    styles.timeInput,
                                    !hours.accepting && styles.timeInputDisabled
                                ]}
                                placeholder="Close"
                                value={hours.close}
                                onChangeText={(text) => setRecipientDetails(prev => ({
                                    ...prev,
                                    operatingHours: {
                                        ...prev.operatingHours,
                                        [day]: { ...prev.operatingHours[day], close: text }
                                    }
                                }))}
                                editable={hours.accepting}
                            />
                            <TouchableOpacity
                                style={[styles.acceptingButton, hours.accepting && styles.acceptingButtonActive]}
                                onPress={() => {
                                    setRecipientDetails(prev => ({
                                        ...prev,
                                        operatingHours: {
                                            ...prev.operatingHours,
                                            [day]: { 
                                                open: hours.accepting ? '' : hours.open,
                                                close: hours.accepting ? '' : hours.close,
                                                accepting: !hours.accepting 
                                            }
                                        }
                                    }))
                                }}
                            >
                                <Text style={styles.acceptingButtonText}>
                                    {hours.accepting ? 'Accepting' : 'Not Accepting'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderDonorFields = () => {
        if (userType !== 'Donor') return null;

        return (
            <View>
                <Picker
                    style={[styles.input, styles.picker]}
                    selectedValue={donorDetails.establishmentType}
                    onValueChange={(value) => setDonorDetails(prev => ({
                        ...prev,
                        establishmentType: value
                    }))}
                >
                    <Picker.Item label="Select Establishment Type" value="" />
                    <Picker.Item label="Restaurant" value="restaurant" />
                    <Picker.Item label="Bakery" value="bakery" />
                    <Picker.Item label="Grocery Store" value="grocery" />
                    <Picker.Item label="Cafe" value="cafe" />
                    <Picker.Item label="Other" value="other" />
                </Picker>

                <TextInput
                    style={styles.input}
                    placeholder="Typical Donation Items and Quantities"
                    multiline
                    numberOfLines={3}
                    value={donorDetails.typicalDonations}
                    onChangeText={(text) => setDonorDetails(prev => ({
                        ...prev,
                        typicalDonations: text
                    }))}
                />

                <Picker
                    style={[styles.input, styles.picker]}
                    selectedValue={donorDetails.donationFrequency}
                    onValueChange={(value) => setDonorDetails(prev => ({
                        ...prev,
                        donationFrequency: value
                    }))}
                >
                    <Picker.Item label="Select Donation Frequency" value="" />
                    <Picker.Item label="Daily" value="daily" />
                    <Picker.Item label="Weekly" value="weekly" />
                    <Picker.Item label="Bi-weekly" value="biweekly" />
                    <Picker.Item label="Monthly" value="monthly" />
                    <Picker.Item label="As Available" value="asAvailable" />
                </Picker>

                <Text style={styles.sectionTitle}>Location Details:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Street Address"
                    value={donorDetails.location.street}
                    onChangeText={(text) => setDonorDetails(prev => ({
                        ...prev,
                        location: { ...prev.location, street: text }
                    }))}
                />
                <TextInput
                    style={styles.input}
                    placeholder="City"
                    value={donorDetails.location.city}
                    onChangeText={(text) => setDonorDetails(prev => ({
                        ...prev,
                        location: { ...prev.location, city: text }
                    }))}
                />
                <View style={styles.addressRow}>
                    <TextInput
                        style={[styles.input, styles.stateInput]}
                        placeholder="State"
                        value={donorDetails.location.state}
                        autoCapitalize="characters"
                        maxLength={2}
                        onChangeText={(text) => setDonorDetails(prev => ({
                            ...prev,
                            location: { ...prev.location, state: text }
                        }))}
                    />
                    <TextInput
                        style={[styles.input, styles.zipInput]}
                        placeholder="ZIP Code"
                        value={donorDetails.location.zipCode}
                        keyboardType="numeric"
                        maxLength={5}
                        onChangeText={(text) => setDonorDetails(prev => ({
                            ...prev,
                            location: { ...prev.location, zipCode: text }
                        }))}
                    />
                </View>

                <Text style={styles.sectionTitle}>Operating Hours:</Text>
                {Object.entries(donorDetails.operatingHours).map(([day, hours]) => (
                    <View key={day} style={styles.dayContainer}>
                        <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                        <View style={styles.hoursContainer}>
                            <TextInput
                                style={[styles.timeInput, !hours.available && styles.timeInputDisabled]}
                                placeholder="Open"
                                value={hours.open}
                                onChangeText={(text) => setDonorDetails(prev => ({
                                    ...prev,
                                    operatingHours: {
                                        ...prev.operatingHours,
                                        [day]: { ...prev.operatingHours[day], open: text }
                                    }
                                }))}
                                editable={hours.available}
                            />
                            <TextInput
                                style={[styles.timeInput, !hours.available && styles.timeInputDisabled]}
                                placeholder="Close"
                                value={hours.close}
                                onChangeText={(text) => setDonorDetails(prev => ({
                                    ...prev,
                                    operatingHours: {
                                        ...prev.operatingHours,
                                        [day]: { ...prev.operatingHours[day], close: text }
                                    }
                                }))}
                                editable={hours.available}
                            />
                            <TouchableOpacity
                                style={[styles.acceptingButton, hours.available && styles.acceptingButtonActive]}
                                onPress={() => setDonorDetails(prev => ({
                                    ...prev,
                                    operatingHours: {
                                        ...prev.operatingHours,
                                        [day]: {
                                            open: hours.available ? '' : hours.open,
                                            close: hours.available ? '' : hours.close,
                                            available: !hours.available
                                        }
                                    }
                                }))}
                            >
                                <Text style={styles.acceptingButtonText}>
                                    {hours.available ? 'Available' : 'Unavailable'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                onChangeText={(text) => setEmail(text)}
                value={email}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                autoCapitalize="none"
                onChangeText={(text) => setPassword(text)}
                value={password}
                secureTextEntry={true}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                autoCapitalize="none"
                onChangeText={(text) => setConfirmPassword(text)}
                value={confirmPassword}
                secureTextEntry={true}
            />
            
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={userType}
                    onValueChange={(itemValue) => setUserType(itemValue)}
                    style={styles.picker}
                >
                    <Picker.Item label="Individual" value="Individual" />
                    <Picker.Item label="Recipient" value="Recipient" />
                    <Picker.Item label="Donor" value="Donor" />
                </Picker>
            </View>
            
            {renderRecipientFields()}
            {renderDonorFields()}
            
            <TouchableOpacity 
                style={styles.button}
                onPress={signUp}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Creating account...' : 'Create Account'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.link}>Already have an account? Login</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    contentContainer: {
        justifyContent: 'center',
        paddingBottom: 20,
    },
    input: {
        marginVertical: 4,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
    },
    pickerContainer: {
        marginVertical: 4,
        borderWidth: 1,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    picker: {
        height: 50,
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 4,
        marginVertical: 10,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
    },
    link: {
        color: '#2196F3',
        textAlign: 'center',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
    },
    dayContainer: {
        marginVertical: 8,
    },
    dayText: {
        fontSize: 14,
        marginBottom: 4,
    },
    hoursContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    timeInputDisabled: {
        backgroundColor: '#f0f0f0',
        color: '#888',
    },
    restrictionButton: {
        padding: 10,
        borderWidth: 1,
        borderRadius: 4,
        marginVertical: 4,
        backgroundColor: '#fff',
    },
    restrictionButtonActive: {
        backgroundColor: '#2196F3',
    },
    restrictionText: {
        textAlign: 'center',
    },
    acceptingButton: {
        padding: 8,
        borderRadius: 4,
        backgroundColor: '#ff4444',
        minWidth: 100,
    },
    acceptingButtonActive: {
        backgroundColor: '#00C851',
    },
    acceptingButtonText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
    },
    addressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stateInput: {
        flex: 1,
        marginRight: 10,
    },
    zipInput: {
        flex: 2,
    },
});
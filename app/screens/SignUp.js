import { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView,
    SafeAreaView,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal
} from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { FIREBASE_DB } from '../../FirebaseConfig';
import { setDoc, doc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Replace with your actual OpenRouteService API key
const OPENROUTE_SERVICE_API_KEY = '5b3ce3597851110001cf624832fdc07e4faf477fa76a70c083547c65';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState('Individual');
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const navigation = useNavigation();
    const [showUserTypeDropdown, setShowUserTypeDropdown] = useState(false);
    const [showEstablishmentTypeDropdown, setShowEstablishmentTypeDropdown] = useState(false);
    const [showAccountTooltip, setShowAccountTooltip] = useState(false);
    const [recipientDetails, setRecipientDetails] = useState({
        name: '',
        capacity: '',
        hasRefrigeration: false,
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
        name: '',
        establishmentType: '',
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

    // Geocode address function
    const geocodeAddress = async (address) => {
        try {
            const response = await fetch(
                `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTE_SERVICE_API_KEY}&text=${encodeURIComponent(address)}&size=1`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding request failed');
            }

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const [longitude, latitude] = data.features[0].geometry.coordinates;
                return { longitude, latitude };
            } else {
                throw new Error('No coordinates found for the given address');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            alert('Could not find coordinates for the provided address');
            return null;
        }
    };

    const signUp = async () => {
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        
        if (userType === 'Recipient') {
            const { street, city, state, zipCode } = recipientDetails.location;
            if (!recipientDetails.name || !recipientDetails.capacity || !street || !city || !state || !zipCode) {
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
            if (!donorDetails.name || !donorDetails.establishmentType || !street || !city || !state || !zipCode) {
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

            // Determine which details to use based on user type
            const details = userType === 'Recipient' ? recipientDetails : 
                           userType === 'Donor' ? donorDetails : null;

            if (details && details.location) {
                // Create full address string
                const fullAddress = `${details.location.street}, ${details.location.city}, ${details.location.state} ${details.location.zipCode}`;
                
                // Attempt to geocode the address
                const coordinates = await geocodeAddress(fullAddress);
                
                if (coordinates) {
                    // Add coordinates to the location details
                    details.location.coordinates = coordinates;
                }
            }

            // Add details to userData
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

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    const renderRecipientFields = () => {
        if (userType !== 'Recipient') return null;

        return (
            <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Recipient Details</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Organization Name</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter organization name"
                            placeholderTextColor="#A0AEC0"
                            value={recipientDetails.name}
                            onChangeText={(text) => setRecipientDetails(prev => ({
                                ...prev,
                                name: text
                            }))}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Storage Capacity (sq ft)</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="cube-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter storage capacity"
                            placeholderTextColor="#A0AEC0"
                            keyboardType="numeric"
                            value={recipientDetails.capacity}
                            onChangeText={(text) => setRecipientDetails(prev => ({
                                ...prev,
                                capacity: text
                            }))}
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[
                        styles.toggleCard,
                        recipientDetails.hasRefrigeration && styles.toggleCardActive
                    ]}
                    onPress={() => setRecipientDetails(prev => ({
                        ...prev,
                        hasRefrigeration: !prev.hasRefrigeration
                    }))}
                >
                    <Ionicons 
                        name={recipientDetails.hasRefrigeration ? "checkmark-circle" : "ellipse-outline"} 
                        size={24} 
                        color={recipientDetails.hasRefrigeration ? "#fff" : "#303F9F"} 
                    />
                    <Text style={[
                        styles.toggleCardText,
                        recipientDetails.hasRefrigeration && styles.toggleCardTextActive
                    ]}>
                        Refrigeration Available
                    </Text>
                </TouchableOpacity>
                
                <Text style={styles.sectionSubtitle}>Location Details</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Street Address</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter street address"
                            placeholderTextColor="#A0AEC0"
                            value={recipientDetails.location.street}
                            onChangeText={(text) => setRecipientDetails(prev => ({
                                ...prev,
                                location: {
                                    ...prev.location,
                                    street: text
                                }
                            }))}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>City</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter city"
                            placeholderTextColor="#A0AEC0"
                            value={recipientDetails.location.city}
                            onChangeText={(text) => setRecipientDetails(prev => ({
                                ...prev,
                                location: {
                                    ...prev.location,
                                    city: text
                                }
                            }))}
                        />
                    </View>
                </View>

                <View style={styles.addressRow}>
                    <View style={[styles.inputGroup, styles.stateInput]}>
                        <Text style={styles.inputLabel}>State</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="State"
                                placeholderTextColor="#A0AEC0"
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
                        </View>
                    </View>
                    
                    <View style={[styles.inputGroup, styles.zipInput]}>
                        <Text style={styles.inputLabel}>ZIP Code</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="00000"
                                placeholderTextColor="#A0AEC0"
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
                    </View>
                </View>

                <Text style={styles.sectionSubtitle}>Dietary Restrictions Catered To</Text>
                <View style={styles.restrictionsContainer}>
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
                            <Text style={[
                                styles.restrictionText,
                                recipientDetails.dietaryRestrictions[restriction] && styles.restrictionTextActive
                            ]}>
                                {restriction.charAt(0).toUpperCase() + restriction.slice(1).replace(/([A-Z])/g, ' $1')}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionSubtitle}>Operating Hours</Text>
                {Object.entries(recipientDetails.operatingHours).map(([day, hours]) => (
                    <View key={day} style={styles.dayContainer}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                            <TouchableOpacity
                                style={[styles.dayToggleButton, hours.accepting && styles.dayToggleButtonActive]}
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
                                <Text style={styles.dayToggleButtonText}>
                                    {hours.accepting ? 'Accepting' : 'Closed'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {hours.accepting && (
                            <View style={styles.hoursInputContainer}>
                                <View style={styles.timeInputWrapper}>
                                    <Text style={styles.timeLabel}>Open</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        placeholder="9:00 AM"
                                        placeholderTextColor="#A0AEC0"
                                        value={hours.open}
                                        onChangeText={(text) => setRecipientDetails(prev => ({
                                            ...prev,
                                            operatingHours: {
                                                ...prev.operatingHours,
                                                [day]: { ...prev.operatingHours[day], open: text }
                                            }
                                        }))}
                                    />
                                </View>
                                
                                <View style={styles.timeInputWrapper}>
                                    <Text style={styles.timeLabel}>Close</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        placeholder="5:00 PM"
                                        placeholderTextColor="#A0AEC0"
                                        value={hours.close}
                                        onChangeText={(text) => setRecipientDetails(prev => ({
                                            ...prev,
                                            operatingHours: {
                                                ...prev.operatingHours,
                                                [day]: { ...prev.operatingHours[day], close: text }
                                            }
                                        }))}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const renderDonorFields = () => {
        if (userType !== 'Donor') return null;

        return (
            <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Donor Details</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Organization Name</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter organization name"
                            placeholderTextColor="#A0AEC0"
                            value={donorDetails.name}
                            onChangeText={(text) => setDonorDetails(prev => ({
                                ...prev,
                                name: text
                            }))}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Establishment Type</Text>
                    <TouchableOpacity 
                        style={styles.dropdownContainer}
                        onPress={() => setShowEstablishmentTypeDropdown(true)}
                    >
                        <Ionicons name="restaurant-outline" size={20} color="#666" style={styles.inputIcon} />
                        <Text style={[
                            styles.dropdownText,
                            !donorDetails.establishmentType && styles.dropdownPlaceholder
                        ]}>
                            {donorDetails.establishmentType ? 
                                donorDetails.establishmentType.charAt(0).toUpperCase() + donorDetails.establishmentType.slice(1) : 
                                "Select Establishment Type"
                            }
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    
                    {/* Modal for Establishment Type selection */}
                    <Modal
                        transparent={true}
                        visible={showEstablishmentTypeDropdown}
                        animationType="fade"
                        onRequestClose={() => setShowEstablishmentTypeDropdown(false)}
                    >
                        <TouchableOpacity 
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowEstablishmentTypeDropdown(false)}
                        >
                            <View style={styles.dropdownModal}>
                                {["restaurant", "bakery", "grocery", "cafe", "other"].map((type) => (
                                    <TouchableOpacity 
                                        key={type}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setDonorDetails(prev => ({
                                                ...prev,
                                                establishmentType: type
                                            }));
                                            setShowEstablishmentTypeDropdown(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dropdownItemText,
                                            donorDetails.establishmentType === type && styles.dropdownItemTextSelected
                                        ]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                        {donorDetails.establishmentType === type && (
                                            <Ionicons name="checkmark" size={20} color="#303F9F" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>

                <Text style={styles.sectionSubtitle}>Location Details</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Street Address</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter street address"
                            placeholderTextColor="#A0AEC0"
                            value={donorDetails.location.street}
                            onChangeText={(text) => setDonorDetails(prev => ({
                                ...prev,
                                location: { ...prev.location, street: text }
                            }))}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>City</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter city"
                            placeholderTextColor="#A0AEC0"
                            value={donorDetails.location.city}
                            onChangeText={(text) => setDonorDetails(prev => ({
                                ...prev,
                                location: { ...prev.location, city: text }
                            }))}
                        />
                    </View>
                </View>

                <View style={styles.addressRow}>
                    <View style={[styles.inputGroup, styles.stateInput]}>
                        <Text style={styles.inputLabel}>State</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="State"
                                placeholderTextColor="#A0AEC0"
                                value={donorDetails.location.state}
                                autoCapitalize="characters"
                                maxLength={2}
                                onChangeText={(text) => setDonorDetails(prev => ({
                                    ...prev,
                                    location: { ...prev.location, state: text }
                                }))}
                            />
                        </View>
                    </View>
                    
                    <View style={[styles.inputGroup, styles.zipInput]}>
                        <Text style={styles.inputLabel}>ZIP Code</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="00000"
                                placeholderTextColor="#A0AEC0"
                                value={donorDetails.location.zipCode}
                                keyboardType="numeric"
                                maxLength={5}
                                onChangeText={(text) => setDonorDetails(prev => ({
                                    ...prev,
                                    location: { ...prev.location, zipCode: text }
                                }))}
                            />
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionSubtitle}>Operating Hours</Text>
                {Object.entries(donorDetails.operatingHours).map(([day, hours]) => (
                    <View key={day} style={styles.dayContainer}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                            <TouchableOpacity
                                style={[styles.dayToggleButton, hours.available && styles.dayToggleButtonActive]}
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
                                <Text style={styles.dayToggleButtonText}>
                                    {hours.available ? 'Available' : 'Closed'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {hours.available && (
                            <View style={styles.hoursInputContainer}>
                                <View style={styles.timeInputWrapper}>
                                    <Text style={styles.timeLabel}>Open</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        placeholder="9:00 AM"
                                        placeholderTextColor="#A0AEC0"
                                        value={hours.open}
                                        onChangeText={(text) => setDonorDetails(prev => ({
                                            ...prev,
                                            operatingHours: {
                                                ...prev.operatingHours,
                                                [day]: { ...prev.operatingHours[day], open: text }
                                            }
                                        }))}
                                    />
                                </View>
                                
                                <View style={styles.timeInputWrapper}>
                                    <Text style={styles.timeLabel}>Close</Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        placeholder="5:00 PM"
                                        placeholderTextColor="#A0AEC0"
                                        value={hours.close}
                                        onChangeText={(text) => setDonorDetails(prev => ({
                                            ...prev,
                                            operatingHours: {
                                                ...prev.operatingHours,
                                                [day]: { ...prev.operatingHours[day], close: text }
                                            }
                                        }))}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.mainContainer}
        >
            <LinearGradient
                colors={['#F5F7FF', '#EDF0FF']}
                style={styles.background}
            />
            
            <SafeAreaView style={styles.safeArea}>
                <ScrollView 
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.pageTitle}>Create Account</Text>
                    <Text style={styles.pageSubtitle}>Please fill in the details below to sign up</Text>
                    
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="email@example.com"
                                    placeholderTextColor="#A0AEC0"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onChangeText={(text) => setEmail(text)}
                                    value={email}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor="#A0AEC0"
                                    autoCapitalize="none"
                                    onChangeText={(text) => setPassword(text)}
                                    value={password}
                                    secureTextEntry={!passwordVisible}
                                />
                                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#A0AEC0"
                                    autoCapitalize="none"
                                    onChangeText={(text) => setConfirmPassword(text)}
                                    value={confirmPassword}
                                    secureTextEntry={!confirmPasswordVisible}
                                />
                                <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIcon}>
                                    <Ionicons
                                        name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <View style={styles.labelWithTooltip}>
                                <Text style={styles.inputLabel}>Account Type</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowAccountTooltip(true)}
                                    style={styles.tooltipIcon}
                                >
                                    <Ionicons name="help-circle-outline" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                style={styles.dropdownContainer}
                                onPress={() => setShowUserTypeDropdown(true)}
                            >
                                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                <Text style={styles.dropdownText}>
                                    {userType || "Select Account Type"}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#666" />
                            </TouchableOpacity>
                            
                            {/* Modal for User Type selection */}
                            <Modal
                                transparent={true}
                                visible={showUserTypeDropdown}
                                animationType="fade"
                                onRequestClose={() => setShowUserTypeDropdown(false)}
                            >
                                <TouchableOpacity 
                                    style={styles.modalOverlay}
                                    activeOpacity={1}
                                    onPress={() => setShowUserTypeDropdown(false)}
                                >
                                    <View style={styles.dropdownModal}>
                                        <TouchableOpacity 
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setUserType('Individual');
                                                setShowUserTypeDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                userType === 'Individual' && styles.dropdownItemTextSelected
                                            ]}>
                                                Individual
                                            </Text>
                                            {userType === 'Individual' && (
                                                <Ionicons name="checkmark" size={20} color="#303F9F" />
                                            )}
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setUserType('Recipient');
                                                setShowUserTypeDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                userType === 'Recipient' && styles.dropdownItemTextSelected
                                            ]}>
                                                Recipient Organization
                                            </Text>
                                            {userType === 'Recipient' && (
                                                <Ionicons name="checkmark" size={20} color="#303F9F" />
                                            )}
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity 
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setUserType('Donor');
                                                setShowUserTypeDropdown(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                userType === 'Donor' && styles.dropdownItemTextSelected
                                            ]}>
                                                Donor Organization
                                            </Text>
                                            {userType === 'Donor' && (
                                                <Ionicons name="checkmark" size={20} color="#303F9F" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                            
                            {/* Account Type Info Tooltip Modal */}
                            <Modal
                                transparent={true}
                                visible={showAccountTooltip}
                                animationType="fade"
                                onRequestClose={() => setShowAccountTooltip(false)}
                            >
                                <TouchableOpacity 
                                    style={styles.modalOverlay}
                                    activeOpacity={1}
                                    onPress={() => setShowAccountTooltip(false)}
                                >
                                    <View style={styles.tooltipModal}>
                                        <Text style={styles.tooltipTitle}>Account Types</Text>
                                        
                                        <View style={styles.tooltipItem}>
                                            <Text style={styles.tooltipItemTitle}>Individual</Text>
                                            <Text style={styles.tooltipItemDescription}>
                                                Someone who will deliver food between donation centers and recipient locations.
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.tooltipItem}>
                                            <Text style={styles.tooltipItemTitle}>Donor Organization</Text>
                                            <Text style={styles.tooltipItemDescription}>
                                                Someone who will donate food to donation centers and recipient locations.
                                            </Text>
                                        </View>
                                        
                                        <View style={styles.tooltipItem}>
                                            <Text style={styles.tooltipItemTitle}>Recipient Organization</Text>
                                            <Text style={styles.tooltipItemDescription}>
                                                Someone who will receive food from donation centers and recipient locations.
                                            </Text>
                                        </View>
                                        
                                        <TouchableOpacity 
                                            style={styles.tooltipCloseButton}
                                            onPress={() => setShowAccountTooltip(false)}
                                        >
                                            <Text style={styles.tooltipCloseButtonText}>Got it</Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                        </View>
                        
                        {renderRecipientFields()}
                        {renderDonorFields()}
                        
                        <TouchableOpacity 
                            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                            onPress={signUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.signupButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.loginLink}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.loginLinkText}>
                                Already have an account? <Text style={styles.loginText}>Log In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 60,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#303F9F',
        marginBottom: 8,
        marginTop: 16,
    },
    pageSubtitle: {
        fontSize: 16,
        color: '#4A5568',
        marginBottom: 32,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3748',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 16,
            height: 54,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        inputIcon: {
            marginRight: 12,
        },
        input: {
            flex: 1,
            fontSize: 16,
            color: '#2D3748',
            height: '100%',
        },
        eyeIcon: {
            padding: 8,
        },
        signupButton: {
            backgroundColor: '#3949AB',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginTop: 12,
            marginBottom: 16,
        },
        signupButtonDisabled: {
            backgroundColor: '#A4A6B3',
        },
        signupButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
        },
        loginLink: {
            alignItems: 'center',
            marginTop: 8,
        },
        loginLinkText: {
            fontSize: 16,
            color: '#4A5568',
        },
        loginText: {
            color: '#3949AB',
            fontWeight: '600',
        },
        detailsContainer: {
            marginTop: 8,
            marginBottom: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: '600',
            color: '#303F9F',
            marginBottom: 16,
        },
        sectionSubtitle: {
            fontSize: 18,
            fontWeight: '500',
            color: '#4A5568',
            marginTop: 20,
            marginBottom: 12,
        },
        toggleCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginVertical: 8,
        },
        toggleCardActive: {
            backgroundColor: '#3949AB',
            borderColor: '#3949AB',
        },
        toggleCardText: {
            fontSize: 16,
            color: '#4A5568',
            marginLeft: 12,
        },
        toggleCardTextActive: {
            color: 'white',
        },
        addressRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        stateInput: {
            flex: 1,
            marginRight: 12,
        },
        zipInput: {
            flex: 2,
        },
        restrictionsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        restrictionButton: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginBottom: 12,
            minWidth: '48%',
            alignItems: 'center',
        },
        restrictionButtonActive: {
            backgroundColor: '#3949AB',
            borderColor: '#3949AB',
        },
        restrictionText: {
            fontSize: 14,
            color: '#4A5568',
        },
        restrictionTextActive: {
            color: 'white',
        },
        dayContainer: {
            marginBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            paddingBottom: 16,
        },
        dayHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        dayText: {
            fontSize: 16,
            fontWeight: '500',
            color: '#2D3748',
        },
        dayToggleButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: '#EF5350',
        },
        dayToggleButtonActive: {
            backgroundColor: '#4CAF50',
        },
        dayToggleButtonText: {
            color: 'white',
            fontSize: 14,
            fontWeight: '500',
        },
        hoursInputContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        timeInputWrapper: {
            flex: 1,
            marginRight: 12,
        },
        timeLabel: {
            fontSize: 14,
            color: '#4A5568',
            marginBottom: 4,
            marginLeft: 4,
        },
        timeInput: {
            backgroundColor: 'white',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 14,
        },
        dropdownContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 16,
            height: 54,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        dropdownText: {
            flex: 1,
            fontSize: 16,
            color: '#2D3748',
            marginLeft: 12,
        },
        dropdownPlaceholder: {
            color: '#A0AEC0',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dropdownModal: {
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 8,
            width: '80%',
            maxWidth: 400,
            maxHeight: '80%',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
        },
        dropdownItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F7FAFC',
        },
        dropdownItemText: {
            fontSize: 16,
            color: '#4A5568',
        },
        dropdownItemTextSelected: {
            color: '#303F9F',
            fontWeight: '500',
        },
        labelWithTooltip: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        tooltipIcon: {
            marginLeft: 8,
            marginBottom: 7,
            padding: 2,
        },
        tooltipModal: {
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            width: '85%',
            maxWidth: 420,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
        tooltipTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: '#303F9F',
            marginBottom: 16,
            textAlign: 'center',
        },
        tooltipItem: {
            marginBottom: 16,
        },
        tooltipItemTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: '#2D3748',
            marginBottom: 4,
        },
        tooltipItemDescription: {
            fontSize: 14,
            color: '#4A5568',
            lineHeight: 20,
        },
        tooltipCloseButton: {
            backgroundColor: '#3949AB',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 8,
        },
        tooltipCloseButtonText: {
            color: 'white',
            fontWeight: '600',
            fontSize: 16,
        },
        
    });
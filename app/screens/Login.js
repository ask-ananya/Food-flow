import { useState } from 'react';
import {View, Text, TextInput, StyleSheet, TouchableOpacity, Image} from 'react-native';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();

    const signIn = async () => {
        setLoading(true);
        try {
            const response = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
            navigation.navigate('MainPage');
            console.log(response);
        } catch (error) {
            console.log(error);
            alert('Sign in failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Image source={require('../../assets/icon.png')} style={{width: 96, height: 96, borderRadius: "100%", padding: 2}} />
                <View>
                    <Text style={{ fontWeight: "bold", fontSize: 22 }}>FoodFlow</Text>
                    <Text style={{ fontSize: 16, maxWidth: 200 }}>Algorithmic food donation like never seen before!</Text>
                </View>
            </View>

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
            
            {/*<TouchableOpacity */}
            {/*    style={styles.button}*/}
            {/*    onPress={signIn}*/}
            {/*    disabled={loading}*/}
            {/*>*/}
            {/*    <Text style={styles.buttonText}>*/}
            {/*        {loading ? 'Loading...' : 'Login'}*/}
            {/*    </Text>*/}
            {/*</TouchableOpacity>*/}
            <Button onPress={signIn} type="primary" disabled={loading}>{loading ? 'Loading...' : 'Login'}</Button>
            <Button onPress={() => navigation.navigate('SignUp')} type="link">
                Don't have an account? Sign Up
            </Button>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        marginVertical: 4,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 10,
        backgroundColor: '#fff',
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
    }
});
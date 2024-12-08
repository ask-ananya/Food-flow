import { SafeAreaView, View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { FIREBASE_AUTH } from '../../FirebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';
import Button from '../components/Button';
import {useNavigation} from '@react-navigation/native';

export default function WelcomeScreen() {
    const navigation = useNavigation();

    const currentUser = FIREBASE_AUTH.currentUser;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.centeredView}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <Image source={require('../../assets/icon.png')} style={{width: 96, height: 96, borderRadius: "100%", padding: 2, margin:10}} />
                    <View>
                        <Text style={{ fontWeight: "bold", fontSize: 22 }}>FoodFlow</Text>
                        <Text style={{ fontSize: 16, maxWidth: 200 }}>Algorithmic food donation like never seen before!</Text>
                    </View>
                </View>
                {currentUser ? (
                    <View style={{
                        flexDirection: "row"
                    }}>
                        <Button onPress={() => navigation.navigate('MainPage')} type="primary" style={{marginRight: 10}}>Go to Home</Button>
                    </View>
                ) : (
                    <View style={{
                        flexDirection: "row"
                    }}>
                        <Button onPress={() => navigation.navigate('Login')} type="primary" style={{marginRight: 10}}>Login</Button>
                        <Button onPress={() => navigation.navigate('SignUp')} type="primary">Sign Up</Button>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
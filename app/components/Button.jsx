import {StyleSheet, Text, TouchableOpacity} from "react-native";

export default function Button({ children, onPress, disabled, type, style = [] }) {
    let buttonStyle = [styles.button];
    let textStyle = [styles.buttonText];
    if (type === 'primary') {
        buttonStyle = [styles.button, styles.buttonPrimary];
    } else if (type === 'secondary') {
        buttonStyle = [styles.button, styles.buttonSecondary];
    } else if (type === 'link') {
        buttonStyle = [{}];
        textStyle = [styles.link];
    }


    return (
        <TouchableOpacity
            onPress={onPress}
            style={[...buttonStyle, ...[style]]}
            disabled={disabled}
        >
            <Text style={textStyle}>{children}</Text>
        </TouchableOpacity>
    );
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
        padding: 15,
        borderRadius: 4,
        marginVertical: 10,
    },
    buttonPrimary: {
        backgroundColor: '#2196F3',
    },
    buttonSecondary: {
        backgroundColor: '#f50057',
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
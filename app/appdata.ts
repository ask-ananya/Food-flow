async () => {
    try {
        const value = await AsyncStorage.getItem('TASKS');
        if (value !== null) {
            // We have data!!
            console.log(value);
        }
    } catch (error) {
        // Error retrieving data
    }
};

let firebaseAuth = null
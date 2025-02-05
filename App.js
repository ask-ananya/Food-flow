import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./app/screens/Login";
import SignUp from "./app/screens/SignUp";
import MainPage from "./app/screens/MainPage";
import Welcome from "./app/screens/Welcome";
import DetailsPage from './app/screens/DetailsPage';
import Settings from './app/screens/Settings';
import History from './app/screens/History';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="MainPage" component={MainPage} options={{ headerShown: false }}/>
        <Stack.Screen 
          name="DetailsPage" 
          component={DetailsPage} 
          options={{ 
            headerShown: false, // Hide default header
          }}
        />
        <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }}/>
        <Stack.Screen name="History"  component={History}  options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}


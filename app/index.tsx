import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { SafeAreaView, View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";

const Welcome = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    if (session && session.user) {
      router.push("/home");
    }
  }, [session, router]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <View className="flex flex-col items-center justify-center">
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 96, height: 96 }}
        />
        <Text>Foodflow</Text>
        <Text>Algorithmic food donation like never seen before!</Text>
      </View>

      <Button onPress={() => router.push("/sign-in")}>
        <Text>Sign in</Text>
      </Button>
      <Button onPress={() => router.push("/sign-up")}>
        <Text>Sign up</Text>
      </Button>
    </SafeAreaView>
  );
};

export default Welcome;

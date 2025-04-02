import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { SafeAreaView, View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { Span } from "@expo/html-elements";

const demographics = [
  {
    name: "a family",
    img: require("@/assets/images/homepage/family.jpeg"),
  },
  {
    name: "a shelter",
    img: require("@/assets/images/homepage/shelter.webp"),
  },
  {
    name: "people",
    img: require("@/assets/images/homepage/community.jpeg"),
  },
  {
    name: "disaster victims",
    img: require("@/assets/images/homepage/disaster.jpeg"),
  },
  {
    name: "schools",
    img: require("@/assets/images/homepage/school.jpeg"),
  },
];

const Welcome = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [targetDemoIndex, setTargetDemoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (targetDemoIndex >= demographics.length - 1) {
        setTargetDemoIndex(0);
      } else {
        setTargetDemoIndex((prev) => prev + 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [targetDemoIndex]);

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
      <View className="flex flex-col items-center justify-center w-screen h-screen p-2 px-6">
        <Image
          source={require("@/assets/images/icon.png")}
          style={{ width: 96, height: 96 }}
          className="rounded-full border-2 border-primary-500"
        />
        <Text className="mt-2 text-3xl font-medium text-center">
          Let's get food to
          {"\n"}
          <Span className="text-primary-600 underline decoration-primary-400 underline-offset-2">
            {demographics[targetDemoIndex].name}
          </Span>{" "}
          in need today.
        </Text>
        <Text className="mt-2 text-center">
          Foodflow is revolutionizing food redistribution for our community with{" "}
          <Span className="text-primary-600 font-medium">
            advanced artificial intelligence.
          </Span>
        </Text>

        <Image
          source={demographics[targetDemoIndex].img}
          className="my-4 w-full rounded-2xl border-2 border-primary-400 h-[50vh]"
        />

        <View className="flex flex-row gap-2 w-full">
          <Button
            className="flex-1 rounded-xl"
            onPress={() => router.push("/sign-in")}
          >
            <Text>Sign in</Text>
          </Button>
          <Button
            className="flex-1 rounded-xl"
            onPress={() => router.push("/sign-up")}
          >
            <Text>Sign up</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

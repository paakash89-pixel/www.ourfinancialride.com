import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("intrinsic_disclaimer_ack")
      .then((value) => {
        setAcknowledged(Boolean(value));
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  if (!ready) return null;
  return <Redirect href={acknowledged ? "/home" : "/(onboarding)"} />;
}

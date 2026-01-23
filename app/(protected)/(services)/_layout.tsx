import { Slot, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useEffect } from "react";

export default function ServiceLayout() {
  const router = useRouter();
  const token = useSelector((state: any) => state.auth.accessToken);
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    if (!token || !user) {
      router.replace("/(auth)/signin");
    }
  }, [token, user]);

  return (
    <>
      <Slot />
    </>
  );
}

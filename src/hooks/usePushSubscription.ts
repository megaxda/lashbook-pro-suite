import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

let cachedPublicKey: string | null = null;
async function getVapidPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;
  const { data, error } = await supabase.functions.invoke("get-vapid-public-key");
  if (error || !data?.publicKey) throw new Error("VAPID public key indisponível");
  cachedPublicKey = data.publicKey;
  return cachedPublicKey!;
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (!reg) return;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return false;

      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js"));

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const publicKey = await getVapidPublicKey();
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const json = sub.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: userData.user.id,
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh || "",
          auth: json.keys?.auth || "",
        },
        { onConflict: "endpoint" },
      );
      setSubscribed(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe };
}

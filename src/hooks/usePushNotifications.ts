import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export function usePushNotifications() {
  const subscribed = useRef(false);

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push notifications not supported in this browser/environment");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Fetch the VAPID public key from the edge function
      const { data: keyData, error: keyError } = await supabase.functions.invoke("get-vapid-public-key");
      if (keyError || !keyData?.publicKey) {
        console.error("Failed to get VAPID public key:", keyError);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const pushManager = (registration as any).pushManager;
      const existing = await pushManager.getSubscription();
      const subscription = existing ?? await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      const jsonSub = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await supabase.functions.invoke("save-push-subscription", {
        body: {
          endpoint: jsonSub.endpoint,
          p256dh: jsonSub.keys.p256dh,
          auth: jsonSub.keys.auth,
        },
      });

      subscribed.current = true;
    } catch (err) {
      console.error("Push subscription error:", err);
    }
  };

  return { subscribe };
}

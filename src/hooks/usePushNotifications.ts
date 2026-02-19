import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export function usePushNotifications() {
  const subscribed = useRef(false);

  const subscribe = async () => {
    if (subscribed.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!VAPID_PUBLIC_KEY) {
      console.warn("VAPID_PUBLIC_KEY not set");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const pushManager = (registration as any).pushManager;
      const existing = await pushManager.getSubscription();
      const subscription = existing ?? await pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke("save-push-subscription", {
        body: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      });

      subscribed.current = true;
    } catch (err) {
      console.error("Push subscription error:", err);
    }
  };

  return { subscribe };
}

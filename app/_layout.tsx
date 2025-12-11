// app/_layout.tsx
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StatusBar, BackHandler, ToastAndroid, Alert } from "react-native";
import * as Linking from "expo-linking";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import * as Notifications from "expo-notifications";

import { useLinkStore } from "../lib/store";
import { extractDomain, isParsableUrlOrDomain } from "../lib/utils";
import { ThemeProvider, defaultThemeProviderProps, useMaterialYouTheme } from "../lib/theme";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function ShareIntentBridge() {
  const addLinkWithMeta = useLinkStore((s) => s.addLinkWithMeta);
  const shareAction = useLinkStore((s) => s.settings.shareAction);
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  const router = useRouter();

  useEffect(() => {
    if (!hasShareIntent) return;
    (async () => {
      try {
        const cand =
          shareIntent.webUrl ??
          (shareIntent.text && isParsableUrlOrDomain(shareIntent.text) ? shareIntent.text : null);

        if (cand) {
           await addLinkWithMeta(cand, shareIntent.meta?.title ?? null, { lockTitle: false });

           if (shareAction === 'notification') {
             // Show notification
             const { status } = await Notifications.getPermissionsAsync();
             if (status === 'granted') {
                 await Notifications.scheduleNotificationAsync({
                   content: {
                     title: "Link saved",
                     body: cand,
                   },
                   trigger: null, // immediate
                 });
             } else {
                 // Fallback if no permission
                 if (Platform.OS === 'android') {
                     ToastAndroid.show('Link saved', ToastAndroid.SHORT);
                 } else {
                     Alert.alert("Link saved");
                 }
             }

             // Minimize/Close on Android
             if (Platform.OS === 'android') {
                 // Give a small delay for the notification to be processed/shown
                 setTimeout(() => {
                     BackHandler.exitApp();
                 }, 500);
             }
           } else {
             // Open (Navigate)
             const domain = extractDomain(cand);
             // Use replace to avoid stacking too many if reused
             router.replace({ pathname: "/domain/[name]", params: { name: domain } });
           }
        }
      } finally {
        resetShareIntent();
      }
    })();
  }, [hasShareIntent, shareIntent, addLinkWithMeta, resetShareIntent, shareAction, router]);

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      try {
        const parsed = Linking.parse(url);
        const u = parsed?.queryParams?.url ? String(parsed.queryParams.url) : "";
        if (parsed?.path === "add" && isParsableUrlOrDomain(u)) {
          await addLinkWithMeta(u, undefined, { lockTitle: false });
          // For deep links, we probably always want to navigate or at least refresh?
          // Defaulting to same behavior as share intent for consistency?
          // Or deep links are explicit user actions to open app, so maybe just open.
        }
      } catch (e) {
        console.warn("Deep link parse error:", e);
      }
    };
    Linking.getInitialURL().then((initial) => {
      if (initial) {
        handleUrl({ url: initial });
      }
    });
    const sub = Linking.addEventListener("url", handleUrl);
    return () => sub.remove();
  }, [addLinkWithMeta]);

  useEffect(() => {
    if (error) console.warn("expo-share-intent error:", error);
  }, [error]);

  return null;
}

function WithStatusBar() {
  const theme = useMaterialYouTheme();
  return <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />;
}

function Root() {
    const themeSetting = useLinkStore(s => s.settings.theme);
    const themeColor = useLinkStore(s => s.settings.themeColor);

    const themeProps = {
        ...defaultThemeProviderProps,
        colorScheme: themeSetting === 'system' ? 'auto' : themeSetting,
        seedColor: themeColor === 'auto' ? 'auto' : themeColor,
    } as const;

    console.log("Root re-render. Theme Setting:", themeSetting, "Theme Color:", themeColor);

    return (
        <ThemeProvider {...themeProps}>
          <WithStatusBar />
          <ShareIntentProvider>
            <ShareIntentBridge />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: "transparent" },
                headerTintColor: undefined,
                contentStyle: { backgroundColor: "transparent" },
                animation: Platform.select({ ios: "default", android: "slide_from_right" }),
                header: () => null,
              }}
            >
              <Stack.Screen name="index" options={{ title: "Domains" }} />
              <Stack.Screen
                name="domain/[name]"
                options={({ route }: any) => ({ title: route?.params?.name ?? "Links" })}
              />
               <Stack.Screen
                name="settings"
                options={{
                    title: "Settings",
                    presentation: Platform.OS === 'web' ? 'card' : 'modal'
                }}
              />
            </Stack>
          </ShareIntentProvider>
        </ThemeProvider>
      );
}

export default function RootLayout() {
    // We need to access store inside, so we need a component that is child of nothing?
    // Actually store is external, so we can use it.
    // However, store is not a provider, it's a hook.
    // So we can just use `useLinkStore` here.
    return <Root />;
}

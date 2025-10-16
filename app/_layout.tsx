// app/_layout.tsx
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import * as Linking from "expo-linking";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";

import { useLinkStore } from "../lib/store";
import { isParsableUrlOrDomain } from "../lib/utils";
import { ThemeProvider, defaultThemeProviderProps, useMaterialYouTheme } from "../lib/theme";

function ShareIntentBridge() {
  const addLinkWithMeta = useLinkStore((s) => s.addLinkWithMeta);
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();

  useEffect(() => {
    if (!hasShareIntent) return;
    (async () => {
      try {
        const cand =
          shareIntent.webUrl ??
          (shareIntent.text && isParsableUrlOrDomain(shareIntent.text) ? shareIntent.text : null);
        if (cand) await addLinkWithMeta(cand, shareIntent.meta?.title ?? null, { lockTitle: false });
      } finally {
        resetShareIntent();
      }
    })();
  }, [hasShareIntent, shareIntent, addLinkWithMeta, resetShareIntent]);

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      try {
        const parsed = Linking.parse(url);
        const u = parsed?.queryParams?.url ? String(parsed.queryParams.url) : "";
        if (parsed?.path === "add" && isParsableUrlOrDomain(u)) {
          await addLinkWithMeta(u, undefined, { lockTitle: false });
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

export default function RootLayout() {
  return (
    <ThemeProvider {...defaultThemeProviderProps}>
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
        </Stack>
      </ShareIntentProvider>
    </ThemeProvider>
  );
}

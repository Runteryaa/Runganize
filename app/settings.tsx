import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLinkStore } from "../lib/store";
import { useMaterialYouTheme } from "../lib/theme";

export default function SettingsScreen() {
  const t = useMaterialYouTheme();
  const router = useRouter();
  const settings = useLinkStore((s) => s.settings);
  const updateSettings = useLinkStore((s) => s.updateSettings);

  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={{
        color: t.primary,
        fontSize: 14,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 24,
        paddingHorizontal: 16,
      }}
    >
      {title}
    </Text>
  );

  const RadioOption = <T extends string>({
    label,
    value,
    current,
    onSelect,
  }: {
    label: string;
    value: T;
    current: T;
    onSelect: (v: T) => void;
  }) => {
    const isSelected = value === current;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(value)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: t.surface,
          borderBottomWidth: 1,
          borderBottomColor: t.divider,
        }}
      >
        <Text style={{ color: t.onSurface, fontSize: 16 }}>{label}</Text>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: isSelected ? t.primary : t.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: t.primary,
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const ColorOption = ({ color, selected, onSelect }: { color: string, selected: boolean, onSelect: () => void }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onSelect}
        accessibilityLabel={color === 'auto' ? 'Auto Color' : `Color ${color}`}
        style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: color === 'auto' ? t.surfaceVariant : color,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: selected ? 3 : 1,
            borderColor: selected ? t.onSurface : t.outline,
        }}
      >
          {color === 'auto' && (
              <Text style={{ fontSize: 20 }}>🎨</Text>
          )}
          {selected && (
               <Text style={{ color: color === 'auto' ? t.onSurface : '#fff', fontWeight: 'bold' }}>✓</Text>
          )}
      </TouchableOpacity>
  );

  const colors = [
      { label: "Wallpaper", value: "auto" },
      { label: "Blue", value: "#3b82f6" },
      { label: "Green", value: "#22c55e" },
      { label: "Purple", value: "#a855f7" },
      { label: "Orange", value: "#f97316" },
      { label: "Pink", value: "#ec4899" },
      { label: "Red", value: "#ef4444" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['bottom', 'left', 'right']}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: t.surface,
          borderBottomWidth: 1,
          borderBottomColor: t.divider,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 24, color: t.onSurface }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: t.onSurface }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        <SectionHeader title="Theme" />
        <View style={{ backgroundColor: t.surface }}>
            <RadioOption
              label="System Default"
              value="system"
              current={settings.theme}
              onSelect={(v) => updateSettings({ theme: v })}
            />
            <RadioOption
              label="Light"
              value="light"
              current={settings.theme}
              onSelect={(v) => updateSettings({ theme: v })}
            />
            <RadioOption
              label="Dark"
              value="dark"
              current={settings.theme}
              onSelect={(v) => updateSettings({ theme: v })}
            />
        </View>

        <SectionHeader title="Theme Color" />
        <View style={{ backgroundColor: t.surface, padding: 16 }}>
            <Text style={{ color: t.muted, marginBottom: 12 }}>
                Pick a seed color for Material You. "Wallpaper" uses system colors (Android 12+).
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {colors.map(c => (
                    <ColorOption
                        key={c.value}
                        color={c.value}
                        selected={settings.themeColor === c.value}
                        onSelect={() => updateSettings({ themeColor: c.value })}
                    />
                ))}
            </View>
        </View>

        <SectionHeader title="Share Behavior" />
        <View style={{ backgroundColor: t.surface }}>
             <RadioOption
              label="Open App & Navigate"
              value="open"
              current={settings.shareAction}
              onSelect={(v) => updateSettings({ shareAction: v })}
            />
             <RadioOption
              label="Notification Only"
              value="notification"
              current={settings.shareAction}
              onSelect={(v) => updateSettings({ shareAction: v })}
            />
        </View>
        <Text style={{ padding: 16, color: t.muted, fontSize: 12 }}>
            &quot;Notification Only&quot; will still open the app briefly to process the link, but will show a notification instead of navigating to the link details.
        </Text>

        <SectionHeader title="About" />
        <View style={{ backgroundColor: t.surface, marginBottom: 20 }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://github.com/Runteryaa/Runganize')}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: t.divider,
                }}
            >
                <Text style={{ color: t.onSurface, fontSize: 16 }}>GitHub Repository</Text>
                <Text style={{ color: t.muted, fontSize: 16 }}>↗</Text>
            </TouchableOpacity>

            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL('https://buymeacoffee.com/runterya')}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                }}
            >
                <Text style={{ color: t.onSurface, fontSize: 16 }}>Buy Me a Coffee</Text>
                <Text style={{ color: t.muted, fontSize: 16 }}>↗</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// app/index.tsx
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLinkStore } from "../lib/store";
import { extractDomain, isParsableUrlOrDomain, normalizeUrl } from "../lib/utils";
import { useMaterialYouTheme } from "../lib/theme";

export default function IndexScreen() {
  const t = useMaterialYouTheme();
  const router = useRouter();
  const links = useLinkStore((s) => s.links);
  const addLinkWithMeta = useLinkStore((s) => s.addLinkWithMeta);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const searchTerm = search.trim().toLowerCase();

  const filteredLinks = useMemo(() => {
    if (!searchTerm) return links;
    return links.filter((l) => {
      const hay = `${l.domain} ${l.url} ${l.title ?? ""} ${l.description ?? ""}`.toLowerCase();
      return hay.includes(searchTerm);
    });
  }, [links, searchTerm]);

  const domains = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filteredLinks) map.set(l.domain, (map.get(l.domain) ?? 0) + 1);
    return Array.from(map.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => (b.count - a.count) || a.domain.localeCompare(b.domain));
  }, [filteredLinks]);

  async function handleAdd() {
    const raw = newUrl.trim();
    if (!raw || !isParsableUrlOrDomain(raw)) return;

    const normalized = normalizeUrl(raw);
    const title = newTitle.trim() || undefined;

    await addLinkWithMeta(normalized, title, { lockTitle: !!title });

    setShowAdd(false);
    setNewUrl("");
    setNewTitle("");

    const domain = extractDomain(normalized);
    router.push({ pathname: "/domain/[name]", params: { name: domain } });
  }

  const addEnabled = isParsableUrlOrDomain(newUrl);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ padding: 12, gap: 8, backgroundColor: t.surface }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: t.onSurface, fontSize: 20, fontWeight: "700" }}>Domains</Text>
          <Link href="/settings" asChild>
            <TouchableOpacity accessibilityLabel="Settings" style={{ padding: 8 }}>
              <Text style={{ fontSize: 20, color: t.onSurface }}>⚙️</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Search with clear (×) */}
        <View style={{ position: "relative" }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search (domain, title, description, url)…"
            placeholderTextColor={t.muted}
            autoCorrect={false}
            autoCapitalize="none"
            style={{
              backgroundColor: t.inputBg,
              color: t.onSurface,
              paddingHorizontal: 12,
              paddingVertical: 10,
              paddingRight: 40, // space for the clear button
              borderRadius: 10,
              borderWidth: 1,
              borderColor: t.inputBorder,
            }}
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch("")}
              accessibilityLabel="Clear search"
              hitSlop={10}
              style={{
                position: "absolute",
                right: 8,
                top: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: t.muted, fontSize: 16, fontWeight: "800" }}>×</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={domains}
        keyExtractor={(item) => item.domain}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.divider }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push({ pathname: "/domain/[name]", params: { name: item.domain } })
            }
            style={{ padding: 16 }}
          >
            <Text style={{ color: t.onBackground, fontSize: 16, fontWeight: "600" }}>
              {item.domain} <Text style={{ color: t.muted }}>({item.count})</Text>
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: t.muted }}>
              No links yet. Use the Share menu — or tap the + button to add manually.
            </Text>
          </View>
        }
      />

      {/* Floating + (primary) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setShowAdd(true)}
        style={{
          position: "absolute",
          right: 18,
          bottom: 24,
          backgroundColor: t.primary,
          borderRadius: 28,
          paddingHorizontal: 20,
          paddingVertical: 14,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Text style={{ color: t.onPrimary, fontSize: 20, fontWeight: "800" }}>＋</Text>
      </TouchableOpacity>

      {/* Add link modal */}
      <Modal transparent visible={showAdd} animationType="fade" onRequestClose={() => setShowAdd(false)}>
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}
          onPress={() => setShowAdd(false)}
        >
          {/* Sheet */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: t.surface, borderRadius: 12, padding: 16, gap: 10 }}
          >
            <Text style={{ color: t.onSurface, fontSize: 18, fontWeight: "700" }}>Add link</Text>

            <TextInput
              value={newUrl}
              onChangeText={setNewUrl}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://example.com/page… or example.com"
              placeholderTextColor={t.muted}
              style={{
                backgroundColor: t.inputBg,
                color: t.onSurface,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.inputBorder,
              }}
            />

            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              autoCorrect={false}
              autoCapitalize="none"
              placeholder="Optional title"
              placeholderTextColor={t.muted}
              style={{
                backgroundColor: t.inputBg,
                color: t.onSurface,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: t.inputBorder,
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
              {/* Ghost/secondary */}
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ padding: 10 }}>
                <Text style={{ color: t.muted }}>Cancel</Text>
              </TouchableOpacity>

              {/* Primary */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAdd}
                disabled={!addEnabled}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: addEnabled ? t.primary : t.surfaceVariant,
                  opacity: addEnabled ? 1 : 0.6,
                }}
              >
                <Text style={{ color: addEnabled ? t.onPrimary : t.onSurfaceVariant, fontWeight: "700" }}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

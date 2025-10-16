// app/domain/[name].tsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  View,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLinkStore } from "../../lib/store";
import { extractDomain, isParsableUrlOrDomain, normalizeUrl } from "../../lib/utils";
import { useMaterialYouTheme } from "../../lib/theme";

type EditingDraft = { url: string; title: string };

export default function DomainLinksScreen() {
  const t = useMaterialYouTheme();
  const { name } = useLocalSearchParams<{ name?: string | string[] }>();
  const routeName = Array.isArray(name) ? name[0] : name || "";
  const router = useRouter();

  const links = useLinkStore((s) => s.links);
  const updateLink = useLinkStore((s) => s.updateLink);
  const removeLink = useLinkStore((s) => s.removeLink);
  const refetchMeta = useLinkStore((s) => s.refetchMeta);

  const [search, setSearch] = useState("");
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [editForId, setEditForId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditingDraft>({ url: "", title: "" });

  const domainLinks = useMemo(() => {
    const all = links.filter((l) => l.domain === routeName);
    const q = search.trim().toLowerCase();
    const filtered = q
      ? all.filter((l) =>
          `${l.title ?? ""} ${l.description ?? ""} ${l.url}`.toLowerCase().includes(q)
        )
      : all;
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [links, routeName, search]);

  const openEdit = (id: string) => {
    const row = links.find((l) => l.id === id);
    if (!row) return;
    setDraft({ url: row.url, title: row.title ?? "" });
    setEditForId(id);
  };

  const saveEdit = () => {
    if (!editForId) return;
    const raw = draft.url.trim();
    if (!isParsableUrlOrDomain(raw)) return;

    const normalized = normalizeUrl(raw);
    const manualTitle = draft.title.trim();
    const newDomain = extractDomain(normalized);

    updateLink(editForId, {
      url: normalized,
      title: manualTitle || null,
      lockedTitle: !!manualTitle,
      domain: newDomain,
    });

    setEditForId(null);
    if (routeName !== newDomain) {
      router.push({ pathname: "/domain/[name]", params: { name: newDomain } });
    }
  };

  const saveEnabled = isParsableUrlOrDomain(draft.url);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ padding: 12, gap: 8, backgroundColor: t.surface }}>
        <Text style={{ color: t.onSurface, fontSize: 20, fontWeight: "700" }}>{routeName}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: t.outline,
            }}
          >
            <Text style={{ color: t.onSurface }}>← All domains</Text>
          </TouchableOpacity>
        </View>

        {/* Search with clear (×) */}
        <View style={{ position: "relative" }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search in this domain (title, description, url)…"
            placeholderTextColor={t.muted}
            autoCorrect={false}
            autoCapitalize="none"
            style={{
              backgroundColor: t.inputBg,
              color: t.onSurface,
              paddingHorizontal: 12,
              paddingVertical: 10,
              paddingRight: 40, // reserve space for the clear button
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
        data={domainLinks}
        keyExtractor={(l) => l.id}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.divider }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: t.surfaceVariant }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  backgroundColor: t.surfaceVariant,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: t.onSurfaceVariant, fontSize: 12 }}>No image</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={async () => {
                try {
                  await Linking.openURL(item.url);
                } catch {
                  Alert.alert("Invalid URL", item.url);
                }
              }}
              style={{ flex: 1 }}
            >
              <Text style={{ color: t.onBackground, fontSize: 15, fontWeight: "700" }} numberOfLines={2}>
                {item.title ?? item.url}
              </Text>
              {!!item.siteName && (
                <Text style={{ color: t.muted, marginTop: 2 }} numberOfLines={1}>
                  {item.siteName}
                </Text>
              )}
              {!!item.description && (
                <Text style={{ color: t.onSurface, marginTop: 4 }} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <Text style={{ color: t.muted, marginTop: 6, fontSize: 12 }} numberOfLines={1}>
                {item.url}
              </Text>
              <Text style={{ color: t.muted, marginTop: 6, fontSize: 10 }}>
                {`add: ${new Date(item.createdAt).toLocaleString()}`}
              </Text>
              <Text style={{ color: t.muted, marginTop: 0, fontSize: 10 }}>
                {item.lastMetaAt ? `meta: ${new Date(item.lastMetaAt).toLocaleString()}` : ""}
              </Text>
            </TouchableOpacity>

            {/* 3-dot trigger */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setMenuForId(item.id)}
              style={{ paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" }}
            >
              <Text style={{ color: t.onSurface, opacity: 0.7, fontSize: 20, lineHeight: 20 }}>⋯</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: t.muted }}>No links in this domain yet.</Text>
          </View>
        }
      />

      {/* Options menu */}
      <Modal transparent visible={!!menuForId} animationType="fade" onRequestClose={() => setMenuForId(null)}>
        <Pressable
          onPress={() => setMenuForId(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: t.surface, borderRadius: 12 }}>
            {[
              { label: "Edit", color: t.onSurface, onPress: () => menuForId && openEdit(menuForId) },
              { label: "Refresh meta", color: t.onSurface, onPress: () => menuForId && refetchMeta(menuForId) },
              { label: "Delete", color: t.error, onPress: () => menuForId && removeLink(menuForId) },
              { label: "Cancel", color: t.muted, onPress: () => {} },
            ].map((row, i) => (
              <Pressable
                key={row.label}
                onPress={() => { setMenuForId(null); setTimeout(row.onPress, 0); }}
                style={{ paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderColor: t.divider }}
              >
                <Text style={{ color: row.color, fontWeight: row.label === "Delete" ? "800" : "600" }}>
                  {row.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit modal */}
      <Modal transparent visible={!!editForId} animationType="fade" onRequestClose={() => setEditForId(null)}>
        {/* Backdrop */}
        <Pressable
          onPress={() => setEditForId(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}
        >
          {/* Sheet */}
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ backgroundColor: t.surface, borderRadius: 12, padding: 16, gap: 10 }}
          >
            <Text style={{ color: t.onSurface, fontSize: 18, fontWeight: "700" }}>Edit link</Text>

            <TextInput
              value={draft.url}
              onChangeText={(v) => setDraft((d) => ({ ...d, url: v }))}
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
              value={draft.title}
              onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
              autoCorrect={false}
              autoCapitalize="none"
              placeholder="Title (leave empty to use meta title)"
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
              <TouchableOpacity onPress={() => setEditForId(null)} style={{ padding: 10 }}>
                <Text style={{ color: t.muted }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={saveEdit}
                disabled={!saveEnabled}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: saveEnabled ? t.primary : t.surfaceVariant,
                  opacity: saveEnabled ? 1 : 0.6,
                }}
              >
                <Text style={{ color: saveEnabled ? t.onPrimary : t.onSurfaceVariant, fontWeight: "700" }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

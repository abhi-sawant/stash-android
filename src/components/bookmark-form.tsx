import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CollectionPicker } from '@/components/collection-picker';
import { useConfirm } from '@/components/confirm-dialog';
import { FormShell } from '@/components/form-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { downscaleImage } from '@/lib/image';
import { fetchUrlMetadata } from '@/lib/metadata';
import { useBookmarks } from '@/lib/context';
import { useColors } from '@/lib/theme';
import { toast } from '@/lib/toast';
import type { UrlMetadata } from '@/lib/types';
import { extractDomain, formatDate, getFaviconUrl, normalizeUrl } from '@/lib/utils';

export function BookmarkForm({
  id,
  initialUrl,
  initialCollection,
}: {
  id?: string;
  initialUrl?: string;
  initialCollection?: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const colors = useColors();
  const { bookmarks, addBookmark, updateBookmark, deleteBookmark } = useBookmarks();

  const isEditing = Boolean(id);
  const existing = id ? bookmarks.find((b) => b.id === id) : undefined;

  const [url, setUrl] = useState(existing?.url ?? initialUrl ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? '');
  const [collectionId, setCollectionId] = useState<string | null>(
    existing?.collectionId ?? initialCollection ?? null,
  );
  const [imageUri, setImageUri] = useState<string | undefined>(existing?.imageUri);
  const [faviconUri, setFaviconUri] = useState<string | undefined>(existing?.faviconUri);
  const [imageFailed, setImageFailed] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showCollectionError, setShowCollectionError] = useState(false);
  const didAutoFetch = useRef(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const applyMetadata = (meta: UrlMetadata) => {
    if (meta.title) setTitle((t) => t || meta.title);
    if (meta.description) setSubtitle((s) => s || meta.description);
    if (meta.imageUrl) {
      setImageUri(meta.imageUrl);
      setImageFailed(false);
    }
    if (meta.faviconUrl) setFaviconUri(meta.faviconUrl);
  };

  const handleFetch = async (raw?: string) => {
    const target = normalizeUrl(raw ?? url);
    if (!target) return;
    setUrl(target);
    setFetching(true);
    try {
      const meta = await fetchUrlMetadata(target);
      applyMetadata(meta);
      if (!meta.title && !meta.imageUrl) {
        toast.info('Could not auto-fetch details — enter them manually.');
      }
    } catch {
      toast.error('Could not fetch link details');
    } finally {
      setFetching(false);
    }
  };

  // Auto-fetch when a URL was passed in (e.g. shared link) on add.
  useEffect(() => {
    if (isEditing || didAutoFetch.current || !initialUrl) return;
    didAutoFetch.current = true;
    void handleFetch(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text);
        void handleFetch(text);
      }
    } catch {
      toast.error('Could not read the clipboard');
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Photo library permission is required');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled || !res.assets?.length) return;
    try {
      const downscaled = await downscaleImage(res.assets[0].uri);
      setImageUri(downscaled);
      setImageFailed(false);
    } catch {
      toast.error('Could not load that image');
    }
  };

  const canSave = Boolean(url.trim()) && (isEditing || Boolean(collectionId));

  const handleSave = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      toast.error('Please enter a valid URL');
      return;
    }
    if (!isEditing && !collectionId) {
      setShowCollectionError(true);
      toast.error('Please select a collection');
      return;
    }

    if (isEditing && existing) {
      updateBookmark({
        id: existing.id,
        url: normalized,
        title: title.trim() || normalized,
        subtitle: subtitle.trim(),
        collectionId: collectionId ?? undefined,
        imageUri,
      });
      toast.success('Bookmark updated');
    } else {
      addBookmark({
        url: normalized,
        title: title.trim() || normalized,
        subtitle: subtitle.trim(),
        collectionId: collectionId ?? undefined,
        imageUri,
        faviconUri: faviconUri || getFaviconUrl(normalized),
      });
      toast.success('Bookmark saved');
    }
    goBack();
  };

  const handleDelete = async () => {
    if (!existing) return;
    const ok = await confirm({
      title: 'Delete bookmark',
      description: `Delete "${existing.title || existing.url}"? This cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      deleteBookmark(existing.id);
      toast.success('Bookmark deleted');
      goBack();
    }
  };

  return (
    <FormShell
      title={isEditing ? 'Edit bookmark' : 'Add bookmark'}
      onClose={goBack}
      saveLabel="Save"
      onSave={handleSave}
      saveDisabled={!canSave}>
      {/* Quick actions (edit only) */}
      {isEditing && existing ? (
        <View className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            <Button variant="destructive" size="sm" title="Delete" onPress={handleDelete} />
          </View>
          <View className="flex-row items-center gap-3 rounded-xl bg-muted p-3">
            {faviconUri ? (
              <Image source={{ uri: faviconUri }} style={{ width: 24, height: 24, borderRadius: 5 }} />
            ) : (
              <View className="h-6 w-6 items-center justify-center rounded bg-border">
                <Ionicons name="link" size={14} color={colors.mutedForeground} />
              </View>
            )}
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-sm text-muted-foreground">
                {extractDomain(existing.url)}
              </Text>
              <Text className="text-xs text-muted-foreground">Saved {formatDate(existing.createdAt)}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* URL */}
      <View>
        <Label>URL</Label>
        <View className="h-11 flex-row items-center gap-1.5 rounded-lg border border-input bg-card pl-3 pr-1.5">
          <Ionicons name="link" size={16} color={colors.mutedForeground} />
          <Input
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={() => handleFetch()}
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className="flex-1 border-0 bg-transparent px-0"
          />
          <Pressable onPress={handlePaste} hitSlop={6} className="h-8 w-8 items-center justify-center">
            <Ionicons name="clipboard-outline" size={18} color={colors.mutedForeground} />
          </Pressable>
          <Button
            variant="secondary"
            size="sm"
            title={fetching ? undefined : 'Fetch'}
            loading={fetching}
            disabled={!url.trim()}
            onPress={() => handleFetch()}
          />
        </View>
      </View>

      {/* Image */}
      {imageUri && !imageFailed ? (
        <View className="overflow-hidden rounded-xl border border-border">
          <Pressable onPress={pickImage}>
            <Image
              source={{ uri: imageUri }}
              onError={() => setImageFailed(true)}
              contentFit="cover"
              style={{ width: '100%', aspectRatio: 16 / 9 }}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              setImageUri(undefined);
              setImageFailed(false);
            }}
            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-black/60">
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pickImage}
          className="h-24 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted">
          <Ionicons name="image-outline" size={24} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground">
            {imageFailed ? 'Preview unavailable — tap to add a custom image' : 'Add custom image (optional)'}
          </Text>
        </Pressable>
      )}

      {/* Title */}
      <View>
        <Label>Title</Label>
        <Input value={title} onChangeText={setTitle} placeholder="Bookmark title" />
      </View>

      {/* Description */}
      <View>
        <Label>Description{!isEditing ? '  (optional)' : ''}</Label>
        <Textarea value={subtitle} onChangeText={setSubtitle} placeholder="Add a short description…" />
      </View>

      {/* Collection */}
      <View>
        <Label>Collection</Label>
        <CollectionPicker
          value={collectionId}
          onChange={(v) => {
            setCollectionId(v);
            setShowCollectionError(false);
          }}
          allowNone={isEditing}
          invalid={showCollectionError}
        />
      </View>
    </FormShell>
  );
}

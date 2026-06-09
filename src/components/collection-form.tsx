import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useConfirm } from '@/components/confirm-dialog';
import { FormShell } from '@/components/form-shell';
import { ColorPicker, IconPicker } from '@/components/pickers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { COLLECTION_COLORS, COLLECTION_ICONS } from '@/lib/collections';
import { useBookmarks } from '@/lib/context';
import { toast } from '@/lib/toast';

export function CollectionForm({ id }: { id?: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { collections, addCollection, updateCollection, deleteCollection } = useBookmarks();

  const isEditing = Boolean(id);
  const existing = id ? collections.find((c) => c.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState<string>(existing?.color ?? COLLECTION_COLORS[0]);
  const [icon, setIcon] = useState<string>(existing?.icon ?? COLLECTION_ICONS[0]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/collections');
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (isEditing && existing) {
      updateCollection({ id: existing.id, name: name.trim(), color, icon });
      toast.success('Collection updated');
    } else {
      addCollection({ name: name.trim(), color, icon });
      toast.success('Collection created');
    }
    goBack();
  };

  const handleDelete = async () => {
    if (!existing) return;
    const ok = await confirm({
      title: 'Delete collection',
      description: `Delete "${existing.name}"? Bookmarks in it will be kept but unassigned.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      deleteCollection(existing.id);
      toast.success('Collection deleted');
      goBack();
    }
  };

  return (
    <FormShell
      title={isEditing ? 'Edit collection' : 'New collection'}
      onClose={goBack}
      saveLabel="Save"
      onSave={handleSave}
      saveDisabled={!name.trim()}>
      <View>
        <Label>Name</Label>
        <Input value={name} onChangeText={setName} placeholder="e.g. Reading list" autoFocus />
      </View>
      <View>
        <Label>Color</Label>
        <ColorPicker value={color} onChange={setColor} />
      </View>
      <View>
        <Label>Icon</Label>
        <IconPicker value={icon} color={color} onChange={setIcon} />
      </View>
      {isEditing ? (
        <Button variant="destructive" title="Delete collection" onPress={handleDelete} className="mt-2" />
      ) : null}
    </FormShell>
  );
}

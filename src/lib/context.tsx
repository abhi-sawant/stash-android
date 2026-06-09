import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { api } from './api';
import { getAuthToken } from './auth-storage';
import {
  defaultSettings,
  loadBookmarks,
  loadCollections,
  loadSettings,
  saveBookmarks,
  saveCollections,
  saveSettings,
} from './storage';
import { syncThumbnails, uploadData } from './sync';
import type { AppSettings, Bookmark, Collection } from './types';
import { generateId } from './utils';

// ── State ──────────────────────────────────────────────────────────────────
interface State {
  bookmarks: Bookmark[];
  collections: Collection[];
  settings: AppSettings;
  loading: boolean;
}

const initialState: State = {
  bookmarks: [],
  collections: [],
  settings: defaultSettings,
  loading: true,
};

// ── Actions ────────────────────────────────────────────────────────────────
type Action =
  | { type: 'LOAD'; payload: Omit<State, 'loading'> }
  | { type: 'ADD_BOOKMARK'; payload: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_BOOKMARK'; payload: Partial<Bookmark> & { id: string } }
  | { type: 'DELETE_BOOKMARK'; payload: string }
  | { type: 'ADD_COLLECTION'; payload: Omit<Collection, 'createdAt'> }
  | { type: 'UPDATE_COLLECTION'; payload: Partial<Collection> & { id: string } }
  | { type: 'DELETE_COLLECTION'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESTORE'; payload: { bookmarks: Bookmark[]; collections: Collection[]; settings: AppSettings } };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload, loading: false };

    case 'ADD_BOOKMARK': {
      const now = Date.now();
      const bookmark: Bookmark = { id: generateId(), createdAt: now, updatedAt: now, ...action.payload };
      return { ...state, bookmarks: [bookmark, ...state.bookmarks] };
    }

    case 'UPDATE_BOOKMARK': {
      const bookmarks = state.bookmarks.map((b) =>
        b.id === action.payload.id ? { ...b, ...action.payload, updatedAt: Date.now() } : b,
      );
      return { ...state, bookmarks };
    }

    case 'DELETE_BOOKMARK':
      return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== action.payload) };

    case 'ADD_COLLECTION': {
      const collection: Collection = { createdAt: Date.now(), ...action.payload };
      return { ...state, collections: [...state.collections, collection] };
    }

    case 'UPDATE_COLLECTION': {
      const collections = state.collections.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload } : c,
      );
      return { ...state, collections };
    }

    case 'DELETE_COLLECTION': {
      const collections = state.collections.filter((c) => c.id !== action.payload);
      const bookmarks = state.bookmarks.map((b) =>
        b.collectionId === action.payload ? { ...b, collectionId: undefined } : b,
      );
      return { ...state, collections, bookmarks };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'RESTORE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────────────
interface BookmarksContextValue extends State {
  addBookmark: (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBookmark: (data: Partial<Bookmark> & { id: string }) => void;
  deleteBookmark: (id: string) => void;
  addCollection: (data: Omit<Collection, 'id' | 'createdAt'>) => string;
  updateCollection: (data: Partial<Collection> & { id: string }) => void;
  deleteCollection: (id: string) => void;
  updateSettings: (data: Partial<AppSettings>) => void;
  restore: (data: { bookmarks: Bookmark[]; collections: Collection[]; settings: AppSettings }) => void;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const stateRef = useRef(state);
  const uploadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load data on mount (async — AsyncStorage)
  useEffect(() => {
    let active = true;
    Promise.all([loadBookmarks(), loadCollections(), loadSettings()]).then(
      ([bookmarks, collections, settings]) => {
        if (active) dispatch({ type: 'LOAD', payload: { bookmarks, collections, settings } });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  // Persist whenever data changes
  useEffect(() => {
    if (!state.loading) void saveBookmarks(state.bookmarks);
  }, [state.bookmarks, state.loading]);

  useEffect(() => {
    if (!state.loading) void saveCollections(state.collections);
  }, [state.collections, state.loading]);

  useEffect(() => {
    if (!state.loading) void saveSettings(state.settings);
  }, [state.settings, state.loading]);

  useEffect(
    () => () => {
      if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
    },
    [],
  );

  /** Debounced upload: waits 3s after the last mutation before pushing to the server. */
  const scheduleUpload = useCallback(() => {
    if (uploadTimerRef.current) clearTimeout(uploadTimerRef.current);
    uploadTimerRef.current = setTimeout(async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const data = {
          bookmarks: stateRef.current.bookmarks,
          collections: stateRef.current.collections,
          settings: stateRef.current.settings,
        };
        await uploadData(data);
        // Replace local file URIs with the permanent server URLs
        const updates = await syncThumbnails(stateRef.current.bookmarks);
        for (const [id, imageUri] of updates) {
          dispatch({ type: 'UPDATE_BOOKMARK', payload: { id, imageUri } });
        }
      } catch {
        // Ignore upload errors — background sync retries on next focus
      }
    }, 3000);
  }, []);

  const addBookmark = useCallback(
    (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
      dispatch({ type: 'ADD_BOOKMARK', payload: data });
      scheduleUpload();
    },
    [scheduleUpload],
  );

  const updateBookmark = useCallback(
    (data: Partial<Bookmark> & { id: string }) => {
      dispatch({ type: 'UPDATE_BOOKMARK', payload: data });
      scheduleUpload();
    },
    [scheduleUpload],
  );

  const deleteBookmark = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_BOOKMARK', payload: id });
      if (getAuthToken()) api.thumbnails.delete([id]).catch(() => {});
      scheduleUpload();
    },
    [scheduleUpload],
  );

  const addCollection = useCallback(
    (data: Omit<Collection, 'id' | 'createdAt'>) => {
      const id = generateId();
      dispatch({ type: 'ADD_COLLECTION', payload: { ...data, id } });
      scheduleUpload();
      return id;
    },
    [scheduleUpload],
  );

  const updateCollection = useCallback(
    (data: Partial<Collection> & { id: string }) => {
      dispatch({ type: 'UPDATE_COLLECTION', payload: data });
      scheduleUpload();
    },
    [scheduleUpload],
  );

  const deleteCollection = useCallback(
    (id: string) => {
      dispatch({ type: 'DELETE_COLLECTION', payload: id });
      scheduleUpload();
    },
    [scheduleUpload],
  );

  const updateSettings = useCallback(
    (data: Partial<AppSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: data });
      scheduleUpload();
    },
    [scheduleUpload],
  );

  const restore = useCallback(
    (data: { bookmarks: Bookmark[]; collections: Collection[]; settings: AppSettings }) => {
      dispatch({ type: 'RESTORE', payload: data });
    },
    [],
  );

  return (
    <BookmarksContext.Provider
      value={{
        ...state,
        addBookmark,
        updateBookmark,
        deleteBookmark,
        addCollection,
        updateCollection,
        deleteCollection,
        updateSettings,
        restore,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarksProvider');
  return ctx;
}

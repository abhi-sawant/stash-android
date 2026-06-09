import { useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { extractDomain, getFaviconUrl } from './utils';
import { fetchUrlMetadata, resolveImageUrl } from './metadata';
import type { UrlMetadata } from './types';

// Injected after page load — queries all standard metadata sources from the live DOM.
const EXTRACT_METADATA_JS = `
(function() {
  try {
    function get(selector, attr) {
      var el = document.querySelector(selector);
      return el ? (el.getAttribute(attr) || '') : '';
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({
      title:
        get('meta[property="og:title"]', 'content') ||
        get('meta[name="twitter:title"]', 'content') ||
        document.title || '',
      description:
        get('meta[property="og:description"]', 'content') ||
        get('meta[name="description"]', 'content') ||
        get('meta[name="twitter:description"]', 'content') || '',
      imageUrl:
        get('meta[property="og:image"]', 'content') ||
        get('meta[name="twitter:image"]', 'content') || '',
      pageUrl: window.location.href,
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ error: String(e) }));
  }
})();
true;
`;

type Pending = {
  resolve: (meta: UrlMetadata) => void;
  reject: (err: Error) => void;
  url: string;
  timer: ReturnType<typeof setTimeout>;
};

export type MetadataWebViewRef = {
  fetchMetadata: (url: string) => Promise<UrlMetadata>;
};

export function MetadataWebView({ ref }: { ref?: React.Ref<MetadataWebViewRef> }) {
  const webViewRef = useRef<WebView>(null);
  const pendingRef = useRef<Pending | null>(null);
  const [source, setSource] = useState({ uri: 'about:blank' });

  useImperativeHandle(
    ref,
    () => ({
      fetchMetadata(url: string): Promise<UrlMetadata> {
        return new Promise((resolve, reject) => {
          // Cancel any in-flight request before starting a new one.
          if (pendingRef.current) {
            clearTimeout(pendingRef.current.timer);
            pendingRef.current.reject(new Error('Superseded'));
          }
          // Safety-net timeout — falls back to the fetch-based path.
          const timer = setTimeout(() => {
            pendingRef.current = null;
            void fetchUrlMetadata(url).then(resolve).catch(reject);
          }, 12000);
          pendingRef.current = { resolve, reject, url, timer };
          setSource({ uri: url });
        });
      },
    }),
    [],
  );

  function handleLoadEnd() {
    if (!pendingRef.current) return;
    webViewRef.current?.injectJavaScript(EXTRACT_METADATA_JS);
  }

  function handleMessage(event: WebViewMessageEvent) {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;

    let data: { title?: string; description?: string; imageUrl?: string; pageUrl?: string; error?: string };
    try {
      data = JSON.parse(event.nativeEvent.data);
    } catch {
      void fetchUrlMetadata(pending.url).then(pending.resolve).catch(pending.reject);
      return;
    }

    if (data.error) {
      void fetchUrlMetadata(pending.url).then(pending.resolve).catch(pending.reject);
      return;
    }

    const pageUrl = data.pageUrl || pending.url;
    const rawImage = data.imageUrl || '';
    pending.resolve({
      title: data.title || extractDomain(pending.url),
      description: data.description || '',
      imageUrl: rawImage ? resolveImageUrl(rawImage, pageUrl) || undefined : undefined,
      faviconUrl: getFaviconUrl(pending.url),
    });
  }

  function handleError() {
    const pending = pendingRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingRef.current = null;
    void fetchUrlMetadata(pending.url).then(pending.resolve).catch(pending.reject);
  }

  return (
    <WebView
      ref={webViewRef}
      style={styles.hidden}
      source={source}
      onLoadEnd={handleLoadEnd}
      onMessage={handleMessage}
      onError={handleError}
      onHttpError={handleError}
      javaScriptEnabled
      mediaPlaybackRequiresUserAction
    />
  );
}

// Positioned off-screen with a 1×1 size — zero-size WebViews may not render
// page content reliably on Android.
const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 1,
    height: 1,
  },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, BackHandler, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// The app is a native shell around the Investraders web app.
const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://www.investraders.net';
const START_URL = `${WEB_APP_URL}${WEB_APP_URL.includes('?') ? '&' : '?'}isMobileApp=true`;

// Hosts that may load inside the app. Anything else (partner sites, video calls,
// documents) opens in the phone's browser, so a link can never take over the shell.
const hostOf = (url) => {
  const match = /^https?:\/\/([^/?#:]+)/i.exec(url || '');
  return match ? match[1].toLowerCase() : '';
};
const APP_HOST = hostOf(WEB_APP_URL).replace(/^www\./, '');
const IN_APP_HOST_SUFFIXES = [APP_HOST, 'supabase.co', 'accounts.google.com'];
const staysInApp = (url) => {
  if (!url || url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) return true;
  const host = hostOf(url);
  return Boolean(host) && IN_APP_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
};

export default function App() {
  const [errorOccurred, setErrorOccurred] = useState(false);
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  const handleRetry = () => {
    setErrorOccurred(false);
    if (webViewRef.current) webViewRef.current.reload();
  };

  const handleNavigationRequest = useCallback((request) => {
    const { url } = request;
    if (staysInApp(url)) return true;
    // tel:, mailto:, whatsapp:, maps and every external website are handed to the system.
    Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <WebView
        ref={webViewRef}
        source={{ uri: START_URL }}
        // Full user-agent override (as shipped so far): the web app detects the shell by
        // this name, and Google sign-in refuses the default embedded-WebView user agent.
        userAgent="InvestradersMobileApp/1.0"
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        startInLoadingState
        allowsInlineMediaPlayback
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        setSupportMultipleWindows={false}
        mixedContentMode="never"
        originWhitelist={['https://*', 'about:*', 'blob:*', 'data:*']}
        onShouldStartLoadWithRequest={handleNavigationRequest}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onLoadStart={() => setErrorOccurred(false)}
        onError={(syntheticEvent) => {
          console.warn('WebView error: ', syntheticEvent.nativeEvent);
          setErrorOccurred(true);
        }}
        onHttpError={(syntheticEvent) => {
          // Only a failing main document is an outage; a 404 on an image is not.
          const { statusCode, url } = syntheticEvent.nativeEvent;
          if (statusCode >= 500 && hostOf(url).replace(/^www\./, '') === APP_HOST) setErrorOccurred(true);
        }}
        onRenderProcessGone={() => webViewRef.current && webViewRef.current.reload()}
        onContentProcessDidTerminate={() => webViewRef.current && webViewRef.current.reload()}
        renderLoading={() => (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        )}
        renderError={() => <View style={styles.overlay} />}
      />

      {errorOccurred && (
        <View style={styles.overlay}>
          <Text style={styles.errorTitle}>No connection</Text>
          <Text style={styles.errorText}>
            Investraders could not be reached.{'\n'}Check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} accessibilityRole="button">
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Matches the web app's top bar so the status-bar area blends into it.
  container: {
    flex: 1,
    backgroundColor: '#2563eb',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, BackHandler, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// Default to live production domain
const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://www.investraders.net';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const handleRetry = () => {
    setErrorOccurred(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <WebView
        ref={webViewRef}
        source={{ uri: `${WEB_APP_URL}${WEB_APP_URL.includes('?') ? '&' : '?'}isMobileApp=true` }}
        userAgent="InvestradersMobileApp/1.0"
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        allowFileAccess={true}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onLoadStart={() => {
          setLoading(true);
          setErrorOccurred(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setErrorOccurred(true);
          setLoading(false);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        )}
        renderError={() => (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorText}>
              Unable to connect to Investraders server.{'\n'}
              Please check your internet connection and try again.
            </Text>
            <Text style={styles.errorSubtext}>Target: {WEB_APP_URL}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>🔄 Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030914',
  },
  webview: {
    flex: 1,
    backgroundColor: '#030914',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030914',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030914',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#38bdf8',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retryButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Alert, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Device, ScanResult } from './src/types';
import { pickAndParseExcel } from './src/utils/file';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { SettingsScreen, loadSettings, Settings, DEFAULT_SETTINGS } from './src/screens/SettingsScreen';

type Screen = 'HOME' | 'INVENTORY' | 'SETTINGS';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [devices, setDevices] = useState<Device[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);

  // Changed from Set<number> to Record<number, ScanResult>
  const [scanResults, setScanResults] = useState<Record<number, ScanResult>>({});

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);


  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (currentScreen === 'SETTINGS') {
        setCurrentScreen('INVENTORY');
        return true;
      }
      if (currentScreen === 'INVENTORY') {
        setCurrentScreen('HOME');
        return true;
      }
      return false; // HOME: Exit app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription.remove();
  }, [currentScreen]);

  const handleImport = async () => {
    const result = await pickAndParseExcel();
    if (result) {
      setDevices(result.devices);
      setFileName(result.name);
      setFileUri(result.uri);
      setScanResults({});
      setCurrentScreen('INVENTORY');
    }
  };

  const handleScanResult = (index: number, result: ScanResult) => {
    setScanResults(prev => ({
      ...prev,
      [index]: result
    }));
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'SETTINGS':
        return (
          <SettingsScreen
            initialSettings={settings}
            onSave={setSettings}
            onBack={() => setCurrentScreen('INVENTORY')}
          />
        );
      case 'INVENTORY':
        return (
          <InventoryScreen
            devices={devices}
            fileName={fileName || ""}
            fileUri={fileUri || ""}
            scannedResults={scanResults} // Passing correct prop
            onBack={() => setCurrentScreen('HOME')}
            settings={settings}
            onOpenSettings={() => setCurrentScreen('SETTINGS')}
            onScanResult={handleScanResult} // Passing correct handler
          />
        );
      case 'HOME':
        return (
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Computer<Text style={styles.orangeText}>Cruncher</Text> Mobile</Text>
            </View>

            <View style={styles.content}>
              <TouchableOpacity style={styles.button} onPress={handleImport}>
                <Text style={styles.buttonText}>Import Spreadsheet</Text>
              </TouchableOpacity>

              {devices.length > 0 && (
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setCurrentScreen('INVENTORY')}>
                  <Text style={styles.secondaryButtonText}>Resume Session</Text>
                  <Text style={styles.caption}>{devices.length} items loaded</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
    }
  };



  // ...

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" />
          {renderScreen()}
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 0,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: (StatusBar.currentHeight || 0) + 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  orangeText: {
    color: '#ea580c', // orange-600
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  content: {
    gap: 16,
  },
  button: {
    backgroundColor: '#ea580c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  }
});

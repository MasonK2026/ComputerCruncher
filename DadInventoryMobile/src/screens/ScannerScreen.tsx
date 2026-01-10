import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Dimensions } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { Device } from '../types';

interface ScannerScreenProps {
    onBack: () => void;
    onMatch: (index: number) => void;
    devices: Device[];
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ onBack, onMatch, devices }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        // Auto request on mount if not determined?
        if (!permission) requestPermission();
    }, [permission]);

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);

        // Attempt match
        try {
            const parsed = JSON.parse(data);
            // Assuming the QR contains at least "ASST ID" or similar unique key.
            // We need to match this against our devices list.
            // Let's match on ASST ID first.
            const assetId = parsed["ASST ID"];

            const index = devices.findIndex(d => String(d["ASST ID"]) === String(assetId));

            if (index !== -1) {
                onMatch(index);
                // Alert handled by parent? or show overlay here?
                setTimeout(() => setScanned(false), 2000); // 2 sec delay before next scan
            } else {
                alert(`Item not found in current inventory list.\nScanned: ${assetId}`);
                setTimeout(() => setScanned(false), 2000);
            }
        } catch (e) {
            // Maybe it's not JSON?
            console.log("Scan parse error", e);
            // Simple string match?
            const index = devices.findIndex(d => String(d["ASST ID"]) === data);
            if (index !== -1) {
                onMatch(index);
                setTimeout(() => setScanned(false), 2000);
            } else {
                alert("Invalid QR Format or Item Not Found");
                setTimeout(() => setScanned(false), 2000);
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Text style={styles.backText}>Close Scanner</Text>
                    </TouchableOpacity>

                    <View style={styles.targetBox} />

                    <Text style={styles.hintText}>Align QR code within the frame</Text>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
    },
    backText: {
        fontWeight: 'bold',
        color: '#ea580c',
    },
    targetBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#ea580c',
        backgroundColor: 'transparent',
        marginBottom: 20,
    },
    hintText: {
        color: 'white',
        fontSize: 16,
        marginTop: 20,
    }
});

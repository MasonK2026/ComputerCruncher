import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Switch, Vibration, LayoutAnimation, UIManager, Platform, Animated, ScrollView, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Device, ScanResult } from '../types';
import { exportToExcel, emailList } from '../utils/file';
import { Settings } from './SettingsScreen';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

// Sound Helper
const playSound = async (type: 'success' | 'error') => {
    try {
        const soundObject = new Audio.Sound();
        // Conceptually load sound files. User needs to add these files to assets/sounds/
        // For now, this is the implementation hook.
        // const source = type === 'success' 
        //    ? require('../../assets/sounds/success.mp3') 
        //    : require('../../assets/sounds/error.mp3');
        // await soundObject.loadAsync(source);
        // await soundObject.playAsync();
    } catch (error) {
        // console.log("Sound playback failed", error);
    }
};

interface InventoryScreenProps {
    devices: Device[];
    fileName: string;
    fileUri: string;
    scannedResults: Record<number, ScanResult>;
    onScanResult: (index: number, result: ScanResult | null) => void;
    onBack: () => void;
    settings: Settings;
    onOpenSettings: () => void;
}

const Toast = ({ message, type, visible }: { message: string, type: 'success' | 'error', visible: boolean }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        } else {
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }
    }, [visible]);

    if (!visible) return null; // Simplified visibility check, rely on opacity anim visually

    return (
        <Animated.View style={[
            styles.toast,
            type === 'error' ? styles.toastError : styles.toastSuccess,
            { opacity }
        ]}>
            <Text style={styles.toastText}>
                {type === 'success' ? "✓ " : "⚠ "}{message}
            </Text>
        </Animated.View>
    );
};


import { Swipeable } from 'react-native-gesture-handler';

// ... (existing imports)

const InventoryItem = ({
    item,
    result,
    isPending,
    visibleKeys,
    onVerify,
    onInvalid,
    onReset
}: {
    item: { device: Device, index: number },
    result?: ScanResult,
    isPending?: 'success' | 'error' | null,
    visibleKeys?: string[],
    onVerify: () => void,
    onInvalid: () => void,
    onReset: () => void
}) => {
    // ... (existing animations)
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let toValue = 0;
        if (isPending === 'success' || result?.status === 'valid') toValue = 1;
        if (isPending === 'error' || result?.status === 'invalid') toValue = -1;

        Animated.timing(colorAnim, {
            toValue,
            duration: 300,
            useNativeDriver: false, // color anim not supported on native driver
        }).start();
    }, [isPending, result]);

    const backgroundColor = colorAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['#fee2e2', '#ffffff', '#ecfdf5']
    });

    const borderColor = colorAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['#ef4444', 'transparent', '#10b981']
    });

    const borderWidth = (result || isPending) ? 1 : 0;

    // Default keys
    const keysToShow = (visibleKeys?.length ?? 0) > 0
        ? visibleKeys!
        : ["ASST ID", "MFR / MODEL", "SER #", "DESC"];

    // Swipe Actions
    // User said: "Slide Left to Verify" -> Typically means gesture left -> Reveals RIGHT side.
    const renderRightActions = (_progress: any, dragX: any) => {
        const trans = dragX.interpolate({
            inputRange: [0, 50, 100],
            outputRange: [0, 0, 0], // Static background
        });
        return (
            <View style={{ width: 80, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderRadius: 8, marginLeft: -10 }}>
                <Ionicons name="checkmark-circle" size={30} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Verify</Text>
            </View>
        );
    };

    // User said: "Slide Right to Invalid" -> Gesture right -> Reveals LEFT side.
    const renderLeftActions = (_progress: any, dragX: any) => {
        return (
            <View style={{ width: 80, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderRadius: 8, marginRight: -10 }}>
                <Ionicons name="alert-circle" size={30} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Invalid</Text>
            </View>
        );
    };

    return (
        <Swipeable
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
            onSwipeableOpen={(direction) => {
                if (direction === 'right') {
                    // Swiped Left (revealed Right)
                    onVerify();
                } else if (direction === 'left') {
                    // Swiped Right (revealed Left)
                    onInvalid();
                }
            }}
        >
            <Pressable onLongPress={onReset} delayLongPress={500} style={{ flex: 1 }}>
                <Animated.View style={[styles.card, { backgroundColor, borderColor, borderWidth }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.assetId}>{item.device["ASST ID"] || item.device[keysToShow[0]]}</Text>

                        {result?.status === 'valid' && <Text style={styles.statusBadge}>✓ Valid</Text>}
                        {result?.status === 'invalid' && <Text style={[styles.statusBadge, { color: '#ef4444' }]}>Invalid</Text>}
                    </View>

                    <View style={styles.detailsContainer}>
                        {keysToShow.map(key => {
                            if (key === "ASST ID") return null;
                            const val = item.device[key];
                            if (!val) return null;

                            return (
                                <Text key={key} style={styles.detailLine}>
                                    <Text style={styles.detailLabel}>{key}: </Text>
                                    <Text style={styles.detailValue}>{String(val)}</Text>
                                </Text>
                            );
                        })}
                    </View>

                    {result?.status === 'invalid' && result.mismatches && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorTitle}>Discrepancies:</Text>
                            {result.mismatches.map((m: string, i: number) => (
                                <Text key={i} style={styles.errorText}>{m}</Text>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </Pressable>
        </Swipeable>
    );
};


export const InventoryScreen: React.FC<InventoryScreenProps> = ({ devices, fileName, fileUri, scannedResults, onScanResult, onBack, settings, onOpenSettings }) => {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    // ... (rest of state stays same, skipping purely unmodified lines to keep context focus)
    const [permission, requestPermission] = useCameraPermissions();
    const [lastScannedTime, setLastScannedTime] = useState(0);

    // Collapsible States
    const [isProcessedExpanded, setIsProcessedExpanded] = useState(true);
    const [isTodoExpanded, setIsTodoExpanded] = useState(true);

    const [pendingSuccess, setPendingSuccess] = useState<number | null>(null);
    const [pendingError, setPendingError] = useState<number | null>(null);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const { todoList, processedList } = useMemo(() => {
        const todo: any[] = [];
        const processed: any[] = [];
        devices.forEach((device, index) => {
            const item = { device, index };
            if (scannedResults[index]) processed.push(item);
            else todo.push(item);
        });
        processed.sort((a, b) => scannedResults[b.index].timestamp - scannedResults[a.index].timestamp);
        return { todoList: todo, processedList: processed };
    }, [devices, scannedResults]);

    const total = devices.length;
    const scannedCount = Object.keys(scannedResults).length;
    const progress = total > 0 ? (scannedCount / total) * 100 : 0;

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        // ... (BarCode logic same)
        const now = Date.now();
        if (now - lastScannedTime < 2500) return;

        try {
            let scannedObj: any = {};
            try { scannedObj = JSON.parse(data); } catch { return; }

            const asstIdKey = "ASST ID";
            const deviceIndex = devices.findIndex(d => String(d[asstIdKey] || "").trim() === String(scannedObj[asstIdKey] || "").trim());

            if (deviceIndex !== -1) {
                if (scannedResults[deviceIndex]) {
                    setToast({ msg: "Already processed", type: 'success' });
                    return;
                }
                if (pendingSuccess === deviceIndex || pendingError === deviceIndex) return;

                const mismatchDetails: string[] = [];
                const allMatch = settings.matchingKeys.every(key => {
                    const scanVal = String(scannedObj[key] || "").trim();
                    const deviceVal = String(devices[deviceIndex][key] || "").trim();
                    const matches = scanVal.toLowerCase() === deviceVal.toLowerCase();
                    if (!matches) mismatchDetails.push(`${key}: "${deviceVal}" vs Scan "${scanVal}"`);
                    return matches;
                });

                setLastScannedTime(now);

                // Feedback
                if (allMatch) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    playSound('success');
                    setPendingSuccess(deviceIndex);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    playSound('error');
                    setPendingError(deviceIndex);
                }

                setTimeout(() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    onScanResult(deviceIndex, {
                        timestamp: now,
                        status: allMatch ? 'valid' : 'invalid',
                        mismatches: allMatch ? undefined : mismatchDetails
                    });
                    setToast({
                        msg: allMatch ? "Device Verified" : "Device Invalid - Check details",
                        type: allMatch ? 'success' : 'error'
                    });
                    setPendingSuccess(null);
                    setPendingError(null);
                }, 1000);

            }
        } catch (e) { console.error(e); }
    };

    const handleExport = () => {
        const missingCount = total - scannedCount;

        // Use updated export logic with fileUri
        const performExport = () => {
            exportToExcel(devices, scannedResults, fileUri, `scanned_${fileName}`);
        };

        const showOptions = () => {
            Alert.alert(
                "Export Options",
                "Choose export format",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Export Full Report", onPress: performExport },
                    { text: "Email Invalid/Mismatch List", onPress: () => emailList(devices, scannedResults) }
                ],
                { cancelable: true }
            );
        };

        if (missingCount > 0) {
            Alert.alert(
                "Incomplete Session",
                `You have ${missingCount} missing items. Do you want to export anyway or resume later?`,
                [
                    { text: "Export Later", style: "cancel" },
                    { text: "Export Anyway", style: "destructive", onPress: showOptions }
                ],
                { cancelable: true }
            );
        } else {
            showOptions();
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Progress Bar - Absolute */}
            <View style={styles.topProgressBarContainer}>
                <View style={[styles.topProgressBar, { width: `${progress}%` }]} />
            </View>

            {/* App Title in Deadspace */}
            <View style={styles.deadspaceTitleContainer}>
                <Text style={styles.appTitle}>Computer<Text style={styles.orangeText}>Cruncher</Text></Text>
            </View>

            {/* Navigation Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}><Ionicons name="arrow-back" size={24} color="#6b7280" /></TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{fileName}</Text>
                </View>
                <TouchableOpacity onPress={onOpenSettings}><Ionicons name="settings-outline" size={24} color="#ea580c" /></TouchableOpacity>
            </View>

            {isCameraOpen && (
                <View style={styles.cameraContainer}>
                    {permission?.granted ? (
                        <View style={{ flex: 1 }}>
                            <CameraView
                                style={styles.camera}
                                onBarcodeScanned={handleBarCodeScanned}
                                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                            />
                            <View style={styles.cameraOverlay}>
                                <TouchableOpacity onPress={() => setIsCameraOpen(false)} style={styles.closeCamBtn}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                                <View style={styles.targetBox} />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.centered}>
                            <TouchableOpacity onPress={requestPermission}><Text>Grant Camera</Text></TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Simple Toolbar */}
            <View style={styles.toolbar}>
                <Text style={styles.toolLabel}>{scannedCount} of {total} processed</Text>
                <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
                    <Text style={styles.exportText}>Export</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.listContent}>
                {/* TO DO SECTION */}
                <TouchableOpacity onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsTodoExpanded(!isTodoExpanded);
                }}
                    style={[styles.sectionHeader, styles.todoHeader]}
                >
                    <Text style={styles.sectionTitle}>To-Do ({todoList.length})</Text>
                    <Text style={styles.sectionIcon}>{isTodoExpanded ? "▼" : "▶"}</Text>
                </TouchableOpacity>

                {isTodoExpanded && todoList.map((wrapper) => (
                    <InventoryItem
                        key={wrapper.index}
                        item={wrapper}
                        isPending={pendingSuccess === wrapper.index ? 'success' : pendingError === wrapper.index ? 'error' : null}
                        visibleKeys={settings.visibleKeys}
                        onVerify={() => {
                            // Manual Verify
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            playSound('success');
                            onScanResult(wrapper.index, { timestamp: Date.now(), status: 'valid' });
                            setToast({ msg: "Manually Verified", type: 'success' });
                        }}
                        onInvalid={() => {
                            // Manual Invalid
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            playSound('error');
                            onScanResult(wrapper.index, { timestamp: Date.now(), status: 'invalid', mismatches: ["Marked Invalid Manually"] });
                            setToast({ msg: "Marked Invalid", type: 'error' });
                        }}
                        onReset={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            Alert.alert("Reset Item", "Move this item back to To-Do?", [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Reset", style: "destructive", onPress: () => {
                                        // Remove from scannedResults implies we need a way to UNSET it.
                                        // Current onScanResult updates index. If we pass null?
                                        // We need to modify InventoryScreen logic to allow removing.
                                        // For now, let's assume onScanResult accepts null or we add onResetItem cb.
                                        // Let's use a specific status 'reset' or allow parent to handle.
                                        // Actually, let's just use onScanResult with a special reset flag or handle it in parent.
                                        // Easier: create a specifc onResetItem prop in InventoryScreen.
                                        // But I can just pass null if I update the type in parent.
                                        // Let's try passing a special "RESET" object or handle it in the parent callback wrapper I am making here.
                                        // Wait, I am inside InventoryScreen render. I can just call setScanResults directly? 
                                        // No, better to expose a clean handler.
                                        // Let's implementation:
                                        // setScanResults(prev => { const n = {...prev}; delete n[wrapper.index]; return n; });
                                    }
                                }
                            ]);
                        }}
                    />
                ))}

                {/* PROCESSED SECTION */}
                <TouchableOpacity onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsProcessedExpanded(!isProcessedExpanded);
                }}
                    style={[styles.sectionHeader, styles.processedHeader]}
                >
                    <Text style={styles.sectionTitle}>Processed ({processedList.length})</Text>
                    <Text style={styles.sectionIcon}>{isProcessedExpanded ? "▼" : "▶"}</Text>
                </TouchableOpacity>

                {isProcessedExpanded && processedList.map((wrapper) => (
                    <InventoryItem
                        key={wrapper.index}
                        item={wrapper}
                        result={scannedResults[wrapper.index]}
                        visibleKeys={settings.visibleKeys}
                        onVerify={() => {
                            // Manual Verify (Re-verify)
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            playSound('success');
                            onScanResult(wrapper.index, { timestamp: Date.now(), status: 'valid' });
                            setToast({ msg: "Updated to Verified", type: 'success' });
                        }}
                        onInvalid={() => {
                            // Manual Invalid (Re-flag)
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            playSound('error');
                            onScanResult(wrapper.index, { timestamp: Date.now(), status: 'invalid', mismatches: ["Marked Invalid Manually"] });
                            setToast({ msg: "Updated to Invalid", type: 'error' });
                        }}
                        onReset={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            Alert.alert("Reset Item", "Move this item back to To-Do?", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Reset", style: "destructive", onPress: () => onScanResult(wrapper.index, null) }
                            ]);
                        }}
                    />
                ))}
            </ScrollView>

            {!isCameraOpen && (
                <TouchableOpacity style={styles.fab} onPress={() => setIsCameraOpen(true)}>
                    <Ionicons name="camera" size={32} color="white" />
                </TouchableOpacity>
            )}

            <Toast message={toast?.msg || ""} type={toast?.type || 'success'} visible={!!toast} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },

    // Top Progress Bar
    topProgressBarContainer: { width: '100%', height: 4, backgroundColor: '#e5e7eb', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
    topProgressBar: { height: '100%', backgroundColor: '#10b981', borderRadius: 2 },

    cameraContainer: { height: 400, backgroundColor: 'black', marginTop: 0 }, // Removed top margin, increased height
    camera: { flex: 1 },
    cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
    closeCamBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8, zIndex: 10 },
    closeCamText: { color: 'white', fontSize: 12 },
    targetBox: { width: 150, height: 150, borderWidth: 2, borderColor: '#ea580c', backgroundColor: 'transparent' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    deadspaceTitleContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 10, backgroundColor: 'transparent' },
    appTitleSmall: { fontSize: 14, fontWeight: '900', color: '#9ca3af', letterSpacing: 1 }, // "ComputerCruncher" watermark style

    // Actually, user wants "THE HEADER". I'll make it bold and visible.
    // App Title
    appTitle: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: 1 },
    orangeText: { color: '#ea580c' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 40, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    backLink: { color: '#6b7280', fontSize: 20 },
    actionLink: { color: '#ea580c', fontSize: 20 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontWeight: 'bold', fontSize: 16 },

    toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, paddingHorizontal: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    toolLabel: { color: '#374151', fontWeight: 'bold' },
    exportBtn: { backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    exportText: { color: '#374151', fontWeight: '500' },

    listContent: { padding: 16, paddingBottom: 100 },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    todoHeader: {
        backgroundColor: '#e0f2fe', // Light Blue for To-Do
        borderColor: '#bae6fd'
    },
    processedHeader: {
        backgroundColor: '#ecfdf5', // Light Green for Processed
        borderColor: '#a7f3d0',
        marginTop: 16
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
    sectionIcon: { fontSize: 16, color: '#6b7280' },

    card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, shadowColor: 'black', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 1 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, // Increased margin
    assetId: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
    statusBadge: { fontWeight: 'bold', color: '#059669', fontSize: 12 },

    detailsContainer: { gap: 4 },
    detailLine: { flexDirection: 'row', flexWrap: 'wrap' },
    detailLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
    detailValue: { color: '#374151', fontSize: 12 },

    errorBox: { marginTop: 12, backgroundColor: '#fff1f2', padding: 8, borderRadius: 4 },
    errorTitle: { color: '#9f1239', fontWeight: 'bold', fontSize: 12, marginBottom: 4 },
    errorText: { color: '#be123c', fontSize: 11, fontFamily: 'monospace' },

    fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#ea580c', padding: 16, borderRadius: 50, elevation: 5 },
    fabText: { color: 'white', fontWeight: 'bold', fontSize: 24 },

    toast: { position: 'absolute', bottom: 100, left: 20, right: 20, padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 10 },
    toastSuccess: { backgroundColor: '#059669' },
    toastError: { backgroundColor: '#dc2626' },
    toastText: { color: 'white', fontWeight: 'bold' },
});

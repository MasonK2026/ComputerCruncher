import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export const ALL_COLUMNS = [
    "ASST ID", "STK NBR", "MFR / MODEL", "SER #", "DESC", "QTY", "RM",
    "RM SUB", "POC", "Warranty Expiration", "Last Inventory",
    "Replacement notes", "Replacement Priority based on warranty expiration",
    "EQUIP TYPE", "Cost", "NOTES", "Computer Name"
];

const SETTINGS_KEY = 'dad_inventory_settings_v1';

export type Settings = {
    matchingKeys: string[];
    visibleKeys: string[];
};

export const DEFAULT_SETTINGS: Settings = {
    matchingKeys: ["ASST ID"],
    visibleKeys: ["ASST ID", "MFR / MODEL", "SER #", "DESC"]
};

interface SettingsScreenProps {
    onBack: () => void;
    onSave: (newSettings: Settings) => void;
    initialSettings: Settings;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onSave, initialSettings }) => {
    const [matchingKeys, setMatchingKeys] = useState<Set<string>>(new Set(initialSettings.matchingKeys));
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set(initialSettings.visibleKeys || DEFAULT_SETTINGS.visibleKeys));

    const toggleKey = (set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string, required: boolean) => {
        setter(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                if (required && next.size <= 1) {
                    Alert.alert("Required", "At least one matching criterion is required.");
                    return next;
                }
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    const handleSave = async () => {
        const newSettings: Settings = {
            matchingKeys: Array.from(matchingKeys),
            visibleKeys: Array.from(visibleKeys)
        };
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            onSave(newSettings);
            onBack();
        } catch (e) {
            Alert.alert("Error", "Failed to save settings");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.title}>Comparison Settings</Text>
                <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="checkmark" size={28} color="#ea580c" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.description}>
                    Select which columns to verify when scanning a QR code. The scanned data must match the spreadsheet row for ALL selected fields.
                </Text>

                <Text style={styles.sectionHeader}>Verification Columns (Must Match)</Text>
                {ALL_COLUMNS.map(col => (
                    <View key={`match-${col}`} style={styles.row}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.label}>{col}</Text>
                        </View>
                        <Switch
                            value={matchingKeys.has(col)}
                            onValueChange={() => toggleKey(matchingKeys, setMatchingKeys, col, true)}
                            trackColor={{ false: "#767577", true: "#ea580c" }}
                        />
                    </View>
                ))}

                <Text style={styles.sectionHeader}>Visible Columns (Card Display)</Text>
                {ALL_COLUMNS.map(col => (
                    <View key={`vis-${col}`} style={styles.row}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={styles.label}>{col}</Text>
                        </View>
                        <Switch
                            value={visibleKeys.has(col)}
                            onValueChange={() => toggleKey(visibleKeys, setVisibleKeys, col, false)}
                            trackColor={{ false: "#767577", true: "#10b981" }} // Green for visible
                        />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export const loadSettings = async (): Promise<Settings> => {
    try {
        const json = await AsyncStorage.getItem(SETTINGS_KEY);
        if (json != null) {
            const parsed = JSON.parse(json);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                visibleKeys: parsed.visibleKeys || DEFAULT_SETTINGS.visibleKeys // Ensure visibleKeys exists if migrating from old version
            };
        }
        return DEFAULT_SETTINGS;
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24, // Increased from 16 to avoid cutoff
        paddingTop: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backText: {
        color: '#6b7280',
        fontSize: 16,
        display: 'none' // hiding just in case
    },
    saveText: {
        color: '#ea580c',
        fontSize: 16,
        fontWeight: 'bold',
        display: 'none'
    },
    content: {
        flex: 1,
        padding: 16,
    },
    description: {
        color: '#6b7280',
        marginBottom: 20,
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        color: '#374151',
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6b7280',
        marginTop: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
    }
});

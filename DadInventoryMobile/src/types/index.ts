export interface Device {
    "ASST ID": number | string;
    "STK NBR": string;
    "MFR / MODEL": string;
    "SER #": string;
    "DESC": string;
    "QTY": number;
    "RM": string | null;
    "RM SUB": string | null;
    "POC": string | null;
    "Warranty Expiration": number | string | null;
    "Last Inventory": string | number | null;
    "Replacement notes": string | null;
    "Replacement Priority based on warranty expiration": string | number | null;
    "EQUIP TYPE": string;
    "Cost": number | string | null;
    "NOTES": string | null;
    "Computer Name": string | null;
    [key: string]: unknown; // Allow extra columns just in case
}

export interface InventoryData {
    fileName: string;
    devices: Device[];
}
export interface ScanResult {
    timestamp: number;
    status: 'valid' | 'invalid';
    mismatches?: string[];
}

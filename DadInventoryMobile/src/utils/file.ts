import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import XLSX from 'xlsx';
import { Device, ScanResult } from '../types';

export const pickAndParseExcel = async (): Promise<{ devices: Device[], name: string, uri: string } | null> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
            copyToCacheDirectory: true
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return null;
        }

        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;

        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64'
        });

        const workbook = XLSX.read(fileContent, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Device>(sheet);

        return { devices: jsonData, name: fileName, uri: fileUri };
    } catch (e) {
        console.error("Error picking file", e);
        return null; // Handle error upstream
    }
};



// @ts-ignore
import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate';
import { Buffer } from 'buffer';

export const exportToExcel = async (devices: Device[], scanResults: Record<number, ScanResult>, originalFileUri: string, fileName: string) => {
    try {
        // 1. Read Original File as Base64
        const fileContent = await FileSystem.readAsStringAsync(originalFileUri, {
            encoding: 'base64'
        });

        // 2. Load into XlsxPopulate
        const workbook = await XlsxPopulate.fromDataAsync(Buffer.from(fileContent, 'base64'));
        const sheet = workbook.sheet(0);

        // 3. Find Layout
        const usedRange = sheet.usedRange();
        // If sheet is empty, handle it
        if (!usedRange) throw new Error("Sheet is empty");

        const endColumnIndex = usedRange.endCell().columnNumber(); // 1-based
        const startRow = usedRange.startCell().rowNumber();
        // Assuming header is first row of used range, data follows 

        let statusColIdx = -1;
        let discColIdx = -1;

        // Search for existing headers in the first row
        for (let i = 1; i <= endColumnIndex; i++) {
            const rawVal = sheet.cell(startRow, i).value();
            const val = String(rawVal || "").trim().toUpperCase();
            if (val === "STATUS") statusColIdx = i;
            if (val === "DISCREPANCIES") discColIdx = i;
        }

        let nextCol = endColumnIndex + 1;
        if (statusColIdx === -1) statusColIdx = nextCol++;
        if (discColIdx === -1) discColIdx = nextCol++;

        // Write Headers
        sheet.cell(startRow, statusColIdx).value("STATUS").style({ bold: true });
        sheet.cell(startRow, discColIdx).value("DISCREPANCIES").style({ bold: true });

        // 4. Iterate and Update
        // Note: devices array index 0 corresponds to Excel Row (startRow + 1) typically.
        devices.forEach((device, i) => {
            const rowIndex = startRow + 1 + i;
            const scan = scanResults[i];

            let status = "MISSING";
            let discrepancies = "";
            let color = null; // Default none

            if (scan) {
                if (scan.status === 'valid') {
                    status = "VERIFIED";
                    color = null;
                } else {
                    status = "INVALID";
                    discrepancies = scan.mismatches ? scan.mismatches.join("; ") : "";
                    color = "FF0000"; // Red
                }
            }

            // 4.1 Check Previous Status (Before Overwriting)
            // We use this to decide if we should clear existing formatting (only if it was "INVALID" before).
            const statusCell = sheet.cell(rowIndex, statusColIdx);
            const preVal = statusCell.value();
            const wasInvalid = String(preVal || "").trim().toUpperCase() === "INVALID";

            // 4.2 Write New Status
            statusCell.value(status);

            // Write Discrepancies
            const discCell = sheet.cell(rowIndex, discColIdx);
            discCell.value(discrepancies);

            // Highlight Row if Invalid (or clear if it WAS invalid and now isn't)
            const rowRange = sheet.range(rowIndex, 1, rowIndex, discColIdx);

            if (color) {
                rowRange.style("fill", color);
            } else if (wasInvalid) {
                // Only clear formatting if we (or the user) previously flagged it as INVALID in our column.
                // This protects user's custom formatting on other rows.
                rowRange.style("fill", undefined);
            }
        });

        // 5. Output
        const base64 = await workbook.outputAsync("base64");

        // 6. Save and Share
        const newFileName = fileName.replace(".xlsx", "_Verified.xlsx");
        const fileUri = FileSystem.cacheDirectory + newFileName;

        await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert("Error", "Sharing is not available on this device");
        }

    } catch (error: any) {
        Alert.alert("Export Error", error.message);
        console.error(error);
    }
};

export const emailList = async (devices: Device[], scanResults: Record<number, ScanResult>) => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
        alert("Mail is not available on this device");
        return;
    }

    const invalidItems = devices
        .map((d, i) => ({ device: d, result: scanResults[i] }))
        .filter(item => item.result?.status === 'invalid');

    if (invalidItems.length === 0) {
        alert("No invalid items to report.");
        return;
    }

    // Format body with details
    const body = invalidItems.map(({ device, result }) => {
        const mismatchText = result.mismatches ? `\n   Discrepancies: ${result.mismatches.join(', ')}` : '';
        return `• ${device["ASST ID"]} - ${device["MFR / MODEL"]} (${device["SER #"]})${mismatchText}`;
    }).join('\n\n');

    MailComposer.composeAsync({
        subject: "Mobile Inventory Scan - Mismatched Items",
        body: body,
    });
}

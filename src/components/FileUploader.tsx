import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Upload, FileType, AlertCircle } from 'lucide-react';
import type { Device } from '../types';

interface FileUploaderProps {
    onUpload: (data: Device[], fileName: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError(null);
        const file = acceptedFiles[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Use sheet_to_json to get array of objects
                const jsonData = XLSX.utils.sheet_to_json<Device>(sheet);

                if (jsonData.length === 0) {
                    setError("The spreadsheet appears to be empty.");
                    setLoading(false);
                    return;
                }

                // Basic validation: Check if first item has at least one expected key
                // We look for "ASST ID" or "SER #" which seem critical
                const firstItem = jsonData[0];
                if (!("ASST ID" in firstItem) && !("SER #" in firstItem)) {
                    setError("Invalid format. Could not find 'ASST ID' or 'SER #' columns.");
                    setLoading(false);
                    return;
                }

                onUpload(jsonData, file.name);
            } catch (err) {
                console.error("Error parsing file:", err);
                setError("Failed to parse the file. Please ensure it is a valid Excel or CSV file.");
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = () => {
            setError("Error reading file.");
            setLoading(false);
        };

        reader.readAsBinaryString(file);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false
    });

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                {...getRootProps()}
                className={`border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full ${isDragActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                        {isDragActive ? (
                            <Upload className="w-8 h-8 text-orange-600" />
                        ) : (
                            <FileType className="w-8 h-8 text-gray-500" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-medium text-gray-900">
                            {isDragActive ? "Drop the spreadsheet here" : "Click or drag spreadsheet to upload"}
                        </p>
                        <p className="text-sm text-gray-500">
                            Supports .xlsx, .xls, and .csv
                        </p>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="mt-4 text-center text-gray-600 animate-pulse">
                    Processing file...
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

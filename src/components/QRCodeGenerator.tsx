import React from 'react';
import QRCode from 'react-qr-code';
import type { Device } from '../types';
import { deterministicStringify } from '../utils/json';

interface QRCodeGeneratorProps {
    device: Device;
    size?: number;
    className?: string;
    id?: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ device, size = 128, className = "", id }) => {
    // We need to encode the device data deeply properly, but basic JSON.stringify is usually enough
    // The requirement is "Map 1:1 with the spreadsheet row. Preserve field names and values exactly."
    const value = deterministicStringify(device);

    return (
        <div className={`bg-white p-2 inline-block ${className}`} id={id}>
            <QRCode
                value={value}
                size={size}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 ${size} ${size}`}
            />
        </div>
    );
};

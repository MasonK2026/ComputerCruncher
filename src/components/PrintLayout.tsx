import React, { useMemo } from 'react';
import type { Device, PrintOptions } from '../types';
import { QRCodeGenerator } from './QRCodeGenerator';

interface PrintLayoutProps {
  devices: Device[];
  options: PrintOptions;
}

const AVERY_5167_STYLES = `
  @media print {
    @page {
      size: 8.5in 11in;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
    }
  }
  
  .sheet {
    width: 8.5in;
    height: 11in;
    padding-top: 0.5in;
    padding-left: 0.30in;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(4, 1.75in);
    grid-template-rows: repeat(20, 0.5in);
    column-gap: 0.3in;
    row-gap: 0;
    page-break-after: always;
    background: white;
  }

  /* When viewing on screen (for debugging layout hiddenly) */
  .sheet {
    position: relative;
    /* Optional: dashed borders for debug on screen */
  }

  .label {
    width: 1.75in;
    height: 0.5in;
    overflow: hidden;
    display: flex;
    align-items: center;
    padding: 0.04in; /* Slightly tight padding */
    box-sizing: border-box;
    position: relative;
  }

  .qr-container {
    width: 0.42in;
    height: 0.42in;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.05in;
  }

  .info-container {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    white-space: nowrap;
    line-height: 1.1;
  }

  .info-line {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Force override padding on the QR generator wrapper */
  .qr-container > div {
    padding: 0 !important;
    background: transparent !important;
  }
`;

export const PrintLayout: React.FC<PrintLayoutProps> = ({ devices, options }) => {
  // Chunk devices into pages of 80
  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < devices.length; i += 80) {
      chunks.push(devices.slice(i, i + 80));
    }
    return chunks;
  }, [devices]);

  return (
    <div className="print-output">
      <style dangerouslySetInnerHTML={{ __html: AVERY_5167_STYLES }} />

      {pages.map((pageDevices, pageIndex) => (
        <div key={pageIndex} className="sheet">
          {pageDevices.map((device, deviceIndex) => (
            <LabelItem key={deviceIndex} device={device} options={options} />
          ))}
        </div>
      ))}
    </div>
  );
};

interface LabelItemProps {
  device: Device;
  options: PrintOptions;
}

const LabelItem: React.FC<LabelItemProps> = ({ device, options }) => {
  // Collect all active fields
  const fields = useMemo(() => {
    const f: { text: string; bold?: boolean; mono?: boolean }[] = [];

    // Always prioritize Asset ID
    if (options.showAssetId && device["ASST ID"])
      f.push({ text: String(device["ASST ID"]), bold: true });

    if (options.showModel && device["MFR / MODEL"])
      f.push({ text: device["MFR / MODEL"] });

    if (options.showSerial && device["SER #"])
      f.push({ text: `SN: ${device["SER #"]}`, mono: true });

    if (options.showComputerName && device["Computer Name"])
      f.push({ text: String(device["Computer Name"]), mono: true });

    if (options.showWarrantyCallback && device["Warranty Expiration"])
      f.push({ text: `War: ${device["Warranty Expiration"]}` });

    if (options.showRoom && device["RM"])
      f.push({ text: `Rm: ${device["RM"]}` });

    if (options.showRoomSub && device["RM SUB"])
      f.push({ text: `Sub: ${device["RM SUB"]}` });

    if (options.showPOC && device["POC"])
      f.push({ text: `POC: ${device["POC"]}` });

    if (options.showCost && device["Cost"])
      f.push({ text: `$${device["Cost"]}` });

    if (options.showDescription && device["DESC"])
      f.push({ text: device["DESC"] });

    return f;
  }, [device, options]);

  // Calculate scaling
  const calculatedFontSize = useMemo(() => {
    const count = fields.length;
    if (count === 0) return 9;

    // We have about 38px of usable height in the 0.5in label (minus padding)
    // 0.5in = 48px. Padding 0.04in * 2 = 0.08in ~ 8px.
    // 48 - 8 = 40px
    const availableHeightPx = 40;
    const size = Math.floor(availableHeightPx / count);

    // Clamp between 5px and 9px. 4px is unreadable, 5px is bare minimum for high res print.
    return Math.min(Math.max(size, 5), 9);
  }, [fields.length]);

  return (
    <div className="label">
      <div className="qr-container">
        {/* Pass className to override padding from QRCodeGenerator if needed.
            However, QRCodeGenerator uses className on the wrapper div.
            We need to ensure zero padding on that wrapper. */}
        <QRCodeGenerator
          device={device}
          size={256}
          className="!p-0 !m-0 w-full h-full"
        />
      </div>
      <div className="info-container" style={{ fontSize: `${calculatedFontSize}px` }}>
        {fields.map((field, idx) => (
          <div
            key={idx}
            className={`info-line ${field.bold ? 'font-bold' : ''} ${field.mono ? 'font-mono' : ''}`}
          >
            {field.text}
          </div>
        ))}
      </div>
    </div>
  );
};

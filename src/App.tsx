import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileUploader } from './components/FileUploader';
import { Dashboard } from './components/Dashboard';
import { PrintLayout } from './components/PrintLayout.tsx';
import type { Device, PrintOptions } from './types';

import { PrintSettingsDialog } from './components/PrintSettingsDialog';

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    showAssetId: true,
    showModel: true,
    showSerial: true,
    showDescription: false,
    showWarrantyCallback: true,
    showComputerName: true,
    showRoom: false,
    showRoomSub: false,
    showPOC: false,
    showCost: false,
  });

  const printComponentRef = useRef<HTMLDivElement>(null);

  const [printDevices, setPrintDevices] = useState<Device[]>([]);

  const handleUpload = (data: Device[], name: string) => {
    console.log("Uploaded:", name, data);
    setDevices(data);
    setFileName(name);
  };

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Inventory_${fileName || 'QR_Codes'}`,
  });

  const onPrintRequest = (devicesToPrint: Device[]) => {
    setPrintDevices(devicesToPrint);
    setIsPrintDialogOpen(true);
  }

  const onPrintConfirm = (options: PrintOptions) => {
    setPrintOptions(options);
    setIsPrintDialogOpen(false);
    // Give state a moment to update before printing
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm no-print">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          Computer<span className="text-orange-600">Cruncher</span>
        </h1>
        {fileName && (
          <div className="flex gap-4 items-center">
            <span className="text-sm px-3 py-1 bg-gray-100 rounded-full text-gray-600">
              {fileName}
            </span>


          </div>
        )}
      </header>

      <main className="flex-1 p-8 overflow-hidden no-print">
        {devices.length === 0 ? (
          <div className="max-w-xl mx-auto mt-20">
            <FileUploader onUpload={handleUpload} />
          </div>
        ) : (
          <Dashboard
            devices={devices}
            onReset={() => setDevices([])}
            onPrint={onPrintRequest}
          />
        )}
      </main>

      {/* Hidden Print Layout */}
      <div style={{ display: 'none' }}>
        <div ref={printComponentRef}>
          <PrintLayout devices={printDevices} options={printOptions} />
        </div>
      </div>

      <PrintSettingsDialog
        open={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        onConfirm={onPrintConfirm}
      />
    </div>
  );
}

export default App;

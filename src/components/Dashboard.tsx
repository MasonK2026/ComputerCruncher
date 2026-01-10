import React, { useMemo, useState } from 'react';
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector, // Optional
    GridToolbarQuickFilter
} from '@mui/x-data-grid';
import type { Device } from '../types';
import { downloadQrCode } from '../utils/download';
import { QrCode, Download, Printer } from 'lucide-react';
import { QRCodeGenerator } from './QRCodeGenerator';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';

function CustomToolbar() {
    return (
        <GridToolbarContainer className="flex justify-between items-center p-2 border-b border-gray-200">
            <div className="flex gap-2">
                <GridToolbarColumnsButton />
                <GridToolbarFilterButton />
                <GridToolbarDensitySelector />
            </div>
            <GridToolbarQuickFilter />
        </GridToolbarContainer>
    );
}

interface DashboardProps {
    devices: Device[];
    onReset: () => void;
    onPrint: (devices: Device[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ devices, onReset, onPrint }) => {
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [rowSelectionModel, setRowSelectionModel] = useState<any>([]);

    const getSelectedIds = () => {
        if (Array.isArray(rowSelectionModel)) {
            return rowSelectionModel;
        }
        if (rowSelectionModel && typeof rowSelectionModel === 'object') {
            if (rowSelectionModel.ids instanceof Set) {
                return Array.from(rowSelectionModel.ids);
            }
            if (Array.isArray(rowSelectionModel.ids)) {
                return rowSelectionModel.ids;
            }
        }
        return [];
    };

    const handlePrintClick = () => {
        const ids = getSelectedIds();

        const selectedIDs = new Set(ids);

        const devicesToPrint = selectedIDs.size > 0
            ? devices.filter((d, index) => {
                const id = d["ASST ID"] ? `${d["ASST ID"]}-${index}` : `row-${index}`;
                // console.log(`Device ${id} selected?`, isSelected);
                return selectedIDs.has(id);
            })
            : devices;

        onPrint(devicesToPrint);
    };

    const columns: GridColDef<Device>[] = useMemo(
        () => [
            { field: 'ASST ID', headerName: 'Asset ID', flex: 1, minWidth: 100 },
            { field: 'STK NBR', headerName: 'Stk Nbr', flex: 1, minWidth: 100 },
            { field: 'MFR / MODEL', headerName: 'Model', flex: 2, minWidth: 150 },
            { field: 'SER #', headerName: 'Serial #', flex: 1.5, minWidth: 120 },
            { field: 'DESC', headerName: 'Description', flex: 1.5, minWidth: 120 },
            { field: 'QTY', headerName: 'Qty', flex: 0.5, minWidth: 70 },
            { field: 'RM', headerName: 'Room', flex: 0.5, minWidth: 80 },
            { field: 'RM SUB', headerName: 'Rm Sub', flex: 0.5, minWidth: 80 },
            { field: 'POC', headerName: 'POC', flex: 1, minWidth: 100 },
            { field: 'Warranty Expiration', headerName: 'Warranty Exp', flex: 1, minWidth: 120 },
            { field: 'Last Inventory', headerName: 'Last Inv', flex: 1, minWidth: 100 },
            { field: 'Replacement notes', headerName: 'Repl Notes', flex: 1.5, minWidth: 150 },
            { field: 'Replacement Priority based on warranty expiration', headerName: 'Repl Priority', flex: 1, minWidth: 120 },
            { field: 'EQUIP TYPE', headerName: 'Equip Type', flex: 1, minWidth: 120 },
            { field: 'Cost', headerName: 'Cost', flex: 1, minWidth: 100 },
            { field: 'NOTES', headerName: 'Notes', flex: 2, minWidth: 150 },
            { field: 'Computer Name', headerName: 'Computer Name', flex: 1.5, minWidth: 120 },
            {
                field: 'actions',
                headerName: 'Actions',
                width: 140,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: (params: GridRenderCellParams<Device>) => (
                    <div className="flex gap-1 items-center h-full">
                        <Tooltip title="View QR Code">
                            <IconButton size="small" onClick={() => setSelectedDevice(params.row)}>
                                <QrCode size={18} className="text-gray-600" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Label">
                            <IconButton size="small" onClick={() => onPrint([params.row])}>
                                <Printer size={18} className="text-orange-600" />
                            </IconButton>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [onPrint]
    );

    const rows = useMemo(() => {
        return devices.map((d, index) => ({
            ...d,
            id: d["ASST ID"] ? `${d["ASST ID"]}-${index}` : `row-${index}`
        }));
    }, [devices]);

    const selectionCount = getSelectedIds().length;

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Inventory</h2>
                    <p className="text-sm text-gray-500">
                        {devices.length} items loaded
                        {selectionCount > 0 && ` • ${selectionCount} selected`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onReset} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                        Upload New File
                    </button>
                    <button
                        onClick={handlePrintClick}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
                    >
                        <Printer size={18} />
                        <span>
                            {selectionCount > 0
                                ? `Print Selected (${selectionCount})`
                                : "Print All QR Codes"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden" style={{ minHeight: '500px' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                        columns: {
                            columnVisibilityModel: {
                                // Optional: Hide some detailed columns by default to avoid clutter
                                'Replacement notes': false,
                                'Replacement Priority based on warranty expiration': false,
                                'Cost': false,
                                'NOTES': false,
                                'RM': false,
                                'RM SUB': false,
                                'POC': false,
                                'QTY': false,
                                'STK NBR': false,
                                'EQUIP TYPE': false,
                            },
                        },
                    }}
                    slots={{
                        toolbar: CustomToolbar,
                    }}
                    // Remove slotProps as quick filter is now explicit in CustomToolbar
                    pageSizeOptions={[10, 25, 50, 100]}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(newSelection) => {
                        setRowSelectionModel(newSelection);
                    }}
                    className="border-none"
                />
            </div>

            {/* QR Preview Modal */}
            <Dialog open={!!selectedDevice} onClose={() => setSelectedDevice(null)} maxWidth="sm" fullWidth>
                <DialogTitle className="flex justify-between items-center">
                    <span>QR Code Preview</span>
                    <IconButton
                        onClick={() => selectedDevice && downloadQrCode(`qr-${selectedDevice["ASST ID"]}`, `qr_${selectedDevice["ASST ID"]}`)}
                        title="Download PNG"
                    >
                        <Download className="w-5 h-5 text-gray-600" />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="flex flex-col items-center p-8 space-y-6">
                    {selectedDevice && (
                        <>
                            <div className="p-4 border rounded-xl bg-white shadow-sm">
                                <QRCodeGenerator
                                    device={selectedDevice}
                                    size={256}
                                    id={`qr-${selectedDevice["ASST ID"]}`}
                                />
                            </div>
                            <div className="max-w-full overflow-hidden text-center">
                                <h3 className="text-lg font-bold text-gray-900">{selectedDevice["ASST ID"]}</h3>
                                <p className="text-gray-600">{selectedDevice["MFR / MODEL"]}</p>
                                <p className="text-gray-500 text-sm font-mono mt-2">{selectedDevice["SER #"]}</p>
                            </div>
                            <div className="w-full bg-gray-50 p-4 rounded-md overflow-hidden text-left">
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono break-all">
                                    {JSON.stringify(selectedDevice, null, 2)}
                                </pre>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import type { PrintOptions } from '../types';

interface PrintSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (options: PrintOptions) => void;
}

export const PrintSettingsDialog: React.FC<PrintSettingsDialogProps> = ({ open, onClose, onConfirm }) => {
    const [options, setOptions] = useState<PrintOptions>({
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

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOptions({
            ...options,
            [event.target.name]: event.target.checked,
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Print Settings</DialogTitle>
            <DialogContent>
                <p className="mb-4 text-gray-600">Select the fields to display under each QR code:</p>
                <FormGroup>
                    <FormControlLabel
                        control={<Checkbox checked={options.showAssetId} onChange={handleChange} name="showAssetId" />}
                        label="Asset ID"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={options.showModel} onChange={handleChange} name="showModel" />}
                        label="Manufacturer / Model"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={options.showSerial} onChange={handleChange} name="showSerial" />}
                        label="Serial Number"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={options.showComputerName} onChange={handleChange} name="showComputerName" />}
                        label="Computer Name"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={options.showWarrantyCallback} onChange={handleChange} name="showWarrantyCallback" />}
                        label="Warranty Expiration"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <FormControlLabel
                            control={<Checkbox checked={options.showRoom} onChange={handleChange} name="showRoom" />}
                            label="Room"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={options.showRoomSub} onChange={handleChange} name="showRoomSub" />}
                            label="Room Sub"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={options.showPOC} onChange={handleChange} name="showPOC" />}
                            label="POC"
                        />
                        <FormControlLabel
                            control={<Checkbox checked={options.showCost} onChange={handleChange} name="showCost" />}
                            label="Cost"
                        />
                    </div>
                    <FormControlLabel
                        control={<Checkbox checked={options.showDescription} onChange={handleChange} name="showDescription" />}
                        label="Description"
                    />
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button
                    onClick={() => onConfirm(options)}
                    variant="contained"
                    sx={{
                        bgcolor: '#ea580c', // orange-600
                        '&:hover': { bgcolor: '#c2410c' } // orange-700
                    }}
                >
                    Print
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// src/types/cliente/ClientDevice.ts
export interface Device {
    id: number;
    model: string;
    brand: string;
    type: string;
    photo: string;
    pdf_url: string | null;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface ClientDevice {
    id: number;
    client_id: number;
    device_id: number;
    serial: string;
    linked_by: number | null;
    status: boolean;
    address: string;
    device: Device;
    created_at: string;
    updated_at: string;
}

export interface AssociateDevicePayload {
    device_id: number;
    serial: string;
    address: string;
}

export interface AssociateDeviceResponse {
    success: boolean;
    data: ClientDevice;
    message: string;
}

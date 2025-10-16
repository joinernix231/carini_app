export interface Tecnico {
  id: number;
  user_id: number;
  document: string;
  phone: string;
  status: 'active' | 'inactive';
  address: string;
  blood_type: string;
  photo: string;
  specialty: string;
  hire_date: string;
  contract_type: 'full_time' | 'part_time' | 'contractor';
  eps_pdf: string;
  arl_pdf: string;
  pension_pdf: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  policy_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export interface TecnicoResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    email: string;
    role: string;
    policy_accepted: boolean;
    created_at: string;
    updated_at: string;
    technician_data: Tecnico;
  };
  message: string;
}

export interface Parafiscales {
  eps: {
    nombre: string;
    documento_url: string;
  };
  arl: {
    nombre: string;
    documento_url: string;
  };
  pension: {
    nombre: string;
    documento_url: string;
  };
}

export interface CarnetInfo {
  nombre: string;
  rh: string;
  especialidad: string;
  foto: string;
  numero_carnet: string;
  fecha_expedicion: string;
  vigencia: string;
}
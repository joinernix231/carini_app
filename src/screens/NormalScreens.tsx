// src/screens/NormalScreens.tsx
// Pantallas normales (no lazy) para evitar problemas de carga

// Importar todas las pantallas directamente
import AdminDashboard from './Administrador/AdministradorDashboard';
import ClienteList from './Administrador/Cliente/ClienteList';
import TecnicoList from './Administrador/Tecnico/TecnicoList';
import EquipoList from './Administrador/Equipo/EquipoList';
import CoordinadorList from './Administrador/Coordinador/CoordinadorList';
import TecnicoDashboard from './Tecnico/TecnicoDashboard';
import MisMantenimientos from './Tecnico/MisMantenimientos';
import GestionarDocumentos from './Tecnico/GestionarDocumentos';
import CoordinadorDashboard from './Coordinator/CoordinadorDashboard';
import AsignarEquipos from './Coordinator/AsignarEquipos';
import ClienteDashboard from './client/ClienteDashboard';
import MisEquipos from './client/MyDevices/MisEquipos';
import MantenimientosList from './client/mantenimiento/MantenimientosList';
import CrearCliente from './Administrador/Cliente/CrearCliente';
import CrearTecnico from './Administrador/Tecnico/CrearTecnico';
import CrearEquipo from './Administrador/Equipo/CrearEquipo';
import CrearCoordinador from './Administrador/Coordinador/CrearCoordinador';
import EditarCliente from './Administrador/Cliente/EditarCliente';
import EditarTecnico from './Administrador/Tecnico/EditarTecnico';
import EditarEquipo from './Administrador/Equipo/EditarEquipo';
import EditarCoordinador from './Administrador/Coordinador/EditarCoordinador';
import DetalleCliente from './Administrador/Cliente/DetalleCliente';
import DetalleTecnico from './Administrador/Tecnico/DetalleTecnico';
import DetalleEquipo from './Administrador/Equipo/DetalleEquipo';
import DetalleCoordinador from './Administrador/Coordinador/DetalleCoordinador';
import MantenimientosTecnicoList from './Administrador/Tecnico/MantenimientosTecnicoList';
import DetalleMantenimientoTecnico from './Administrador/Tecnico/DetalleMantenimientoTecnico';
import MantenimientosListAdmin from './Administrador/Mantenimiento/MantenimientosList';
import CrearMantenimientoAdmin from './Administrador/Mantenimiento/CrearMantenimiento';

// Exportar con nombres consistentes
export const LazyAdminDashboard = AdminDashboard;
export const LazyClienteList = ClienteList;
export const LazyTecnicoList = TecnicoList;
export const LazyEquipoList = EquipoList;
export const LazyCoordinadorList = CoordinadorList;
export const LazyTecnicoDashboard = TecnicoDashboard;
export const LazyMisMantenimientos = MisMantenimientos;
export const LazyGestionarDocumentos = GestionarDocumentos;
export const LazyCoordinadorDashboard = CoordinadorDashboard;
export const LazyAsignarEquipos = AsignarEquipos;
export const LazyClienteDashboard = ClienteDashboard;
export const LazyMisEquipos = MisEquipos;
export const LazyMantenimientosList = MantenimientosList;
export const LazyCrearCliente = CrearCliente;
export const LazyCrearTecnico = CrearTecnico;
export const LazyCrearEquipo = CrearEquipo;
export const LazyCrearCoordinador = CrearCoordinador;
export const LazyEditarCliente = EditarCliente;
export const LazyEditarTecnico = EditarTecnico;
export const LazyEditarEquipo = EditarEquipo;
export const LazyEditarCoordinador = EditarCoordinador;
export const LazyDetalleCliente = DetalleCliente;
export const LazyDetalleTecnico = DetalleTecnico;
export const LazyDetalleEquipo = DetalleEquipo;
export const LazyDetalleCoordinador = DetalleCoordinador;
export const LazyMantenimientosTecnicoList = MantenimientosTecnicoList;
export const LazyDetalleMantenimientoTecnico = DetalleMantenimientoTecnico;
export const LazyMantenimientosListAdmin = MantenimientosListAdmin;
export const LazyCrearMantenimientoAdmin = CrearMantenimientoAdmin;

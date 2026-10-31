import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonBadge, IonIcon, 
  IonSegment, IonSegmentButton, IonLabel,
  ToastController,  
  AlertController   
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, checkmarkCircleOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-inicio-cliente',
  templateUrl: './inicio-cliente.page.html',
  styleUrls: ['./inicio-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonBadge, IonIcon, 
    IonSegment, IonSegmentButton, IonLabel 
  ]
})
export class InicioClientePage {
  segmentoActual: string = 'activos'; 
  
  pedidosActivos: any[] = [];
  pedidosHistorial: any[] = [];

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef, 
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({ cloudUploadOutline, checkmarkCircleOutline, settingsOutline }); 
  }

  ionViewWillEnter() {
    this.cargarMisPedidos();
  }

  async mostrarToast(mensaje: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

 cargarMisPedidos() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/home']);
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get(`${environment.apiUrl}/clientes/mis-pedidos`, { headers }).subscribe({
      next: (res: any) => {
        
        // Filtra los pedidos en curso
        this.pedidosActivos = res.filter((p: any) => 
          p.estatus_entrega === 'Pendiente' || p.estatus_entrega === 'En camino'
        );
        
        // Filtra los pedidos que ya finalizaron 
        this.pedidosHistorial = res.filter((p: any) => 
          ['Entregado', 'Cancelado', 'No Entregado', 'Pago Rechazado'].includes(p.estatus_entrega)
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 403 || err.status === 401) {
          console.warn('Sesión inválida o expirada. Redirigiendo al login...');
          this.mostrarToast('Tu sesión expiró o es inválida. Inicia sesión de nuevo.', 'warning');
          localStorage.removeItem('token');
          this.router.navigate(['/home']);
          return;
        }
        
        
        console.error('Error al cargar pedidos:', err);
        this.mostrarToast('Problemas al cargar tus pedidos.', 'danger');
      }
    });
  }

  nuevoPedido() {
    this.router.navigate(['/nuevo-pedido']);
  }

  abrirAjustes() { 
    this.router.navigate(['/ajustes']);
  }

  subirComprobante(idPedido: number) {
    this.mostrarToast(`Próximamente: Abrir cámara para el pedido #${idPedido}`, 'tertiary');
  }

  getColorEstatus(estatus: string) {
    switch(estatus) {
      case 'Pendiente': return 'warning';
      case 'En camino': return 'tertiary';
      case 'Entregado': return 'success';
      case 'Cancelado': 
      case 'No Entregado': return 'danger';
      default: return 'medium';
    }
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }
}
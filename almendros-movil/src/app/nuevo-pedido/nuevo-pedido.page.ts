import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonRadioGroup, IonItem, IonLabel, IonRadio,
  IonTextarea,
  ToastController,  
  AlertController   
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, removeOutline, cashOutline, cardOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-nuevo-pedido',
  templateUrl: './nuevo-pedido.page.html',
  styleUrls: ['./nuevo-pedido.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonRadioGroup, IonItem, IonLabel, IonRadio,
    IonTextarea 
  ]
})
export class NuevoPedidoPage {
  cantidad: number = 1;
  metodoPago: string = 'Efectivo';
  precioUnitario: number = 0; 
  notasCliente: string = ''; 
  archivoComprobante: File | null = null; 

  constructor(
    private http: HttpClient, 
    private router: Router,
    private toastCtrl: ToastController, 
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef 
  ) {
    addIcons({ addOutline, removeOutline, cashOutline, cardOutline, informationCircleOutline });
  }

  
  ionViewWillEnter() {
    
    this.cantidad = 1;
    this.metodoPago = 'Efectivo';
    this.notasCliente = '';
    this.archivoComprobante = null;
    this.precioUnitario = 0; 
    
    
    this.cargarPrecioCliente();
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

  async mostrarAlerta(cabecera: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: cabecera,
      message: mensaje,
      buttons: ['Entendido']
    });
    await alert.present();
  }

  cambiarCantidad(valor: number) {
    const nuevaCantidad = this.cantidad + valor;
    if (nuevaCantidad >= 1) {
      this.cantidad = nuevaCantidad;
    }
  }

  cargarPrecioCliente() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get(`${environment.apiUrl}/clientes/mi-tarifa`, { headers }).subscribe({
      next: (res: any) => {
        this.precioUnitario = res.tarifa_especial || res.precio_garrafon;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar tarifa:', err);
        this.mostrarToast('Problemas de conexión al cargar tu tarifa.', 'danger');
        this.precioUnitario = 15; 
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarComprobante(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoComprobante = file;
    }
  }

  confirmarPedido() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.mostrarToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'warning');
      this.router.navigate(['/home']);
      return;
    }

    if (this.metodoPago === 'Transferencia' && !this.archivoComprobante) {
      this.mostrarToast('⚠️ Es obligatorio adjuntar tu comprobante de pago.', 'warning');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('cantidad_garrafones', this.cantidad.toString());
    formData.append('tipo_pago', this.metodoPago);
    formData.append('monto_total', (this.cantidad * this.precioUnitario).toString());
    formData.append('notas_cliente', this.notasCliente);
    
    if (this.archivoComprobante) {
      formData.append('comprobante', this.archivoComprobante);
    }

    this.http.post(`${environment.apiUrl}/clientes/pedidos`, formData, { headers }).subscribe({
      next: () => {
        this.mostrarAlerta('¡Pedido Confirmado!', 'En breve un repartidor pasará a tu domicilio.');
        this.router.navigate(['/inicio-cliente']);
      },
      error: (err) => {
        console.error('Error al crear pedido:', err);
        this.mostrarToast('No se pudo procesar el pedido. Intenta nuevamente.', 'danger');
      }
    });
  }
}
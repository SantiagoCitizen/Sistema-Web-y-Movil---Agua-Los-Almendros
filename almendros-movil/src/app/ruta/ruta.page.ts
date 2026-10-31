import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { environment } from '../../environments/environment'; 

import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonCardContent, IonBadge, IonIcon,
  ToastController,  
  AlertController   
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-ruta',
  templateUrl: './ruta.page.html',
  styleUrls: ['./ruta.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
    IonContent, IonCard, IonCardHeader, IonCardTitle, 
    IonCardSubtitle, IonCardContent, IonBadge, IonIcon 
  ]
})
export class RutaPage implements OnInit, OnDestroy {
  pedidos: any[] = [];
  
  private intervaloPolling: any;
  private idsConocidos: Set<number> = new Set();
  private primeraCarga: boolean = true;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastCtrl: ToastController, 
    private alertCtrl: AlertController  
  ) { 
    addIcons({ alertCircleOutline });
  }

  ngOnInit() {
    this.cargarRutaDelDia();
    this.iniciarAutoActualizacion(); 
  }

  ionViewWillEnter() {
    this.cargarRutaDelDia();
    this.iniciarAutoActualizacion();
  }

  ionViewWillLeave() {
    this.detenerAutoActualizacion();
  }

  ngOnDestroy() {
    this.detenerAutoActualizacion();
  }

  async mostrarToast(mensaje: string, color: string = 'success', duracion: number = 2500) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: duracion,
      color: color,
      position: 'top' 
    });
    await toast.present();
  }

  async mostrarAlertaError(cabecera: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: cabecera,
      message: mensaje,
      buttons: ['Entendido']
    });
    await alert.present();
  }

  iniciarAutoActualizacion() {
    this.detenerAutoActualizacion();
    this.intervaloPolling = setInterval(() => {
      this.cargarRutaDelDia(true);
    }, 10000);
  }

  detenerAutoActualizacion() {
    if (this.intervaloPolling) {
      clearInterval(this.intervaloPolling);
      this.intervaloPolling = null;
    }
  }

  cargarRutaDelDia(esRevisionAutomatica: boolean = false) {
    const token = localStorage.getItem('token');

    if (!token) {
      this.detenerAutoActualizacion();
      if (!esRevisionAutomatica) {
        this.mostrarToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'warning', 4000);
      }
      this.router.navigate(['/home']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(`${environment.apiUrl}/repartidores/entregas`, { headers }).subscribe({
      next: (datos: any) => {
        const listaRecibida = Array.isArray(datos) ? datos : [];

        const hayPedidoNuevo = listaRecibida.some(
          (p: any) => !this.idsConocidos.has(p.id_pedido)
        );

        if (!this.primeraCarga && hayPedidoNuevo) {
          console.log('🔔 ¡Nuevo pedido detectado! Reproduciendo alerta...');
          this.reproducirSonidoAlerta();
          this.mostrarToast('¡Nuevo pedido recibido en la zona!', 'primary', 4000);
        }

        this.idsConocidos = new Set(listaRecibida.map((p: any) => p.id_pedido));
        this.primeraCarga = false;

        this.pedidos = listaRecibida;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        
        if (err.status === 403) {
          this.detenerAutoActualizacion();
          this.router.navigate(['/inicio-cliente']); 
          return;
        }
        // ------------------------------

        console.error('Error al cargar la ruta:', err);
        if (!esRevisionAutomatica) {
          this.mostrarToast('Problemas de red. Intentando reconectar...', 'danger');
        }
      }
    });
  }

  reproducirSonidoAlerta() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); 
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.18); 
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('El navegador bloqueó el audio automático:', e);
    }
  }

  async actualizarEstatus(id_pedido: number, nuevoEstatus: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (nuevoEstatus === 'Cancelado' || nuevoEstatus === 'No Entregado') {
      const alert = await this.alertCtrl.create({
        header: 'Reportar Incidencia',
        message: '¿Por qué no se pudo completar la entrega? (Ej. Nadie abrió, No tenían dinero)',
        inputs: [
          {
            name: 'razon',
            type: 'textarea',
            placeholder: 'Escribe el motivo aquí...'
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              console.log('Actualización cancelada');
            }
          },
          {
            text: 'Guardar',
            handler: (data) => {
              
              if (!data.razon || data.razon.trim() === '') {
                this.mostrarToast('Debes escribir un motivo.', 'warning');
                return false; 
              }
              // Si sí escribió, continua enviando la petición
              this.enviarPeticionEstatus(id_pedido, nuevoEstatus, data.razon.trim(), token);
              return true;
            }
          }
        ]
      });
      await alert.present();
    } else {
      // Si el estatus es 'En camino' o 'Entregado', no pide notas y lo envia directo
      this.enviarPeticionEstatus(id_pedido, nuevoEstatus, null, token);
    }
  }

  
  private enviarPeticionEstatus(id_pedido: number, estatus: string, notas_campo: string | null, token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { 
      estatus: estatus,
      notas_campo: notas_campo
    };

    this.http.put(`${environment.apiUrl}/repartidores/entregas/${id_pedido}/estatus`, body, { headers })
      .subscribe({
        next: () => {
          this.mostrarToast(`Pedido marcado como ${estatus}`);
          this.cargarRutaDelDia(true);
        },
        error: (error) => {
          if (error.status === 400 && error.error && error.error.detail) {
            
            this.mostrarAlertaError('Atención', error.error.detail);
          } else {
            console.error('Fallo al actualizar el estatus:', error);
            this.mostrarToast('Ocurrió un error al actualizar el pedido.', 'danger');
          }
        }
      });
  }

  irAAjustes() {
    this.router.navigate(['/ajustes']);
  }

  cerrarSesion() {
    this.detenerAutoActualizacion();
    localStorage.removeItem('token');
    this.pedidos = [];
    this.idsConocidos.clear();
    this.primeraCarga = true;
    this.router.navigate(['/home']);
  }
}
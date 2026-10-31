import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment'; 

import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonTextarea, 
  IonButton,
  IonItem,      
  IonLabel,     
  IonToggle,
  ToastController,  
  AlertController   
} from '@ionic/angular';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonInput, 
    IonSelect, 
    IonSelectOption, 
    IonTextarea, 
    IonButton,
    IonItem,      
    IonLabel,     
    IonToggle 
  ]
})
export class RegistroPage implements OnInit {
  
  colonias: any[] = [];

  cliente = {
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    telefono: '',
    password: '',
    id_colonia: null,
    calle: '',
    numero: '',
    referencias_domicilio: '',
    es_empresa: false,
    razon_social: ''
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private toastCtrl: ToastController, 
    private alertCtrl: AlertController  
  ) { }

  ngOnInit() {
    this.cargarColonias();
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
  

  cargarColonias() {
    this.http.get(`${environment.apiUrl}/colonias`).subscribe({
      next: (datos: any) => {
        this.colonias = datos;
      },
      error: (err) => {
        console.error('Error al cargar colonias:', err);
        
        this.mostrarToast('No se pudieron cargar las colonias. Revisa tu conexión.', 'danger');
      }
    });
  }

  registrarCliente() {
    // Validación básica 
    if (!this.cliente.nombre || !this.cliente.apellido_paterno || !this.cliente.telefono || 
        !this.cliente.password || !this.cliente.id_colonia || !this.cliente.calle || !this.cliente.numero) {
      
      this.mostrarToast('Por favor, llena todos los campos obligatorios.', 'warning');
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post(`${environment.apiUrl}/registro`, this.cliente, { headers })
      .subscribe({
        next: (respuesta: any) => {
          
          this.mostrarToast(respuesta.mensaje || '¡Cuenta creada exitosamente!');
          this.router.navigate(['/home']); 
        },
        error: (error) => {
          if (error.error && error.error.detail) {
            
            this.mostrarAlerta('Registro Fallido', error.error.detail);
          } else {
            console.error('Error en el registro:', error);
            this.mostrarToast('Ocurrió un error al intentar crear tu cuenta.', 'danger');
          }
        }
      });
  }
}
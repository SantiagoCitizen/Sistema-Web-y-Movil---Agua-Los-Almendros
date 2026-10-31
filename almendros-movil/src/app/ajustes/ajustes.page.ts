import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment'; 

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton, 
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  ToastController,  
  AlertController   
} from '@ionic/angular';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton, 
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonInput
  ]
})
export class AjustesPage {
  passwordActual = '';
  passwordNueva = '';
  confirmarPassword = '';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

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

  actualizarPassword() {
    if (!this.passwordActual || !this.passwordNueva || !this.confirmarPassword) {
      this.mostrarToast('Por favor completa todos los campos.', 'warning');
      return;
    }

    if (this.passwordNueva !== this.confirmarPassword) {
      this.mostrarToast('La nueva contraseña y la confirmación no coinciden.', 'danger');
      return;
    }

    if (this.passwordNueva.length < 6) {
      this.mostrarToast('La nueva contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.mostrarToast('Tu sesión expiró. Inicia sesión nuevamente.', 'warning');
      this.router.navigate(['/home']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      password_actual: this.passwordActual,
      password_nueva: this.passwordNueva
    };
    
    this.http.put(`${environment.apiUrl}/cambiar-password`, payload, { headers })
      .subscribe({
        next: () => {
          this.mostrarAlerta('Éxito', 'Contraseña actualizada. Por seguridad, inicia sesión con tu nueva clave.');
          localStorage.removeItem('token');
          this.passwordActual = '';
          this.passwordNueva = '';
          this.confirmarPassword = '';
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Error al cambiar contraseña:', err);
          const detalle = err.error?.detail || 'No se pudo actualizar la contraseña.';
          this.mostrarAlerta('Error', detalle);
        }
      });
  }
}
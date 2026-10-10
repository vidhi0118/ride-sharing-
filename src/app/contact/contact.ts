import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent {
  name = '';
  email = '';
  message = '';

  submit() {
    alert('Thank you for contacting us!');
    this.name = '';
    this.email = '';
    this.message = '';
  }
}

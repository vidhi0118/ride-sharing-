import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { auth } from '../../firebase/firebase.config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {

  isDark = false;
  isScrolled = false;
  isLoggedIn = false; // 🔹 added

  ngOnInit() {
    // 🔐 auth state check
    onAuthStateChanged(auth, (user) => {
      this.isLoggedIn = !!user;
    });
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  logout() {
    signOut(auth);
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 40;
  }
}

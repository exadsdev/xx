'use client'

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

import { useSession, signIn, signOut } from "next-auth/react";
const navBar = [
    { href: '/', name: 'Home' },
    { href: '/admin', name: 'admin' },
    { href: '/waiting', name: 'waiting' },
    { href: '/Video', name: 'Video วิธีสั่งซื้อ' },

]


export default function Navbar() {
  const { data: session } = useSession();


  return (
    <>
 <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-3">
        <div className="container-xl">
          <Link className="navbar-brand" href="/">
            <img src="/images/logo-512.png" width={50} alt="logo" />
            <span>accfb</span>

          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {navBar.map((link) => (
                <li key={link.href} className="nav-item mx-2">

                  <Link href={link.href} className="Link">
                   
                    {link.name}
                    
                  </Link>

                </li>
              ))}
            </ul>
            <div className="auth-buttons">
              {session ? (
                <>
                       <div className="dropdown" >
                        <a className="dropbtn"> 
                       <div className="Profile"><img src={session.user.image} alt="Profile Image" className='imgProfile' /></div>
                        </a>
                       <div className="dropdown-content">
                       <button className="btn btn-danger" onClick={() => signOut()}>  ออก  </button>
                      </div>
                       </div>

                  
                </>
              ) : (
                <button className="btn btn-outline-light" onClick={() => signIn()}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>


      
    </>
  )
}

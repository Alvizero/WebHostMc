'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GestioneAdminRoot() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      router.replace('/gestioneadmin/panel/dashboard');
    } else {
      router.replace('/gestioneadmin/login');
    }
  }, [router]);

  return null; // non serve mostrare nulla, redirect immediato
}
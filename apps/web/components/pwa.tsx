'use client';
import { useEffect } from 'react';
export function PwaRegistration(){useEffect(()=>{if(!('serviceWorker'in navigator))return;void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{window.dispatchEvent(new CustomEvent('panah:pwa-registration',{detail:{status:'unavailable'}}));});},[]);return null;}

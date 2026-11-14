'use client';
import {useEffect,useState,type ReactNode} from 'react';
/** One welcome per document load; client-side navigation keeps this layout mounted. */
export function WelcomeScreen({children}:{children:ReactNode}){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{if(!visible)return;const previous=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const fallback=setTimeout(()=>setVisible(false),reduced?1400:3400);return()=>{clearTimeout(fallback);document.documentElement.style.overflow=previous}},[visible]);
 return <><div inert={visible} aria-hidden={visible||undefined} style={visible?{visibility:'hidden'}:undefined}>{!visible&&children}</div>{visible&&<div className="welcome-screen" role="status" aria-label="Bienvenida a Cuentico"><img className="welcome-logo" src="/assets/logo-welcome.png" alt="Cuentico" width="900" height="670" fetchPriority="high" loading="eager" onAnimationEnd={()=>setVisible(false)} onError={()=>setVisible(false)}/></div>}</>;
}

"use client";

import { useEffect } from 'react';

export function DebugCookies() {
  useEffect(() => {
    console.log('Client Cookies:', document.cookie);
  }, []);

  return null;
}
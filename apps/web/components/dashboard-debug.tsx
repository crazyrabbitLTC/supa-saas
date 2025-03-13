"use client"

import { useEffect } from "react"

// This component helps debug hydration and rendering issues
export function DashboardDebug() {
  useEffect(() => {
    console.log('✅ Client-side dashboard rendering')
    
    // Log what layouts are present in the DOM
    const layouts = {
      rootLayout: document.querySelector('.relative.flex.min-h-screen.flex-col') !== null,
      dashboardRoot: document.getElementById('dashboard-root') !== null,
      headerElement: document.querySelector('header') !== null,
      footerElement: document.querySelector('footer') !== null,
      globalFooter: document.querySelector('.relative.flex.min-h-screen.flex-col > footer') !== null,
      dashboardFooter: document.querySelector('#dashboard-root footer') !== null,
    }
    
    console.log('📊 Layout detection:', layouts)
    
    // Check if we're getting duplicate elements
    const duplicateCheck = {
      mainElements: document.querySelectorAll('main').length,
      footerElements: document.querySelectorAll('footer').length,
      headerElements: document.querySelectorAll('header').length
    }
    
    console.log('🔍 Duplicate element check:', duplicateCheck)
    
    // Log the full DOM structure for debugging
    console.log('🌳 DOM structure:', document.documentElement.innerHTML)
  }, [])

  // This component doesn't render anything visible
  return null
} 
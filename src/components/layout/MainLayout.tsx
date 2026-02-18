// autoloan-nextjs-metafullstack/src/components/layout/MainLayout.tsx
'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import AppHeader from './AppHeader';
import SideDrawer from './SideDrawer';

interface MainLayoutProps {
  children: React.ReactNode;
  showDrawer?: boolean;
}

export default function MainLayout({ children, showDrawer = true }: MainLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader showMenu={showDrawer} onMenuClick={() => setDrawerOpen(true)} />
      {showDrawer && <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
}

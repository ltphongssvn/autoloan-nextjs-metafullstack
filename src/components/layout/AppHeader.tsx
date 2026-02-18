// autoloan-nextjs-metafullstack/src/components/layout/AppHeader.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem,
  Box, Avatar, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';

interface AppHeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export default function AppHeader({ onMenuClick, showMenu = false }: AppHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    try { await authService.logout(); } catch { /* ignore */ }
    finally { logout(); router.push('/'); }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'loan_officer') return '/officer';
    if (user.role === 'underwriter') return '/underwriter';
    return '/dashboard';
  };

  const initials = user ? `${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}` : '';

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#1a237e' }}>
      <Toolbar>
        {showMenu && (
          <IconButton color="inherit" edge="start" onClick={onMenuClick} sx={{ mr: 2 }} aria-label="menu">
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" fontWeight={700} sx={{ cursor: 'pointer', flexGrow: 1 }}
          onClick={() => router.push(getDashboardPath())}>
          AutoLoan
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user.first_name} {user.last_name}
            </Typography>
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="account">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 14 }}>{initials}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem onClick={() => { setAnchorEl(null); router.push(getDashboardPath()); }}>
                <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Dashboard
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/dashboard/settings'); }}>
                <SettingsIcon sx={{ mr: 1, fontSize: 20 }} /> Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
        {!user && (
          <Button color="inherit" onClick={() => router.push('/login')}>Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

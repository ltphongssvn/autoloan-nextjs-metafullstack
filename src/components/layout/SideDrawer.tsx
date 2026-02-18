// autoloan-nextjs-metafullstack/src/components/layout/SideDrawer.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useAuth } from '@/context/AuthContext';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const APPLICANT_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Settings', path: '/dashboard/settings', icon: <SettingsIcon /> },
];

const OFFICER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/officer', icon: <DashboardIcon /> },
  { label: 'Applications', path: '/officer', icon: <AssignmentIcon /> },
];

const UNDERWRITER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/underwriter', icon: <DashboardIcon /> },
  { label: 'Analysis Queue', path: '/underwriter', icon: <AnalyticsIcon /> },
];

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

export default function SideDrawer({ open, onClose, variant = 'temporary' }: SideDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];
    if (user.role === 'loan_officer') return OFFICER_NAV;
    if (user.role === 'underwriter') return UNDERWRITER_NAV;
    return APPLICANT_NAV;
  };

  const navItems = getNavItems();
  const roleLabel = user?.role === 'loan_officer' ? 'Loan Officer' : user?.role === 'underwriter' ? 'Underwriter' : 'Applicant';

  return (
    <Drawer variant={variant} open={open} onClose={onClose}
      sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">{roleLabel} Portal</Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton selected={pathname === item.path}
              onClick={() => { router.push(item.path); onClose(); }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

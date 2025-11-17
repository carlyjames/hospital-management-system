'use client';
import React, { useState, useEffect, useContext } from 'react';
import { DashboardNav } from './dashboard-nav';
import { cn } from '../../lib/utils';

import { ChevronLeft } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../assets/images/logo.png';
import { useAuth } from '@/hooks/useAuth';

// Define navigation items based on roles
const getNavItemsByRole = (role) => {
  switch (role) {
    case 'DOCTOR':
      return [
        { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { title: 'Patients', href: '/dashboard/patients', icon: 'users', label: 'users' },
        { title: 'Appointments', href: '/dashboard/appointments', icon: 'Calendar', label: 'Calendar' },
       { title: 'Delivery Records', href: '/dashboard/delivery-records', icon: 'Tickets', label: 'Tickets' },
      ];
    case 'PATIENT':
      return [
        { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { title: 'My Appointments', href: '/dashboard/my-appointments', icon: 'Calendar', label: 'Calendar' },
        { title: 'My Delivery Records', href: '/dashboard/my-delivery', icon: 'Tickets', label: 'Tickets' },
      ];

    default:
      return [
        { name: 'OverView', href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { title: 'Delivery Records', href: '/dashboard/delivery-records', icon: 'Tickets', label: 'Tickets' },
      ];
  }
};

const navItems = [
    { title: 'Overview', href: '/Dashboard', icon: 'dashboard', label: 'Dashboard' },
    { title: 'Patients', href: '/Dashboard/patients', icon: 'users', label: 'users' },
    { title: 'Appointments', href: '/Dashboard/appointments', icon: 'Calendar', label: 'Calendar' },
    { title: 'My Appointments', href: '/Dashboard/my-appointments', icon: 'Calendar', label: 'Calendar' },
    { title: 'Delivery Records', href: '/Dashboard/delivery-records', icon: 'Tickets', label: 'Tickets' },
    { title: 'My Delivery Records', href: '/Dashboard/my-delivery', icon: 'Tickets', label: 'Tickets' },
]

const Sidebar = ({ className }) => {
  const { user } = useAuth(); 
  const [navItems, setNavItems] = useState([]);
  const { isMinimized, toggle } = useSidebar();

  useEffect(() => {
    if (user?.role) {
      const items = getNavItemsByRole(user.role);
      setNavItems(items);
    }
  }, [user]);

  const handleToggle = () => {
    toggle();
  };

  return (
    <aside
      className={cn(
        `relative hidden h-screen flex-none border-r bg-card transition-[width] duration-500 md:block`,
        !isMinimized ? 'w-52' : 'w-[72px]',
        className
      )}
    >
      {/* Logo section */}
      <div className="hidden p-5 pt-10 lg:block">
        <Link href={'/'}>
          <Image src={logo} width={100} height={100} className='h-[100px] w-[100px] object-contain' alt='logo' />
        </Link>
      </div>

      {/* Toggle button */}
      <ChevronLeft
        className={cn(
          'absolute -right-3 top-10 z-50 cursor-pointer rounded-full border bg-background text-3xl text-foreground',
          isMinimized && 'rotate-180'
        )}
        onClick={handleToggle}
      />

      {/* Navigation items */}
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav items={navItems} />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

'use client';
import { DashboardNav } from './dashboard-nav';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
// import { useAuth } from '../../Context/AuthContext';

const getNavItemsByRole = (role) => {
    switch (role) {
        case 'DOCTOR':
            return [
                { title: 'Dashboard', href: '/Dashboard', icon: 'Dashboard', label: 'Dashboard' },
                { title: 'Patients', href: '/Dashboard/patients', icon: 'users', label: 'users' },
                { title: 'Appointments', href: '/Dashboard/appointments', icon: 'Calendar', label: 'Calendar' },
                { title: 'Delivery Records', href: '/Dashboard/delivery-records', icon: 'Tickets', label: 'Tickets' },
            ];
        case 'PATIENT':
            return [
                { title: 'Dashboard', href: '/Dashboard', icon: 'Dashboard', label: 'Dashboard' },
                { title: 'My Appointments', href: '/Dashboard/my-appointments', icon: 'Calendar', label: 'Calendar' },
                { title: 'My Delivery Records', href: '/Dashboard/my-delivery', icon: 'Tickets', label: 'Tickets' },
            ];

        default:
            return [
                { name: 'OverView', href: '/Dashboard', icon: 'Dashboard', label: 'Dashboard' },
                { title: 'Delivery Records', href: '/Dashboard/delivery-records', icon: 'Tickets', label: 'Tickets' },
            ];
    }
};
// const navItems = [
//     { title: 'Overview', href: '/Dashboard', icon: 'Dashboard', label: 'Dashboard' },
//     { title: 'Patients', href: '/Dashboard/patients', icon: 'users', label: 'users' },
//     { title: 'Appointments', href: '/Dashboard/appointments', icon: 'Calendar', label: 'Calendar' },
//     { title: 'My Appointments', href: '/Dashboard/my-appointments', icon: 'Calendar', label: 'Calendar' },
//     { title: 'Delivery Records', href: '/Dashboard/delivery-records', icon: 'Tickets', label: 'Tickets' },
//     { title: 'Delivery Records', href: '/Dashboard/my-delivery', icon: 'Tickets', label: 'Tickets' },
// ]


export function MobileSidebar({ className }) {
      const { user } = useAuth(); 
      const [navItems, setNavItems] = useState([]);
    const [open, setOpen] = useState(false);

      useEffect(() => {
        if (user && user.role) {
          const items = getNavItemsByRole(user.role);
          setNavItems(items);
        }
      }, [user]);


    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <MenuIcon />
                </SheetTrigger>
                <SheetContent side="left" className="!px-0">
                    <div className="space-y-4 py-4">
                        <div className="px-3 py-2">
                            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                                Overview
                            </h2>
                            <div className="space-y-1">
                                <DashboardNav
                                    items={navItems}
                                    isMobileNav={true}
                                    setOpen={setOpen}
                                />
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

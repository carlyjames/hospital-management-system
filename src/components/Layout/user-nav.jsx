'use client';
import { Avatar } from '../../components/ui/avatar';
import { CircleUserRound } from 'lucide-react';
import { Button } from '../../components/ui/button';
// import { useAuth } from '../../Context/AuthContext';
import { useContext, useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import avatar from '../../assets/images/avater.png';
import { useAuth } from '@/hooks/useAuth';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import Image from 'next/image';

export function UserNav() {
  const { logout } = useAuth();
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const actorDetails = localStorage.getItem('user');
    if (actorDetails) {
      try {
        const parsedData = JSON.parse(actorDetails);
        setUserData(parsedData || {});
      } catch (error) {
        setUserData({});
      }
    } else {
      setUserData({});
    }
  }, []);

//   const getDisplayName = () => {
//     if (userData?.name) {
//       return userData.name;
//     }
    
//     const firstName = userData?.first_name?.trim();
//     const lastName = userData?.last_name?.trim();
    
//     if (firstName || lastName) {
//       return `${firstName || ''} ${lastName || ''}`.trim();
//     }
    
//     if (userData?.phone) {
//       return `0${userData.phone}`;
//     }
    
//     return 'Guest User';
//   };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative flex items-center rounded-full gap-2">
          <Avatar >
            <Image src={avatar} alt='avatar' width={40} height={40} className='rounded-full' />
          </Avatar>
          <div className='flex flex-col items-start'>
            <div className='w-full flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h1 className='font-semibold truncate'>{userData.full_name}</h1>
              </div>
              {/* {userData?.role === 'seller' ? (
                <Link href='/dashboard/profile'>
                  <ExternalLink className="h-[15px] w-[15px]" />
                </Link>
              ) : ''} */}
            </div>

          </div>
        </div>
      </DropdownMenuTrigger>

    </DropdownMenu>
  );
} 
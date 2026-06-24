'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();

    useEffect(() => {
      // Check if accessToken exists in localStorage
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/Login');
      }
    }, [router]);

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;

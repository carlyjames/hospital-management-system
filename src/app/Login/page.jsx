"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import api from '@/lib/axios'

// icons
import appleIcon from '../../assets/images/apple.png'
import facebookIcon from '../../assets/images/icons8-facebook.png'
import googleIcon from '../../assets/images/icons8-google.png'

const page = () => {
  const router = useRouter()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('accounts/login/', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.access);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      console.log('Login successful:', response.data);

      toast.success(response.data.message || 'Login successful!');

      if (response.data.access) {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false);
    }
  };






  return (
    <section className='flex items-center justify-center h-screen gap-4 relative'>
      <div className=' items-end bg-login h-[92vh] w-[65%] bg-cover bg-center rounded-lg shadow-lg lg:flex hidden'>
        <div className='flex flex-col gap-3 p-4'>
          <h1 className='text-white font-semibold text-4xl'>Simplify record keeping. <br /> Improve care.</h1>
          <p className='text-xl font-light text-gray-400'>Log in to manage patient records, deliveries, <br /> and reports.</p>
        </div>
      </div>
      <div className='flex flex-col gap-2 bg-white p-4 pb-2 rounded-lg shadow-lg lg:w-[30%] w-full h-[85vh] transform lg:-translate-x-20'>
        <p className='text-gray-400 text-sm'>WELCOME BACK</p>
        <h1 className='text-xl text-[#2563EB]'>Log In to your Account</h1>
        <form onSubmit={handleSubmit} className='mt-3 flex gap-3 flex-col'>
          <div className='gap-2 flex flex-col'>
            <Label htmlFor='email' className='text-gray-500 font-semibold'>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} id='email' type='text' placeholder='johndoe@gmail.com' className='border-gray-300 focus:border-blue-500 focus:ring-blue-500' />
          </div>
          <div className='gap-2 flex flex-col'>
            <Label htmlFor='password' className='text-gray-500 font-semibold'>Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} id='password' type='password' placeholder='*********' className='border-gray-300 focus:border-blue-500 focus:ring-blue-500' />
          </div>
          <div className='self-end text-sm text-gray-500'>
            <Link href='/ForgotPassword'>Forgot Password ?</Link>
          </div>
          {/* <Link href='/dashboard' className='w-full'>
          </Link> */}
          <Button type='submit' disabled={isLoading} className='cursor-pointer bg-[#2563EB] w-full'>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className='flex w-full items-center gap-2 justify-center'>
          <div className='h-[1px] w-[80%] bg-gray-300'></div>
          <p>Or</p>
          <div className='h-[1px] w-[80%] bg-gray-300'></div>
        </div>

        <h1 className='text-[#2563EB] text-sm text-center mt-auto'>New User? <Link href='/register' className='underline'>SIGN UP HERE</Link> </h1>
      </div>
    </section>
  )
}

export default page
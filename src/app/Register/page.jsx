'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const userRoles = [
  'PATIENT'
]

const Page = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password2: '',
    phone_number: '',
    age: '',
    gender: '',
    address: '',
    role: ''
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const registerApi = axios.create({
        baseURL: 'https://childbirth-info-system.onrender.com/api/',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const payload = { ...data }

      if (payload.age) {
        payload.age = parseInt(payload.age)
      }

      const response = await registerApi.post('/accounts/register/', payload)
      return response.data
    },
    onSuccess: () => {
      toast.success('Registration successful! Please login to continue.')
      router.push('/Login')
    },
    onError: (error) => {
      console.error('Registration error:', error)

      const errorData = error.response?.data

      console.log('Error data:', errorData)
      toast.error('Registration failed. Please try again.')

      if (errorData) {
        return
      }

      // // 🧠 Extract and format errors properly
      // const messages = Object.entries(errorData)
      //   .map(([key, value]) => {
      //     if (Array.isArray(value)) {
      //       // e.g. { email: ["user with this email already exists."] }
      //       return `${key}: ${value.join(', ')}`
      //     } else if (typeof value === 'string') {
      //       return `${key}: ${value}`
      //     } else {
      //       return `${key}: ${JSON.stringify(value)}`
      //     }
      //   })
      //   .join('\n')

      // toast.error(messages || 'An error occurred. Please check your input.')
    },
  })


  const handleRegister = () => {
    // Validate required fields
    if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
      toast.error('Please fill in all required fields (Name, Email, Password, Role)')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    registerMutation.mutate(formData)
  }

  return (
    <section className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-6xl flex gap-6 items-center'>
        {/* Left side - Image/Banner */}
        <div className='hidden lg:flex flex-1 items-end bg-login h-[85vh] bg-cover bg-center rounded-lg shadow-lg p-8'>
          <div className='flex flex-col gap-3'>
            <h1 className='text-white font-semibold text-4xl leading-tight'>
              Simplify record keeping. <br /> Improve care.
            </h1>
            <p className='text-xl font-light text-gray-200'>
              Register to start managing patients and medical <br /> records efficiently.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className='flex-1 max-w-md w-full'>
          <div className='bg-white p-6 rounded-lg shadow-lg'>
            <div className='mb-6'>
              <p className='text-gray-500 text-xs uppercase tracking-wide mb-2'>
                LET'S GET YOU STARTED
              </p>
              <h1 className='text-2xl font-bold text-[#2563EB]'>Create an Account</h1>
            </div>

            <div className='space-y-4 max-h-[60vh] overflow-y-auto p-3'>
              <div className='space-y-2'>
                <Label htmlFor='full_name' className='text-gray-700 font-semibold'>
                  Full Name*
                </Label>
                <Input
                  name='full_name'
                  id='full_name'
                  value={formData.full_name}
                  onChange={handleInputChange}
                  type='text'
                  placeholder='Johnson Doe'
                  className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email' className='text-gray-700 font-semibold'>
                  Email*
                </Label>
                <Input
                  name='email'
                  id='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  type='email'
                  placeholder='johndoe@gmail.com'
                  className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='text-gray-700 font-semibold'>
                  Password*
                </Label>
                <Input
                  name='password'
                  id='password'
                  value={formData.password}
                  onChange={handleInputChange}
                  type='password'
                  placeholder='***********'
                  className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password2' className='text-gray-700 font-semibold'>
                  Confirm Password*
                </Label>
                <Input
                  name='password2'
                  id='password2'
                  value={formData.password2}
                  onChange={handleInputChange}
                  type='password'
                  placeholder='***********'
                  className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone_number' className='text-gray-700 font-semibold'>
                  Phone Number
                </Label>
                <Input
                  name='phone_number'
                  id='phone_number'
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  type='tel'
                  placeholder='+234 81********'
                  className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='age' className='text-gray-700 font-semibold'>
                    Age
                  </Label>
                  <Input
                    name='age'
                    id='age'
                    value={formData.age}
                    onChange={handleInputChange}
                    type='number'
                    placeholder='23'
                    className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='gender' className='text-gray-700 font-semibold'>
                    Gender
                  </Label>
                  <select
                    name='gender'
                    id='gender'
                    value={formData.gender}
                    onChange={handleInputChange}
                    className='flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                  >
                    <option value=''>Select</option>
                    <option value='MALE'>Male</option>
                    <option value='FEMALE'>Female</option>
                    <option value='OTHER'>Other</option>
                  </select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='address' className='text-gray-700 font-semibold'>
                  Address
                </Label>
                <Input
                  name='address'
                  id='address'
                  value={formData.address}
                  onChange={handleInputChange}
                  type='text'
                  placeholder='St. Mary Hospital Lagos'
                  className='border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='role' className='text-gray-700 font-semibold'>
                  Role*
                </Label>
                <select
                  name='role'
                  id='role'
                  value={formData.role}
                  onChange={handleInputChange}
                  className='flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                  required
                >
                  <option value=''>Select your Role</option>
                  {userRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              disabled={registerMutation.isPending}
              className='w-full bg-[#2563EB] hover:bg-[#1e40af] text-white rounded-lg mt-6'
            >
              {registerMutation.isPending ? 'Registering...' : 'Create Account'}
            </Button>

            {/* <Link href='/dashboard'>
              <Button
                className='w-full bg-[#2563EB] hover:bg-[#1e40af] text-white rounded-lg mt-6'
              >
                {registerMutation.isPending ? 'Registering...' : 'Create Account'}
              </Button>
            </Link> */}

            <div className='flex items-center gap-3 my-6'>
              <div className='flex-1 h-px bg-gray-300'></div>
              <span className='text-gray-500 text-sm'>Or</span>
              <div className='flex-1 h-px bg-gray-300'></div>
            </div>

            <p className='text-center text-sm text-gray-600'>
              Already have an account?{' '}
              <Link href='/Login' className='text-[#2563EB] font-semibold hover:underline'>
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Page
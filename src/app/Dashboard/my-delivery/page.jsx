'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarDays, Loader2, Baby, Weight, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import { usePatient } from '@/hooks/usePatient'

const Page = () => {
  // Fetch patient-specific deliveries
  const { 
    patientDeliveries, 
    patientDeliveriesLoading, 
    patientDeliveriesError 
  } = usePatient()

  const deliveryStats = {
    total: patientDeliveries?.length || 0,

  }

  return (
    <div className='mx-4 py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>My Delivery Records</h1>
          <p className='text-sm text-gray-500 mt-1'>View your complete delivery history</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1  gap-4 mb-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Deliveries</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {patientDeliveriesLoading ? '...' : deliveryStats.total}
                </p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <CalendarDays className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>Complete record of all your deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='relative overflow-auto max-h-[600px]'>
            <Table>
              <TableHeader className='sticky top-0 bg-gray-50 z-10'>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Delivery Type</TableHead>
                  <TableHead>Baby Gender</TableHead>
                  <TableHead>Baby Condition</TableHead>
                  <TableHead>Complaints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientDeliveriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12'>
                      <Loader2 className='w-6 h-6 animate-spin mx-auto' />
                      <p className='text-gray-500 mt-2'>Loading your delivery records...</p>
                    </TableCell>
                  </TableRow>
                ) : patientDeliveriesError ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12'>
                      <AlertCircle className='w-6 h-6 mx-auto text-red-500' />
                      <p className='text-red-500 mt-2'>Failed to load delivery records</p>
                      <p className='text-sm text-gray-500 mt-1'>
                        {patientDeliveriesError.response?.data?.message || 'Please try refreshing the page'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : patientDeliveries && patientDeliveries.length > 0 ? (
                  patientDeliveries.map((delivery, i) => (
                    <TableRow key={delivery.id || i} className='hover:bg-gray-50'>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <CalendarDays className='w-4 h-4 text-gray-400' />
                          <span className='font-medium'>
                            {dayjs(delivery.date).format('MMM D, YYYY')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{delivery.doctor?.full_name || '-'}</span>
                          <span className='text-xs text-gray-500'>{delivery.doctor?.email || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium uppercase'>
                          {delivery.delivery_type || 'Not specified'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span>{delivery.baby_gender || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className='max-w-xs'>
                        <p className='text-sm text-gray-600 line-clamp-2' title={delivery.baby_condition}>
                          {delivery.baby_condition || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium `}>
                          {delivery.complaints && delivery.complaints.trim() !== '' ? delivery.complaints : 'None'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12 text-gray-500'>
                      <Baby className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                      <p className='font-medium text-lg'>No delivery records found</p>
                      <p className='text-sm mt-1'>Your delivery history will appear here once recorded</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {patientDeliveries && patientDeliveries.length > 0 && (
            <div className='text-sm text-gray-500 mt-4 pt-4 border-t'>
              Showing all {patientDeliveries.length} {patientDeliveries.length === 1 ? 'delivery' : 'deliveries'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Page
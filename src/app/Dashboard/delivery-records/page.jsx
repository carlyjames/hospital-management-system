'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Plus, Loader2, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'
import { useDoctor } from '@/hooks/useDoctor'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const Page = () => {
  const queryClient = useQueryClient()
      const [user, setUser] = useState(null);
      const [isMounted, setIsMounted] = useState(false);
  
      useEffect(() => {
          setIsMounted(true);
          try {
              const userDetails = localStorage.getItem('user');
              if (userDetails) {
                  const parsedData = JSON.parse(userDetails);
                  setUser(parsedData);
              }
          } catch (error) {
              console.error('Error parsing user details:', error);
          }
      }, []);
  const { 
    allPatients, 
    allPatientsLoading, 
    deliveries, 
    deliveriesLoading,
    addDelivery,
    addDeliveryLoading 
  } = useDoctor()

  const [searchQuery, setSearchQuery] = useState('')
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false)
  const [isRefreshingPatients, setIsRefreshingPatients] = useState(false)

  // Debug: Log patients data when it changes
  React.useEffect(() => {
    if (allPatients && allPatients.length > 0) {
      console.log('Patients loaded:', allPatients.length)
      console.log('First patient sample:', allPatients[0])
    }
  }, [allPatients])

  // New delivery form state
  const [newDelivery, setNewDelivery] = useState({
    patient_id: '',
    patient_name: '',
    delivery_date: '',
    delivery_type: '',
    doctor: user?.id,
    notes: '',
    complaints: '',
    birth_weight: '',
    baby_gender: ''
  })

  // Filter deliveries based on search
  const filteredDeliveries = deliveries?.filter(delivery => {
    const searchLower = searchQuery.toLowerCase()
    return (
      delivery.mother_name?.toLowerCase().includes(searchLower) ||
      delivery.patient_id?.toLowerCase().includes(searchLower)
      // delivery.doctor?.toLowerCase().includes(searchLower)
    )
  }) || []

  // Handle new delivery submission
  const handleCreateDelivery = async () => {
    try {
      // Validate required fields
      if (!newDelivery.patient_id || !newDelivery.delivery_date) {
        toast.error('Please fill in all required fields')
        return
      }

      // Find selected patient name
      const selectedPatient = allPatients?.find(p => p.id === parseInt(newDelivery.patient_id))
      
      const deliveryData = {
        patient_id: `P${String(newDelivery.patient_id).padStart(3, '0')}`, // Format as P001, P002, etc.
        patient: newDelivery.patient_id,
        date: newDelivery.delivery_date,
        delivery_type: 'NORMAL',
        doctor: newDelivery.doctor,
        baby_condition: newDelivery.notes,
        complaints: newDelivery.complaints,
        birth_weight: newDelivery.birth_weight,
        baby_gender: newDelivery.baby_gender
      }

      await addDelivery(deliveryData)
      
      toast.success('Delivery recorded successfully')
      setIsNewDeliveryOpen(false)
      
      // Reset form
      setNewDelivery({
        patient_id: '',
        patient_name: '',
        delivery_date: '',
        delivery_type: '',
        doctor: '',
        notes: '',
        complaints: '',
        birth_weight: '',
        baby_gender: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record delivery')
      console.error('Delivery creation error:', error)
    }
  }

  // Refresh patients list
  const handleRefreshPatients = async () => {
    setIsRefreshingPatients(true)
    await queryClient.invalidateQueries({ queryKey: ['allPatients'] })
    setTimeout(() => setIsRefreshingPatients(false), 500)
    toast.success('Patients list refreshed')
  }

  const deliveryStats = {
    total: deliveries?.length || 0
  }

  return (
    <div className='mx-4 py-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Deliveries</h1>
          <p className='text-sm text-gray-500 mt-1'>Manage and record deliveries</p>
        </div>
        <Dialog open={isNewDeliveryOpen} onOpenChange={setIsNewDeliveryOpen}>
          <DialogTrigger asChild>
            <Button className='bg-[#021848] hover:bg-[#021848]/90 flex gap-2 items-center'>
              <Plus className='w-4 h-4' />
              New Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Record New Delivery</DialogTitle>
              <DialogDescription>
                Fill in the details to record a new delivery
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4 max-h-[400px] overflow-x-hidden overflow-y-auto'>
              {/* Patient Selection */}
              <div className='grid gap-2'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='patient'>Patient *</Label>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleRefreshPatients}
                    disabled={isRefreshingPatients || allPatientsLoading}
                    className='h-8 px-2'
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingPatients ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <Select
                  value={newDelivery.patient_id}
                  onValueChange={(value) => {
                    const patient = allPatients?.find(p => p.id === parseInt(value))
                    setNewDelivery({ 
                      ...newDelivery, 
                      patient_id: value,
                      patient_name: patient?.full_name || ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select patient' />
                  </SelectTrigger>
                  <SelectContent className='max-h-60 overflow-y-auto'>
                    {allPatientsLoading ? (
                      <SelectItem value="loading" disabled>Loading patients...</SelectItem>
                    ) : allPatients?.length > 0 ? (
                      allPatients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.full_name} (ID: {patient.id})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-patients" disabled>No patients found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Delivery */}
              <div className='grid gap-2'>
                <Label htmlFor='date'>Delivery Date *</Label>
                <Input
                  id='date'
                  type='date'
                  value={newDelivery.delivery_date}
                  onChange={(e) => setNewDelivery({ ...newDelivery, delivery_date: e.target.value })}
                />
              </div>

              {/* Delivery Type */}
              <div className='grid gap-2'>
                <Label htmlFor='delivery_type'>Delivery Type</Label>
                <Select
                  value={newDelivery.delivery_type}
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, delivery_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select delivery type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Caesarean Section">Caesarean Section</SelectItem>
                    <SelectItem value="Assisted Delivery">Assisted Delivery</SelectItem>
                    <SelectItem value="Water Birth">Water Birth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Baby Gender */}
              <div className='grid gap-2'>
                <Label htmlFor='baby_gender'>Baby Gender</Label>
                <Select
                  value={newDelivery.baby_gender}
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, baby_gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Twins">Twins</SelectItem>
                    <SelectItem value="Multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Birth Weight */}
              <div className='grid gap-2'>
                <Label htmlFor='birth_weight'>Birth Weight</Label>
                <Input
                  id='birth_weight'
                  placeholder='e.g., 3.4 kg'
                  value={newDelivery.birth_weight}
                  onChange={(e) => setNewDelivery({ ...newDelivery, birth_weight: e.target.value })}
                />
              </div>

              {/* complaints */}
              <div className='grid gap-2'>
                <Label htmlFor='complaints'>complaints</Label>
                <Input
                  id='complaints'
                  placeholder='e.g., None or describe complaints'
                  value={newDelivery.complaints}
                  onChange={(e) => setNewDelivery({ ...newDelivery, complaints: e.target.value })}
                />
              </div>

              {/* Additional Notes */}
              <div className='grid gap-2'>
                <Label htmlFor='notes'>Additional Notes</Label>
                <Textarea
                  id='notes'
                  placeholder='Any additional information...'
                  value={newDelivery.notes}
                  onChange={(e) => setNewDelivery({ ...newDelivery, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsNewDeliveryOpen(false)}>
                Cancel
              </Button>
              <Button 
                className='bg-[#021848] hover:bg-[#021848]/90' 
                onClick={handleCreateDelivery}
                disabled={addDeliveryLoading}
              >
                {addDeliveryLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Recording...
                  </>
                ) : (
                  'Record Delivery'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Deliveries</p>
                <p className='text-3xl font-bold text-gray-900'>
                  {deliveriesLoading ? '...' : deliveryStats.total}
                </p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <CalendarDays className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className='mb-4'>
        <Input
          placeholder='Search by mother name, patient ID, or doctor...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='max-w-md'
        />
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Records</CardTitle>
          <CardDescription>View and manage all delivery records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='relative overflow-auto max-h-[600px]'>
            <Table>
              <TableHeader className='sticky top-0 bg-gray-50 z-10'>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Delivery Type</TableHead>
                  <TableHead>Baby Gender</TableHead>
                  <TableHead>Birth Weight</TableHead>
                  <TableHead>complaints</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveriesLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className='text-center py-12'>
                      <Loader2 className='w-6 h-6 animate-spin mx-auto' />
                      <p className='text-gray-500 mt-2'>Loading deliveries...</p>
                    </TableCell>
                  </TableRow>
                ) : deliveries.length > 0 ? (
                  deliveries.map((delivery, i) => (
                    <TableRow key={delivery.id || i} className='hover:bg-gray-50'>
                      <TableCell className='font-medium'>{delivery.patient?.full_name}</TableCell>
                      <TableCell>{delivery.doctor?.full_name}</TableCell>
                      <TableCell>
                        {dayjs(delivery.date_of_delivery).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell>{delivery.delivery_type}</TableCell>
                      <TableCell>{delivery.baby_gender}</TableCell>
                      <TableCell>{delivery.baby_weight}</TableCell>
                      <TableCell>
                        <span>
                          {delivery.complaints}
                        </span>
                      </TableCell>
                      <TableCell className='max-w-xs truncate'>
                        {delivery.baby_condition || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className='text-center py-12 text-gray-500'>
                      No deliveries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredDeliveries.length > 0 && (
            <div className='text-sm text-gray-500 mt-4 pt-4 border-t'>
              Showing {filteredDeliveries.length} of {deliveries?.length || 0} deliveries
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Page
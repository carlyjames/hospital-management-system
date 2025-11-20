'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Plus, Loader2, RefreshCw, FileText, Download } from 'lucide-react'
import dayjs from 'dayjs'
import { useDoctor } from '@/hooks/useDoctor'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const Page = () => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const certificateRef = useRef(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

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

  const filteredDeliveries = deliveries?.filter(delivery => {
    const searchLower = searchQuery.toLowerCase()
    return (
      delivery.patient?.full_name?.toLowerCase().includes(searchLower) ||
      delivery.patient_id?.toLowerCase().includes(searchLower)
    )
  }) || []

  const handleCreateDelivery = async () => {
    try {
      if (!newDelivery.patient_id || !newDelivery.delivery_date) {
        toast.error('Please fill in all required fields')
        return
      }

      const deliveryData = {
        patient_id: `P${String(newDelivery.patient_id).padStart(3, '0')}`,
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

  const handleRefreshPatients = async () => {
    setIsRefreshingPatients(true)
    await queryClient.invalidateQueries({ queryKey: ['allPatients'] })
    setTimeout(() => setIsRefreshingPatients(false), 500)
    toast.success('Patients list refreshed')
  }

  // Generate and download birth certificate as PDF/Image
  const generateBirthCertificate = (delivery) => {
    setSelectedDelivery(delivery);
    setIsCertificateOpen(true);
  }

  const downloadCertificate = () => {
    const certificate = certificateRef.current;
    if (!certificate) return;

    // Create a canvas from the certificate HTML
    import('html2canvas').then(html2canvas => {
      html2canvas.default(certificate, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      }).then(canvas => {
        // Convert to image and download
        const link = document.createElement('a');
        link.download = `Birth_Certificate_${selectedDelivery?.patient?.full_name?.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast.success('Birth certificate downloaded successfully');
      });
    }).catch(err => {
      console.error('Error generating certificate:', err);
      toast.error('Failed to generate certificate. Please try again.');
    });
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
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.full_name} (ID: {patient.id})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-patients" disabled>No patients found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='date'>Delivery Date *</Label>
                <Input
                  id='date'
                  type='date'
                  value={newDelivery.delivery_date}
                  onChange={(e) => setNewDelivery({ ...newDelivery, delivery_date: e.target.value })}
                />
              </div>

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
                    <SelectItem valuew="Female">Female</SelectItem>
                    <SelectItem value="Twins">Twins</SelectItem>
                    <SelectItem value="Multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='birth_weight'>Birth Weight</Label>
                <Input
                  id='birth_weight'
                  placeholder='e.g., 3.4 kg'
                  value={newDelivery.birth_weight}
                  onChange={(e) => setNewDelivery({ ...newDelivery, birth_weight: e.target.value })}
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='complaints'>Complaints</Label>
                <Input
                  id='complaints'
                  placeholder='e.g., None or describe complaints'
                  value={newDelivery.complaints}
                  onChange={(e) => setNewDelivery({ ...newDelivery, complaints: e.target.value })}
                />
              </div>

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

      {/* Birth Certificate Dialog */}
      <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Birth Certificate</DialogTitle>
            <DialogDescription>
              Official birth certificate for {selectedDelivery?.patient?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          {/* Certificate Design */}
          <div ref={certificateRef} className='bg-white p-8 border-8 border-double border-blue-900'>
            {/* Header */}
            <div className='text-center mb-6'>
              <div className='text-4xl font-bold text-blue-900 mb-2'>CARE BOARD HOSPITAL</div>
              <div className='text-sm text-gray-600 mb-4'>Official Medical Institution</div>
              <div className='w-24 h-1 bg-blue-900 mx-auto mb-4'></div>
              <div className='text-3xl font-serif text-gray-800'>Birth Certificate</div>
            </div>

            {/* Certificate Body */}
            <div className='space-y-6 text-gray-800'>
              <p className='text-center text-lg italic mb-8'>
                This is to certify that the birth has been registered as per the details mentioned below:
              </p>

              <div className='grid grid-cols-2 gap-6 border border-gray-300 p-6 rounded-lg bg-gray-50'>
                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Certificate Number</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.patient_id || 'N/A'}</div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Date of Birth</div>
                  <div className='text-lg font-medium'>
                    {dayjs(selectedDelivery?.date_of_delivery).format('MMMM D, YYYY')}
                  </div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Mother&apos;s Name</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.patient?.full_name || 'N/A'}</div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Baby Gender</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.baby_gender || 'N/A'}</div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Birth Weight</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.baby_weight || 'N/A'}</div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Delivery Type</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.delivery_type || 'N/A'}</div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Attending Doctor</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.doctor?.full_name || 'N/A'}</div>
                </div>

                <div>
                  <div className='font-semibold text-sm text-gray-600 mb-1'>Baby Condition</div>
                  <div className='text-lg font-medium'>{selectedDelivery?.baby_condition || 'Healthy'}</div>
                </div>

                {selectedDelivery?.complaints && (
                  <div className='col-span-2'>
                    <div className='font-semibold text-sm text-gray-600 mb-1'>Medical Notes</div>
                    <div className='text-lg font-medium'>{selectedDelivery.complaints}</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='mt-12 pt-6 border-t border-gray-300'>
                <div className='flex justify-between items-end'>
                  <div className='text-center'>
                    <div className='border-t-2 border-gray-800 w-48 mb-2'></div>
                    <div className='text-sm font-semibold'>Authorized Signature</div>
                    <div className='text-xs text-gray-600'>Medical Director</div>
                  </div>

                  <div className='text-center'>
                    <div className='text-xs text-gray-600 mb-2'>Date of Issue</div>
                    <div className='text-sm font-semibold'>{dayjs().format('MMMM D, YYYY')}</div>
                  </div>

                  <div className='text-center'>
                    <div className='w-24 h-24 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-400'>
                      Official Seal
                    </div>
                  </div>
                </div>
              </div>

              <div className='text-center text-xs text-gray-500 mt-6 pt-4 border-t'>
                <p>Care Board Hospital • Official Birth Record</p>
                <p className='mt-1'>This is an official document issued by Care Board Hospital</p>
              </div>
            </div>
          </div>

          <DialogFooter className='flex gap-2'>
            <Button variant='outline' onClick={() => setIsCertificateOpen(false)}>
              Close
            </Button>
            <Button 
              className='bg-[#021848] hover:bg-[#021848]/90' 
              onClick={downloadCertificate}
            >
              <Download className='w-4 h-4 mr-2' />
              Download Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          placeholder='Search by mother name or patient ID...'
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
                  <TableHead>Complaints</TableHead>
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
                        <span>{delivery.complaints}</span>
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
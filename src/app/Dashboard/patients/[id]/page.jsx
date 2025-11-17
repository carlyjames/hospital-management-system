'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Heart, Activity, Clock, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import api from '@/lib/axios'

const Page = () => {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const patientId = params?.id
    const [appointmentModalOpen, setAppointmentModalOpen] = useState(false)
    const [user, setUser] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const userDetails = localStorage.getItem('user');
            if (userDetails) {
                const parsedData = JSON.parse(userDetails);
                setUser(parsedData);
                console.log('User details loaded:', parsedData);
            }
        } catch (error) {
            console.error('Error parsing user details:', error);
        }
    }, []);

    // Fetch specific patient data
    const { data: patient, isLoading: patientLoading, error: patientError } = useQuery({
        queryKey: ['patient', patientId],
        queryFn: async () => {
            const response = await api.get(`/accounts/patients/${patientId}/`)
            return response.data
        },
        enabled: !!patientId,
        retry: 2,
        staleTime: 5 * 60 * 1000,
    })

    // Appointment form state
    const [appointmentData, setAppointmentData] = useState({
        patient_id: '',
        patient: '',
        patient_age: undefined,
        patient_gender: '',
        date: '',
        time: '',
        type: '',
        reason: '',
        duration: '30',
        notes: '',
        doctor: user?.id,
    })

    // Create appointment mutation
    const createAppointmentMutation = useMutation({
        mutationFn: async (appointmentPayload) => {
            const response = await api.post('/appointments/create/', appointmentPayload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allAppointments'] })
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
        },
    })

    const handleSubmitAppointment = async () => {
        // Validation
        if (!appointmentData.date || !appointmentData.time || !appointmentData.appointment_type || !appointmentData.reason) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            // Format time to 12-hour format with AM/PM
            const formatTime = (time24) => {
                const [hours, minutes] = time24.split(':')
                const hour = parseInt(hours)
                const ampm = hour >= 12 ? 'PM' : 'AM'
                const hour12 = hour % 12 || 12
                return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`
            }

            // Prepare payload according to API expectations
            const payload = {
                patient: patient.id || patientId,
                patient_name: patient.full_name || patient.name,
                patient_age: patient.age,
                patient_gender: patient.gender,
                date: appointmentData.date,
                time: formatTime(appointmentData.time),
                type: appointmentData.appointment_type,
                doctor: user?.id,
                reason: appointmentData.reason,
                duration: `${appointmentData.duration} mins`
            }

            await createAppointmentMutation.mutateAsync(payload)

            toast.success('Appointment scheduled successfully!')
            setAppointmentModalOpen(false)

            // Reset form
            setAppointmentData({
                date: '',
                time: '',
                appointment_type: '',
                duration: '30',
                reason: '',
                notes: ''
            })
        } catch (error) {
            console.error('Appointment creation error:', error)
            toast.error(error.response?.data?.message || 'Failed to schedule appointment')
        }
    }

    // Loading state
    if (patientLoading) {
        return (
            <div className='mx-4 py-8'>
                <Card>
                    <CardContent className='py-12'>
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                            <p className='text-lg text-gray-600'>Loading patient details...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Error state
    if (patientError) {
        return (
            <div className='mx-4 py-8'>
                <Card>
                    <CardContent className='py-12 text-center'>
                        <p className='text-lg text-red-600 mb-4'>Failed to load patient details</p>
                        <p className='text-sm text-gray-500 mb-4'>{patientError.message}</p>
                        <Button
                            onClick={() => router.push('/dashboard/patients')}
                            className='bg-[#021848]'
                        >
                            Back to Patients
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // If patient not found
    if (!patient) {
        return (
            <div className='mx-4 py-8'>
                <Card>
                    <CardContent className='py-12 text-center'>
                        <p className='text-lg text-gray-600'>Patient not found</p>
                        <Button
                            onClick={() => router.push('/dashboard/patients')}
                            className='mt-4 bg-[#021848]'
                        >
                            Back to Patients
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className='mx-4 py-6'>
            {/* Header with back button */}
            <div className='flex items-center gap-4 mb-6'>
                <Button
                    variant='outline'
                    size='icon'
                    onClick={() => router.push('/dashboard/patients')}
                    className='rounded-full'
                >
                    <ArrowLeft className='h-4 w-4' />
                </Button>
                <div>
                    <h1 className='text-2xl font-bold'>Patient Details</h1>
                    <p className='text-sm text-gray-500'>View and manage patient information</p>
                </div>
            </div>

            <div className='grid grid-cols-1  gap-6'>
                {/* Left column - Patient Info */}
                <div className='lg:col-span-1 space-y-6'>
                    {/* Basic Information Card */}
                    <Card>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center justify-between'>
                                <CardTitle className='text-lg'>Patient Information</CardTitle>
                                {patient.role === 'ACTIVE' || patient.status === 'active' ? (
                                    <Badge className='bg-green-100 hover:bg-green-100 text-green-600 rounded-md'>
                                        Active
                                    </Badge>
                                ) : (
                                    <Badge className='bg-gray-200 hover:bg-gray-200 text-gray-500 rounded-md'>
                                        {patient.role || patient.status || 'Inactive'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='flex items-center justify-center py-6'>
                                <div className='w-24 h-24 bg-[#021848] rounded-full flex items-center justify-center'>
                                    <User className='w-12 h-12 text-white' />
                                </div>
                            </div>

                            <div className='text-center'>
                                <h2 className='text-xl font-semibold'>{patient.full_name || patient.name}</h2>
                                <p className='text-sm text-gray-500'>ID: {patient.id}</p>
                            </div>

                            <Separator />

                            <div className='space-y-3'>
                                <div className='flex items-center gap-3'>
                                    <Calendar className='w-4 h-4 text-gray-400' />
                                    <div>
                                        <p className='text-xs text-gray-500'>Age</p>
                                        <p className='text-sm font-medium'>{patient.age || 'N/A'} years</p>
                                    </div>
                                </div>

                                <div className='flex items-center gap-3'>
                                    <User className='w-4 h-4 text-gray-400' />
                                    <div>
                                        <p className='text-xs text-gray-500'>Gender</p>
                                        <p className='text-sm font-medium'>{patient.gender || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className='flex items-center gap-3'>
                                    <Heart className='w-4 h-4 text-gray-400' />
                                    <div>
                                        <p className='text-xs text-gray-500'>Blood Group</p>
                                        <p className='text-sm font-medium'>{patient.blood_group || 'N/A'}</p>
                                    </div>
                                </div>

                                {patient.last_visit && (
                                    <div className='flex items-center gap-3'>
                                        <Activity className='w-4 h-4 text-gray-400' />
                                        <div>
                                            <p className='text-xs text-gray-500'>Last Visit</p>
                                            <p className='text-sm font-medium'>
                                                {dayjs(patient.last_visit).format('MMM D, YYYY')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            <div className='flex items-start gap-3'>
                                <Mail className='w-4 h-4 text-gray-400 mt-1' />
                                <div>
                                    <p className='text-xs text-gray-500'>Email</p>
                                    <p className='text-sm font-medium'>{patient.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className='flex items-start gap-3'>
                                <Phone className='w-4 h-4 text-gray-400 mt-1' />
                                <div>
                                    <p className='text-xs text-gray-500'>Phone</p>
                                    <p className='text-sm font-medium'>{patient.phone_number || patient.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className='flex items-start gap-3'>
                                <MapPin className='w-4 h-4 text-gray-400 mt-1' />
                                <div>
                                    <p className='text-xs text-gray-500'>Address</p>
                                    <p className='text-sm font-medium'>{patient.address || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column - Medical History */}
                <div className='lg:col-span-2'>
                    {/* Action buttons */}
                    <div className='flex gap-3 mt-6'>
                        <Dialog open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen}>
                            <DialogTrigger asChild>
                                <Button className='bg-[#021848] w-full hover:bg-[#021848]/90'>
                                    <Calendar className='w-4 h-4 mr-2' />
                                    Schedule Appointment
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Schedule New Appointment</DialogTitle>
                                    <DialogDescription>
                                        Book an appointment for {patient.full_name || patient.name}. Fill in all required details below.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className='grid gap-4 py-4'>
                                    {/* Patient Info Display */}
                                    <div className='bg-gray-50 rounded-lg p-3 border'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 bg-[#021848] rounded-full flex items-center justify-center'>
                                                <User className='w-5 h-5 text-white' />
                                            </div>
                                            <div>
                                                <p className='font-semibold text-sm'>{patient.full_name || patient.name}</p>
                                                <p className='text-xs text-gray-500'>
                                                    ID: {patient.id} • {patient.age || 'N/A'}y • {patient.gender || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date and Time */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label htmlFor='date'>
                                                Date <span className='text-red-500'>*</span>
                                            </Label>
                                            <div className='relative'>
                                                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                                                <Input
                                                    id='date'
                                                    type='date'
                                                    value={appointmentData.date}
                                                    onChange={(e) => setAppointmentData({ ...appointmentData, date: e.target.value })}
                                                    className='pl-10'
                                                    min={dayjs().format('YYYY-MM-DD')}
                                                />
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='time'>
                                                Time <span className='text-red-500'>*</span>
                                            </Label>
                                            <div className='relative'>
                                                <Clock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                                                <Input
                                                    id='time'
                                                    type='time'
                                                    value={appointmentData.time}
                                                    onChange={(e) => setAppointmentData({ ...appointmentData, time: e.target.value })}
                                                    className='pl-10'
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Appointment Type and Duration */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label htmlFor='type'>
                                                Appointment Type <span className='text-red-500'>*</span>
                                            </Label>
                                            <Select
                                                value={appointmentData.appointment_type}
                                                onValueChange={(value) => setAppointmentData({ ...appointmentData, appointment_type: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Select type' />
                                                   </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="INITIAL">Initial Appointment</SelectItem>
                                                    <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                                                    <SelectItem value="CHECKUP">Routine Checkup</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='duration'>Duration</Label>
                                            <Select
                                                value={appointmentData.duration}
                                                onValueChange={(value) => setAppointmentData({ ...appointmentData, duration: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='15'>15 minutes</SelectItem>
                                                    <SelectItem value='30'>30 minutes</SelectItem>
                                                    <SelectItem value='45'>45 minutes</SelectItem>
                                                    <SelectItem value='60'>1 hour</SelectItem>
                                                    <SelectItem value='90'>1.5 hours</SelectItem>
                                                    <SelectItem value='120'>2 hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Reason for Visit */}
                                    <div className='space-y-2'>
                                        <Label htmlFor='reason'>
                                            Reason for Visit <span className='text-red-500'>*</span>
                                        </Label>
                                        <Input
                                            id='reason'
                                            placeholder='e.g., Annual physical examination, Follow-up for diabetes...'
                                            value={appointmentData.reason}
                                            onChange={(e) => setAppointmentData({ ...appointmentData, reason: e.target.value })}
                                        />
                                    </div>

                                    {/* Additional Notes */}
                                    <div className='space-y-2'>
                                        <Label htmlFor='notes'>Additional Notes (Optional)</Label>
                                        <Textarea
                                            id='notes'
                                            placeholder='Any special instructions, preparations, or notes for this appointment...'
                                            value={appointmentData.notes}
                                            onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                                            rows={4}
                                            className='resize-none'
                                        />
                                    </div>

                                    {/* Summary */}
                                    {appointmentData.date && appointmentData.time && (
                                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                                            <p className='text-sm font-semibold text-blue-900 mb-1'>
                                                Appointment Summary
                                            </p>
                                            <p className='text-xs text-blue-700'>
                                                {dayjs(appointmentData.date).format('dddd, MMMM D, YYYY')} at {appointmentData.time}
                                                {appointmentData.duration && ` • ${appointmentData.duration} minutes`}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className='gap-2'>
                                    <DialogClose asChild>
                                        <Button type='button' variant='outline'>
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        onClick={handleSubmitAppointment}
                                        className='bg-[#021848] hover:bg-[#021848]/90'
                                        disabled={createAppointmentMutation.isPending}
                                    >
                                        {createAppointmentMutation.isPending ? (
                                            <>
                                                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                                Scheduling...
                                            </>
                                        ) : (
                                            'Schedule Appointment'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page
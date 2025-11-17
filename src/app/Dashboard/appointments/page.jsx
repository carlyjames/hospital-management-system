'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import dayjs from 'dayjs'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
    Calendar,
    Clock,
    Eye,
    Plus,
    Search,
    Filter,
    CalendarDays,
    User,
    FileText,
    Edit,
    Trash2,
    Save,
    X,
    Activity,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import api from '@/lib/axios'
import { useDoctor } from '@/hooks/useDoctor'

const Page = () => {
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

    const queryClient = useQueryClient()
    const {
        users,
        usersLoading,
        usersError,
        allAppointments,
        allAppointmentsLoading,
        allAppointmentsError,
    } = useDoctor()

    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editedAppointment, setEditedAppointment] = useState(null)

    // Prescription & Test Result states
    const [isAddingPrescription, setIsAddingPrescription] = useState(false)
    const [newPrescription, setNewPrescription] = useState({
        medication: '',
        dosage: '',
        duration: ''
    })
    const [isAddingTestResult, setIsAddingTestResult] = useState(false)
    const [newTestResult, setNewTestResult] = useState({
        test_name: '',
        result: '',
        date: '',
        status: 'Normal'
    })

    const [newAppointment, setNewAppointment] = useState({
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

    // appointment stats (memoized)
    const appointmentStats = useMemo(() => {
        const total = allAppointments?.length || 0
        const scheduled = (allAppointments || []).filter((a) => ['Scheduled', 'SCHEDULED', 'PENDING'].includes(a.status)).length
        const completed = (allAppointments || []).filter((a) => ['Completed', 'COMPLETED'].includes(a.status)).length
        const declined = (allAppointments || []).filter((a) => ['declined', 'DECLINED '].includes(a.status)).length
        return { total, scheduled, completed, declined }
    }, [allAppointments])

    console.log('appointment status:', appointmentStats)

    // Helper to get patient name
    const getPatientName = (patient) => {
        return typeof patient === 'object' ? patient?.full_name : patient
    }

    // filter appointments for table
    const filteredAppointments = useMemo(() => {
        if (!allAppointments) return []
        return allAppointments.filter((apt) => {
            const patientName = getPatientName(apt.patient)
            const matchesSearch =
                patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                apt.appointment_id?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus =
                filterStatus === 'all' || apt.status?.toLowerCase() === filterStatus.toLowerCase()
            return matchesSearch && matchesStatus
        })
    }, [allAppointments, searchQuery, filterStatus])

    // create appointment mutation
    const createAppointmentMutation = useMutation({
        mutationFn: async (payload) => {
            const body = {
                patient: payload.patient_id,
                patient_age: payload.patient_age,
                patient_gender: payload.patient_gender,
                date: payload.date,
                time: payload.time,
                type: payload.type,
                reason: payload.reason,
                duration: payload.duration,
                notes: payload.notes,
                doctor: user?.id,
            }
            const res = await api.post('/appointments/create/', body)
            return res.data
        },
        onSuccess: () => {
            toast.success('Appointment created successfully')
            queryClient.invalidateQueries({ queryKey: ['allAppointments'] })
            setIsNewAppointmentOpen(false)
            setNewAppointment({
                patient_id: '',
                patient_name: '',
                patient_age: undefined,
                patient_gender: '',
                date: '',
                time: '',
                type: '',
                reason: '',
                duration: '30',
                notes: '',
                doctor: '',
            })
        },
        onError: (err) => {
            const responseData = err?.response?.data
            if (responseData && typeof responseData === 'object') {
                const entries = Object.entries(responseData)
                if (entries.length > 0) {
                    entries.forEach(([key, value]) => {
                        if (Array.isArray(value)) {
                            value.forEach((m) => toast.error(`${key}: ${String(m)}`))
                        } else if (typeof value === 'string') {
                            toast.error(`${key}: ${value}`)
                        } else {
                            toast.error(`${key}: ${JSON.stringify(value)}`)
                        }
                    })
                    return
                }
            }
            toast.error(err?.message || 'Failed to create appointment')
        },
    })

    const changeAppointmentMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.patch(`/appointments/${id}/status/`, data)
            return res.data
        },
        onSuccess: () => {
            toast.success('Appointment status updated successfully')
            queryClient.invalidateQueries({ queryKey: ['allAppointments'] })
            // Don't close the dialog here - let user continue editing
        },
        onError: (err) => {
            toast.error(err?.response?.data?.detail || 'Failed to update appointment status')
        },
    })



    // Update appointment mutation
    const updateAppointmentMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.patch(`/appointments/${id}/update/`, data)
            return res.data
        },
        onSuccess: () => {
            toast.success('Appointment updated successfully')
            queryClient.invalidateQueries({ queryKey: ['allAppointments'] })
            setIsEditing(false)
        },
        onError: (err) => {
            toast.error(err?.response?.data?.detail || 'Failed to update appointment')
        },
    })

    // Cancel appointment mutation
    const cancelAppointmentMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.patch(`/appointments/${id}/status/`, { status: 'DECLINED' })
            return res.data
        },
        onSuccess: () => {
            toast.success('Appointment cancelled successfully')
            queryClient.invalidateQueries({ queryKey: ['allAppointments'] })
            setIsDetailsOpen(false)
        },
        onError: (err) => {
            toast.error(err?.response?.data?.detail || 'Failed to cancel appointment')
        },
    })

    const handleSelectPatient = (value) => {
        const selected = (users || []).find((u) => String(u.id) === String(value))
        setNewAppointment((prev) => ({
            ...prev,
            patient_id: String(value),
            patient_name: selected?.full_name || '',
            patient_age: selected?.age,
            patient_gender: selected?.gender || '',
        }))
    }

    const validateAppointment = (payload) => {
        if (!payload.patient_id) return 'Please select a patient'
        if (!payload.date) return 'Please select a date'
        if (!payload.time) return 'Please select a time'
        if (!payload.type) return 'Please select an appointment type'
        if (payload.date && dayjs(payload.date).isBefore(dayjs(), 'day')) {
            return 'Date cannot be in the past'
        }
        return null
    }

    const handleCreateAppointment = async () => {
        const validationError = validateAppointment(newAppointment)
        if (validationError) {
            toast.error(validationError)
            return
        }

        let formattedTime = newAppointment.time || ''
        if (formattedTime && /^\d{2}:\d{2}$/.test(formattedTime)) {
            formattedTime = dayjs(formattedTime, 'HH:mm').format('hh:mm A')
        }

        createAppointmentMutation.mutate({
            ...newAppointment,
            time: formattedTime,
        })
    }

    const handleViewDetails = (appointment) => {
        setSelectedAppointment(appointment)
        setEditedAppointment({ ...appointment })
        setIsEditing(false)
        setIsDetailsOpen(true)
    }

    const handleSaveChanges = () => {
        if (!editedAppointment) return

        const updateData = {
            date: editedAppointment.date,
            time: editedAppointment.time,
            type: editedAppointment.type,
            duration: editedAppointment.duration,
            reason: editedAppointment.reason,
            notes: editedAppointment.notes,
            vitals: editedAppointment.vitals,
            prescriptions: editedAppointment.prescriptions,
            test_results: editedAppointment.test_results,
        }

        updateAppointmentMutation.mutate({
            id: editedAppointment.appointment_id,
            data: updateData
        })
    }

    const handleCancelAppointment = () => {
        if (!selectedAppointment) return
        cancelAppointmentMutation.mutate(selectedAppointment.appointment_id)
    }

    const handleAddPrescription = () => {
        if (!newPrescription.medication || !newPrescription.dosage) {
            toast.error('Please fill in all prescription fields')
            return
        }
        const updatedPrescriptions = [...(editedAppointment.prescriptions || []), newPrescription]
        setEditedAppointment({ ...editedAppointment, prescriptions: updatedPrescriptions })
        setNewPrescription({ medication: '', dosage: '', duration: '' })
        setIsAddingPrescription(false)
        toast.success('Prescription added')
    }

    const handleRemovePrescription = (index) => {
        const updatedPrescriptions = editedAppointment.prescriptions.filter((_, i) => i !== index)
        setEditedAppointment({ ...editedAppointment, prescriptions: updatedPrescriptions })
        toast.success('Prescription removed')
    }

    const handleAddTestResult = () => {
        if (!newTestResult.test_name || !newTestResult.result) {
            toast.error('Please fill in all test result fields')
            return
        }
        const updatedResults = [...(editedAppointment.test_results || []), newTestResult]
        setEditedAppointment({ ...editedAppointment, test_results: updatedResults })
        setNewTestResult({ test_name: '', result: '', date: '', status: 'Normal' })
        setIsAddingTestResult(false)
        toast.success('Test result added')
    }

    const getStatusColor = (status) => {
        switch (String(status || '').toUpperCase()) {
            case 'SCHEDULED':
            case 'ACCEPTED':
                return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            case 'COMPLETED':
                return 'bg-green-100 text-green-700 hover:bg-green-100'
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
            case 'DECLINED':
                return 'bg-red-100 text-red-700 hover:bg-red-100'
        }
    }

    const renderSkeletonCard = () => (
        <Card>
            <CardContent className="p-6">
                <div className="animate-pulse flex items-center justify-between">
                    <div className="space-y-2 w-2/3">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-8 bg-gray-200 rounded w-2/5" />
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="mx-4 py-6">
            <Toaster position="top-right" />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and schedule patient appointments</p>
                </div>

                <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#021848] hover:bg-[#021848]/90 flex gap-2 items-center">
                            <Plus className="w-4 h-4" />
                            New Appointment
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Schedule New Appointment</DialogTitle>
                            <DialogDescription>
                                Fill in the details to create a new appointment for a patient
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-2">
                                <Label htmlFor="patient">Patient</Label>
                                {usersLoading ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-10 bg-gray-200 rounded" />
                                    </div>
                                ) : (
                                    <Select
                                        value={String(newAppointment.patient_id || '')}
                                        onValueChange={handleSelectPatient}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select patient" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {(users || []).length === 0 ? (
                                                <SelectItem value="" disabled>
                                                    No patients found
                                                </SelectItem>
                                            ) : (
                                                users.map((patient) => (
                                                    <SelectItem key={String(patient.id)} value={String(patient.id)}>
                                                        {patient.full_name} ({patient.id})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={newAppointment.date || ''}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="time">Time</Label>
                                    <Input
                                        id="time"
                                        type="time"
                                        value={newAppointment.time || ''}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Appointment Type</Label>
                                    <Select
                                        value={newAppointment.type || ''}
                                        onValueChange={(value) => setNewAppointment({ ...newAppointment, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INITIAL">Initial Appointment</SelectItem>
                                            <SelectItem value="FOLLOWUP">Follow Up</SelectItem>
                                            <SelectItem value="CHECKUP">Routine Checkup</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration (mins)</Label>
                                    <Select
                                        value={newAppointment.duration || '30'}
                                        onValueChange={(value) => setNewAppointment({ ...newAppointment, duration: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 mins</SelectItem>
                                            <SelectItem value="30">30 mins</SelectItem>
                                            <SelectItem value="45">45 mins</SelectItem>
                                            <SelectItem value="60">60 mins</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="reason">Reason for Visit</Label>
                                <Input
                                    id="reason"
                                    placeholder="Brief description of visit reason"
                                    value={newAppointment.reason || ''}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any additional information..."
                                    value={newAppointment.notes || ''}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-[#021848] hover:bg-[#021848]/90"
                                onClick={handleCreateAppointment}
                                disabled={createAppointmentMutation.isPending}
                            >
                                {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Appointment Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className='text-2xl'>Appointment Details</DialogTitle>
                                <DialogDescription>
                                    {selectedAppointment?.appointment_id} • {getPatientName(selectedAppointment?.patient)}
                                </DialogDescription>


                                <>
                                    <Label className='text-xs text-gray-500'>Update Status</Label>
                                    {editedAppointment && (
                                        <Select
                                            value={editedAppointment.status}
                                            onValueChange={(value) => {
                                                // Update local state immediately for UI feedback
                                                setEditedAppointment({ ...editedAppointment, status: value })

                                                // Call the status update endpoint
                                                changeAppointmentMutation.mutate({
                                                    id: editedAppointment.appointment_id,
                                                    data: { status: value }
                                                })
                                            }}
                                            disabled={changeAppointmentMutation.isPending}
                                        >
                                            <SelectTrigger className='mt-1'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value='SCHEDULED'>SCHEDULED</SelectItem>
                                                <SelectItem value='ACCEPTED'>ACCEPTED</SelectItem>
                                                <SelectItem value='COMPLETED'>COMPLETED</SelectItem>
                                                <SelectItem value='DECLINED'>DECLINED</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {changeAppointmentMutation.isPending && (
                                        <p className='text-xs text-gray-500 mt-1'>Updating status...</p>
                                    )}
                                </>
                            </div>
                            <div className='flex gap-2'>
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant='outline'
                                            onClick={() => {
                                                setIsEditing(false)
                                                setEditedAppointment({ ...selectedAppointment })
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveChanges}
                                            className='bg-[#021848] hover:bg-[#021848]/90'
                                            disabled={updateAppointmentMutation.isPending}
                                        >
                                            <Save className='w-4 h-4 mr-2' />
                                            {updateAppointmentMutation.isPending ? 'Saving...' : 'Save '}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className='bg-[#021848] hover:bg-[#021848]/90'
                                    >
                                        <Edit className='w-4 h-4 mr-2' />
                                        Edit
                                    </Button>
                                )}
                            </div>

                        </div>
                    </DialogHeader>

                    {editedAppointment && (
                        <div className='grid grid-cols-1 gap-6 mt-4'>
                            {/* Left Column - Basic Info */}
                            <div className='lg:col-span-1 space-y-4'>
                                <Card>
                                    <CardHeader>
                                        <div className='flex items-center justify-between'>
                                            <CardTitle className='text-base'>Appointment Info</CardTitle>
                                            <Badge className={getStatusColor(editedAppointment.status)}>
                                                {editedAppointment.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className='space-y-3'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                                                <User className='w-5 h-5 text-blue-600' />
                                            </div>
                                            <div>
                                                <p className='text-xs text-gray-500'>Patient</p>
                                                <p className='text-sm font-medium'>{getPatientName(editedAppointment.patient)}</p>
                                                <p className='text-xs text-gray-500'>
                                                    {editedAppointment.patient?.age}y • {editedAppointment.patient?.gender}
                                                </p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <Label className='text-xs text-gray-500'>Date</Label>
                                            {isEditing ? (
                                                <Input
                                                    type='date'
                                                    value={editedAppointment.date}
                                                    onChange={(e) => setEditedAppointment({ ...editedAppointment, date: e.target.value })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <div className='flex items-center gap-2 mt-1'>
                                                    <Calendar className='w-4 h-4 text-gray-400' />
                                                    <span className='text-sm font-medium'>
                                                        {dayjs(editedAppointment.date).format('MMMM D, YYYY')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <Label className='text-xs text-gray-500'>Time</Label>
                                            {isEditing ? (
                                                <Input
                                                    type='time'
                                                    value={editedAppointment.time}
                                                    onChange={(e) => setEditedAppointment({ ...editedAppointment, time: e.target.value })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <div className='flex items-center gap-2 mt-1'>
                                                    <Clock className='w-4 h-4 text-gray-400' />
                                                    <span className='text-sm font-medium'>{editedAppointment.time}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <Label className='text-xs text-gray-500'>Type</Label>
                                            {isEditing ? (
                                                <Select
                                                    value={editedAppointment.type}
                                                    onValueChange={(value) => setEditedAppointment({ ...editedAppointment, type: value })}
                                                >
                                                    <SelectTrigger className='mt-1'>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='INITIAL'>Initial</SelectItem>
                                                        <SelectItem value='FOLLOWUP'>Follow-up</SelectItem>
                                                        <SelectItem value='CHECKUP'>Checkup</SelectItem>
                                                        <SelectItem value='OTHER'>Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <p className='text-sm font-medium mt-1'>{editedAppointment.type}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label className='text-xs text-gray-500'>Duration</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editedAppointment.duration}
                                                    onChange={(e) => setEditedAppointment({ ...editedAppointment, duration: e.target.value })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <p className='text-sm font-medium mt-1'>{editedAppointment.duration} mins</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Vitals Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className='text-base flex items-center gap-2'>
                                            <Activity className='w-5 h-5' />
                                            Vital Signs
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className='space-y-3'>
                                        <div>
                                            <Label className='text-xs text-gray-500'>Blood Pressure</Label>
                                            {isEditing ? (
                                                <Input
                                                    placeholder='e.g., 120/80 mmHg'
                                                    value={editedAppointment.vitals?.blood_pressure || ''}
                                                    onChange={(e) => setEditedAppointment({
                                                        ...editedAppointment,
                                                        vitals: { ...(editedAppointment.vitals || {}), blood_pressure: e.target.value }
                                                    })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <p className='text-sm font-medium mt-1'>
                                                    {editedAppointment.vitals?.blood_pressure || 'Not recorded'}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className='text-xs text-gray-500'>Temperature</Label>
                                            {isEditing ? (
                                                <Input
                                                    placeholder='e.g., 98.6°F'
                                                    value={editedAppointment.vitals?.temperature || ''}
                                                    onChange={(e) => setEditedAppointment({
                                                        ...editedAppointment,
                                                        vitals: { ...(editedAppointment.vitals || {}), temperature: e.target.value }
                                                    })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <p className='text-sm font-medium mt-1'>
                                                    {editedAppointment.vitals?.temperature || 'Not recorded'}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className='text-xs text-gray-500'>Heart Rate</Label>
                                            {isEditing ? (
                                                <Input
                                                    placeholder='e.g., 75 bpm'
                                                    value={editedAppointment.vitals?.heart_rate || ''}
                                                    onChange={(e) => setEditedAppointment({
                                                        ...editedAppointment,
                                                        vitals: { ...(editedAppointment.vitals || {}), heart_rate: e.target.value }
                                                    })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <p className='text-sm font-medium mt-1'>
                                                    {editedAppointment.vitals?.heart_rate || 'Not recorded'}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className='text-xs text-gray-500'>Weight</Label>
                                            {isEditing ? (
                                                <Input
                                                    placeholder='e.g., 75 kg'
                                                    value={editedAppointment.vitals?.weight || ''}
                                                    onChange={(e) => setEditedAppointment({
                                                        ...editedAppointment,
                                                        vitals: { ...(editedAppointment.vitals || {}), weight: e.target.value }
                                                    })}
                                                    className='mt-1'
                                                />
                                            ) : (
                                                <p className='text-sm font-medium mt-1'>
                                                    {editedAppointment.vitals?.weight || 'Not recorded'}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Cancel Button */}
                                {!['DECLINED', 'CANCELLED'].includes(editedAppointment.status) && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant='destructive' className='w-full'>
                                                <Trash2 className='w-4 h-4 mr-2' />
                                                Cancel Appointment
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action will cancel the appointment. You can reschedule it later if needed.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>No, Keep it</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => cancelAppointmentMutation.mutate(selectedAppointment.appointment_id)}
                                                    className='bg-red-600 hover:bg-red-700'
                                                    disabled={cancelAppointmentMutation.isPending}
                                                >
                                                    {cancelAppointmentMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>

                            {/* Right Column - Tabs */}
                            <div className='lg:col-span-2'>
                                <Tabs defaultValue='overview' className='w-full'>
                                    <TabsList className='grid w-full grid-cols-3'>
                                        <TabsTrigger value='overview'>Overview</TabsTrigger>
                                        <TabsTrigger value='prescriptions'>Prescriptions</TabsTrigger>
                                        <TabsTrigger value='tests'>Test Results</TabsTrigger>
                                    </TabsList>

                                    {/* Overview Tab */}
                                    <TabsContent value='overview' className='space-y-4'>
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className='text-base'>Reason for Visit</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {isEditing ? (
                                                    <Input
                                                        value={editedAppointment.reason}
                                                        onChange={(e) => setEditedAppointment({ ...editedAppointment, reason: e.target.value })}
                                                    />
                                                ) : (
                                                    <p className='text-sm text-gray-700'>{editedAppointment.reason}</p>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className='text-base'>Notes</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {isEditing ? (
                                                    <Textarea
                                                        value={editedAppointment.notes}
                                                        onChange={(e) => setEditedAppointment({ ...editedAppointment, notes: e.target.value })}
                                                        rows={5}
                                                    />
                                                ) : (
                                                    <p className='text-sm text-gray-700'>{editedAppointment.notes || 'No notes added'}</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Prescriptions Tab */}
                                    <TabsContent value='prescriptions' className='space-y-4'>
                                        <Card>
                                            <CardHeader>
                                                <div className='flex items-center justify-between'>
                                                    <CardTitle className='text-base'>Prescriptions</CardTitle>
                                                    <Dialog open={isAddingPrescription} onOpenChange={setIsAddingPrescription}>
                                                        <DialogTrigger asChild>
                                                            <Button size='sm' className='bg-[#021848]'>
                                                                <Plus className='w-4 h-4 mr-2' />
                                                                Add Prescription
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Add Prescription</DialogTitle>
                                                                <DialogDescription>
                                                                    Enter the prescription details below
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className='space-y-4'>
                                                                <div>
                                                                    <Label>Medication Name</Label>
                                                                    <Input
                                                                        placeholder='e.g., Amoxicillin 500mg'
                                                                        value={newPrescription.medication}
                                                                        onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Dosage</Label>
                                                                    <Input
                                                                        placeholder='e.g., Twice daily after meals'
                                                                        value={newPrescription.dosage}
                                                                        onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Duration</Label>
                                                                    <Input
                                                                        placeholder='e.g., 7 days'
                                                                        value={newPrescription.duration}
                                                                        onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant='outline' onClick={() => setIsAddingPrescription(false)}>
                                                                    Cancel
                                                                </Button>
                                                                <Button onClick={handleAddPrescription} className='bg-[#021848]'>
                                                                    Add Prescription
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {editedAppointment.prescriptions && editedAppointment.prescriptions.length > 0 ? (
                                                    <div className='space-y-3'>
                                                        {editedAppointment.prescriptions.map((prescription, index) => (
                                                            <div key={index} className='border rounded-lg p-4 relative'>
                                                                {isEditing && (
                                                                    <Button
                                                                        variant='ghost'
                                                                        size='sm'
                                                                        className='absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        onClick={() => handleRemovePrescription(index)}
                                                                    >
                                                                        <X className='w-4 h-4' />
                                                                    </Button>
                                                                )}
                                                                <h4 className='font-semibold text-sm mb-1'>{prescription.medication}</h4>
                                                                <p className='text-sm text-gray-600'>
                                                                    <span className='font-medium'>Dosage:</span> {prescription.dosage}
                                                                </p>
                                                                <p className='text-sm text-gray-600'>
                                                                    <span className='font-medium'>Duration:</span> {prescription.duration}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className='text-sm text-gray-500 text-center py-8'>
                                                        No prescriptions added yet
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Test Results Tab */}
                                    <TabsContent value='tests' className='space-y-4'>
                                        <Card>
                                            <CardHeader>
                                                <div className='flex items-center justify-between'>
                                                    <CardTitle className='text-base'>Test Results</CardTitle>
                                                    <Dialog open={isAddingTestResult} onOpenChange={setIsAddingTestResult}>
                                                        <DialogTrigger asChild>
                                                            <Button size='sm' className='bg-[#021848]'>
                                                                <Plus className='w-4 h-4 mr-2' />
                                                                Add Test Result
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Add Test Result</DialogTitle>
                                                                <DialogDescription>
                                                                    Enter the test result details below
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className='space-y-4'>
                                                                <div>
                                                                    <Label>Test Name</Label>
                                                                    <Input
                                                                        placeholder='e.g., Blood Sugar Test'
                                                                        value={newTestResult.test_name}
                                                                        onChange={(e) => setNewTestResult({ ...newTestResult, test_name: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Result</Label>
                                                                    <Input
                                                                        placeholder='e.g., 120 mg/dL'
                                                                        value={newTestResult.result}
                                                                        onChange={(e) => setNewTestResult({ ...newTestResult, result: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Date</Label>
                                                                    <Input
                                                                        type='date'
                                                                        value={newTestResult.date}
                                                                        onChange={(e) => setNewTestResult({ ...newTestResult, date: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Status</Label>
                                                                    <Select
                                                                        value={newTestResult.status}
                                                                        onValueChange={(value) => setNewTestResult({ ...newTestResult, status: value })}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value='Normal'>Normal</SelectItem>
                                                                            <SelectItem value='Abnormal'>Abnormal</SelectItem>
                                                                            <SelectItem value='Borderline'>Borderline</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant='outline' onClick={() => setIsAddingTestResult(false)}>
                                                                    Cancel
                                                                </Button>
                                                                <Button onClick={handleAddTestResult} className='bg-[#021848]'>
                                                                    Add Result
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {editedAppointment.test_results && editedAppointment.test_results.length > 0 ? (
                                                    <div className='space-y-3'>
                                                        {editedAppointment.test_results.map((test, index) => (
                                                            <div key={index} className='border rounded-lg p-4'>
                                                                <div className='flex justify-between items-start mb-2'>
                                                                    <h4 className='font-semibold text-sm'>{test.test_name}</h4>
                                                                    <Badge variant='outline' className={
                                                                        test.status === 'Normal' ? 'border-green-600 text-green-600 p-1' :
                                                                            test.status === 'Abnormal' ? 'border-red-600 text-red-600 p-1' :
                                                                                'border-yellow-600 text-yellow-600 p-1'
                                                                    }>
                                                                        {test.status}
                                                                    </Badge>
                                                                </div>
                                                                <p className='text-sm text-gray-700 mb-1'>
                                                                    <span className='font-medium'>Result:</span> {test.result}
                                                                </p>
                                                                {test.date && (
                                                                    <p className='text-xs text-gray-500'>
                                                                        {dayjs(test.date).format('MMM D, YYYY')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className='text-sm text-gray-500 text-center py-8'>
                                                        No test results available
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {allAppointmentsLoading ? (
                    <>
                        {renderSkeletonCard()}
                        {renderSkeletonCard()}
                        {renderSkeletonCard()}
                        {renderSkeletonCard()}
                    </>
                ) : (
                    <>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total</p>
                                        <p className="text-3xl font-bold text-gray-900">{appointmentStats.total}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <CalendarDays className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Scheduled</p>
                                        <p className="text-3xl font-bold text-blue-600">{appointmentStats.scheduled}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-green-600">{appointmentStats.completed}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">DECLINED </p>
                                        <p className="text-3xl font-bold text-red-600">{appointmentStats.DECLINED}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by patient name or appointment ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="DECLINED ">DECLINED </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appointment History</CardTitle>
                    <CardDescription>View and manage all patient appointments</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-auto max-h-[600px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                <TableRow>
                                    <TableHead>Appointment ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {allAppointmentsLoading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="py-6">
                                                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                            </TableCell>
                                            <TableCell>
                                                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((appointment) => (
                                        <TableRow key={appointment.appointment_id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{appointment.appointment_id}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{getPatientName(appointment.patient)}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {appointment.patient?.age}yrs • {appointment.patient?.email}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium">{dayjs(appointment.date).format('MMM D, YYYY')}</p>
                                                        <p className="text-sm text-gray-500">{appointment.time}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span>{appointment.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{appointment.duration}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="hover:bg-blue-50"
                                                    onClick={() => handleViewDetails(appointment)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                            No appointments found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {!allAppointmentsLoading && (allAppointments || []).length > 0 && (
                        <div className="text-sm text-gray-500 mt-4 pt-4 border-t">
                            Showing {filteredAppointments.length} of {allAppointments?.length || 0} appointments
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default Page
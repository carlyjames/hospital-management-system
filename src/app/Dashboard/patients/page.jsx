'use client'

import React, { useEffect, useState } from 'react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import dayjs from 'dayjs'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Trash2, Filter, X, Check, XIcon, Star, ChevronDown, ChevronRight, User, SquarePen, Plus, Loader2 } from "lucide-react";
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
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
import { useDoctor } from '@/hooks/useDoctor'
import { toast } from 'sonner'

const Page = () => {
    const { users, usersLoading, addPatient, addPatientLoading } = useDoctor();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        blood_group: '',
        role: 'ACTIVE'
    });

    // Filter only patients
    const patients = users?.filter(user => user.role === 'PATIENT') || [];

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await addPatient(formData);
            toast.success('Patient added successfully');
            setIsDialogOpen(false);
            // Reset form
            setFormData({
                name: '',
                age: '',
                gender: '',
                email: '',
                phone: '',
                address: '',
                blood_group: '',
                role: 'ACTIVE'
            });
        } catch (error) {
            toast.error('Failed to add patient');
        }
    };

    return (
        <div className='mx-4'>

            <div className="mt-6 border rounded-lg">
                <div className="relative overflow-auto lg:h-[calc(80vh-80px)] h-[80vh]">
                    {usersLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-600">Loading patients...</span>
                        </div>
                    ) : patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <User className="h-16 w-16 mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No patients found</p>
                            <p className="text-sm">Add your first patient to get started</p>
                        </div>
                    ) : (
                        <Table className="relative">
                            <TableHeader className="bg-gray-50 sticky top-0 z-10 border-b">
                                <TableRow>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Patient ID
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Patient's Name
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Email
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Age
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Gender
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Phone
                                    </TableHead>
                                    <TableHead className="text-sm font-semibold bg-gray-50 sticky top-0">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patients.map((patient) => (
                                    <TableRow key={patient.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">
                                            {patient.id || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {patient.full_name}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {patient.email}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {patient.age || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {patient.gender || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {patient.phone_number || 'N/A'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex gap-3 items-center">
                                                <Link
                                                    href={`/dashboard/patients/${patient.id}`}
                                                    title={`View ${patient.full_name}'s details`}
                                                >
                                                    <Eye className='cursor-pointer text-gray-500 hover:text-blue-600 transition-colors' size={18} />
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <div className="text-sm text-gray-500 p-4 border-t bg-gray-50">
                    Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    )
}

export default Page
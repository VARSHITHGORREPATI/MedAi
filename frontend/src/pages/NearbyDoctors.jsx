import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Search, Phone, Video, MessageSquare, Calendar,
  Star, Clock, Stethoscope, ChevronDown, ChevronUp, X,
  Navigation, RefreshCw, AlertCircle, User, Loader2, Filter,
  Heart, Brain, Bone, Eye, Baby, Shield, Zap, Activity,
  CheckCircle, XCircle
} from 'lucide-react';
import ChatLayout from '../components/ChatLayout';

const SPECIALTIES = [
  { id: 'all', label: 'All Doctors', icon: Stethoscope },
  { id: 'General Physician', label: 'General', icon: Activity },
  { id: 'Cardiologist', label: 'Cardiologist', icon: Heart },
  { id: 'Neurologist', label: 'Neurologist', icon: Brain },
  { id: 'Orthopedic', label: 'Orthopedic', icon: Bone },
  { id: 'Ophthalmologist', label: 'Eye Doctor', icon: Eye },
  { id: 'Pediatrician', label: 'Pediatrics', icon: Baby },
  { id: 'Dermatologist', label: 'Dermatologist', icon: Shield },
  { id: 'Psychiatrist', label: 'Psychiatrist', icon: Brain },
  { id: 'Gynecologist', label: 'Gynecologist', icon: User },
  { id: 'Dentist', label: 'Dentist', icon: Zap },
];

const CITIES = [
  'Delhi',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Indore',
  'Chandigarh',
  'Kochi',
  'Visakhapatnam',
  'Surat',
];

const MOCK_DOCTORS = [
  {
    _id: 'mock1',
    name: 'Dr. Priya Sharma',
    specialty: 'General Physician',
    location: 'Hyderabad, Telangana',
    qualification: 'MBBS, MD',
    experience_years: 12,
    consultation_fee: 500,
    rating: 4.8,
    reviews: 234,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Telugu', 'Hindi'],
    bio: 'Experienced general physician specializing in preventive care and chronic disease management.',
    next_available: 'Today, 4:00 PM',
    distance: '1.2 km',
  },
  {
    _id: 'mock2',
    name: 'Dr. Rajan Mehta',
    specialty: 'Cardiologist',
    location: 'Hyderabad, Telangana',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 18,
    consultation_fee: 1200,
    rating: 4.9,
    reviews: 412,
    available_for_message: true,
    available_for_voice: false,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Senior cardiologist with expertise in interventional cardiology and heart failure management.',
    next_available: 'Tomorrow, 10:00 AM',
    distance: '2.5 km',
  },
  {
    _id: 'mock3',
    name: 'Dr. Sneha Reddy',
    specialty: 'Pediatrician',
    location: 'Hyderabad, Telangana',
    qualification: 'MBBS, MD (Pediatrics)',
    experience_years: 8,
    consultation_fee: 600,
    rating: 4.7,
    reviews: 189,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Telugu'],
    bio: 'Child health specialist focused on growth, development, and immunization.',
    next_available: 'Today, 6:30 PM',
    distance: '0.8 km',
  },
  {
    _id: 'mock4',
    name: 'Dr. Arjun Nair',
    specialty: 'Orthopedic',
    location: 'Hyderabad, Telangana',
    qualification: 'MBBS, MS (Ortho)',
    experience_years: 15,
    consultation_fee: 900,
    rating: 4.6,
    reviews: 156,
    available_for_message: false,
    available_for_voice: true,
    available_for_video: false,
    available_for_appointment: true,
    languages: ['English', 'Malayalam', 'Hindi'],
    bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries.',
    next_available: 'Today, 5:00 PM',
    distance: '3.1 km',
  },
  {
    _id: 'mock5',
    name: 'Dr. Fatima Khan',
    specialty: 'Dermatologist',
    location: 'Hyderabad, Telangana',
    qualification: 'MBBS, MD (Dermatology)',
    experience_years: 10,
    consultation_fee: 700,
    rating: 4.8,
    reviews: 297,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Urdu', 'Hindi'],
    bio: 'Skin specialist with expertise in cosmetic dermatology and skin disease treatment.',
    next_available: 'Tomorrow, 11:00 AM',
    distance: '1.7 km',
  },
  {
    _id: 'mock6',
    name: 'Dr. Vijay Kumar',
    specialty: 'Neurologist',
    location: 'Hyderabad, Telangana',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience_years: 20,
    consultation_fee: 1500,
    rating: 5.0,
    reviews: 543,
    available_for_message: true,
    available_for_voice: false,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Telugu', 'Hindi'],
    bio: 'Leading neurologist with expertise in epilepsy, stroke, and movement disorders.',
    next_available: 'Today, 7:00 PM',
    distance: '4.2 km',
  },
  // Delhi Doctors
  {
    _id: 'mock7',
    name: 'Dr. Rohan Verma',
    specialty: 'Cardiologist',
    location: 'Delhi, India',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 22,
    consultation_fee: 1500,
    rating: 4.9,
    reviews: 612,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Expert cardiologist with 22 years of experience in cardiac interventions.',
    next_available: 'Today, 3:00 PM',
    distance: '2.1 km',
  },
  {
    _id: 'mock8',
    name: 'Dr. Anjali Singh',
    specialty: 'General Physician',
    location: 'Delhi, India',
    qualification: 'MBBS, MD',
    experience_years: 14,
    consultation_fee: 600,
    rating: 4.7,
    reviews: 389,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Compassionate GP focused on preventive medicine and family health.',
    next_available: 'Today, 2:00 PM',
    distance: '1.5 km',
  },
  {
    _id: 'mock9',
    name: 'Dr. Prakash Gupta',
    specialty: 'Orthopedic',
    location: 'Delhi, India',
    qualification: 'MBBS, MS (Ortho), MCh',
    experience_years: 19,
    consultation_fee: 1000,
    rating: 4.8,
    reviews: 456,
    available_for_message: true,
    available_for_voice: false,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Senior orthopedic surgeon specializing in joint replacement.',
    next_available: 'Tomorrow, 9:00 AM',
    distance: '2.8 km',
  },
  {
    _id: 'mock10',
    name: 'Dr. Neha Pathak',
    specialty: 'Pediatrician',
    location: 'Delhi, India',
    qualification: 'MBBS, MD (Pediatrics)',
    experience_years: 11,
    consultation_fee: 700,
    rating: 4.9,
    reviews: 534,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Pediatric specialist with expertise in child development and vaccines.',
    next_available: 'Today, 4:30 PM',
    distance: '1.2 km',
  },
  // Mumbai Doctors
  {
    _id: 'mock11',
    name: 'Dr. Rajesh Patel',
    specialty: 'General Physician',
    location: 'Mumbai, Maharashtra',
    qualification: 'MBBS, MD',
    experience_years: 16,
    consultation_fee: 650,
    rating: 4.8,
    reviews: 402,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Gujarati', 'Hindi'],
    bio: 'Experienced general practitioner with focus on chronic disease management.',
    next_available: 'Today, 5:00 PM',
    distance: '2.3 km',
  },
  {
    _id: 'mock12',
    name: 'Dr. Divya Shah',
    specialty: 'Dermatologist',
    location: 'Mumbai, Maharashtra',
    qualification: 'MBBS, MD (Dermatology)',
    experience_years: 12,
    consultation_fee: 800,
    rating: 4.7,
    reviews: 368,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Gujarati', 'Hindi'],
    bio: 'Skin and cosmetic specialist with expertise in anti-aging treatments.',
    next_available: 'Tomorrow, 11:00 AM',
    distance: '1.8 km',
  },
  // Bangalore Doctors
  {
    _id: 'mock13',
    name: 'Dr. Arjun Reddy',
    specialty: 'Neurologist',
    location: 'Bangalore, Karnataka',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience_years: 18,
    consultation_fee: 1400,
    rating: 4.9,
    reviews: 489,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Kannada', 'Telugu'],
    bio: 'Leading neurologist specializing in migraine and neurological disorders.',
    next_available: 'Today, 6:00 PM',
    distance: '2.5 km',
  },
  {
    _id: 'mock14',
    name: 'Dr. Karthik Iyer',
    specialty: 'Cardiologist',
    location: 'Bangalore, Karnataka',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 15,
    consultation_fee: 1200,
    rating: 4.8,
    reviews: 412,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Kannada', 'Tamil'],
    bio: 'Expert in cardiac care and preventive cardiology.',
    next_available: 'Today, 4:00 PM',
    distance: '1.9 km',
  },
  {
    _id: 'mock15',
    name: 'Dr. Sunita Rao',
    specialty: 'General Physician',
    location: 'Bangalore, Karnataka',
    qualification: 'MBBS, MD',
    experience_years: 12,
    consultation_fee: 500,
    rating: 4.7,
    reviews: 356,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Kannada', 'Hindi'],
    bio: 'Compassionate GP with focus on holistic health.',
    next_available: 'Today, 3:00 PM',
    distance: '1.2 km',
  },
  // Chennai Doctors
  {
    _id: 'mock16',
    name: 'Dr. Ramesh Kumar',
    specialty: 'Orthopedic',
    location: 'Chennai, Tamil Nadu',
    qualification: 'MBBS, MS (Ortho), MCh',
    experience_years: 17,
    consultation_fee: 900,
    rating: 4.8,
    reviews: 378,
    available_for_message: true,
    available_for_voice: false,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Tamil', 'Hindi'],
    bio: 'Specialist in orthopedic surgery and trauma care.',
    next_available: 'Tomorrow, 10:00 AM',
    distance: '2.2 km',
  },
  {
    _id: 'mock17',
    name: 'Dr. Lakshmi Subramanian',
    specialty: 'Pediatrician',
    location: 'Chennai, Tamil Nadu',
    qualification: 'MBBS, MD (Pediatrics)',
    experience_years: 13,
    consultation_fee: 650,
    rating: 4.9,
    reviews: 445,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Tamil', 'Malayalam'],
    bio: 'Child health specialist with expertise in development.',
    next_available: 'Today, 5:00 PM',
    distance: '1.6 km',
  },
  {
    _id: 'mock18',
    name: 'Dr. Vijayakumar Pillai',
    specialty: 'Cardiologist',
    location: 'Chennai, Tamil Nadu',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 20,
    consultation_fee: 1300,
    rating: 5.0,
    reviews: 567,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Tamil', 'Hindi'],
    bio: 'Senior cardiologist with expertise in interventional cardiology.',
    next_available: 'Today, 7:00 PM',
    distance: '2.8 km',
  },
  // Pune Doctors
  {
    _id: 'mock19',
    name: 'Dr. Sanjay Kulkarni',
    specialty: 'General Physician',
    location: 'Pune, Maharashtra',
    qualification: 'MBBS, MD',
    experience_years: 14,
    consultation_fee: 550,
    rating: 4.7,
    reviews: 334,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Marathi', 'Hindi'],
    bio: 'Experienced GP with focus on preventive healthcare.',
    next_available: 'Today, 2:00 PM',
    distance: '1.4 km',
  },
  {
    _id: 'mock20',
    name: 'Dr. Priya Deshmukh',
    specialty: 'Dermatologist',
    location: 'Pune, Maharashtra',
    qualification: 'MBBS, MD (Dermatology)',
    experience_years: 10,
    consultation_fee: 750,
    rating: 4.8,
    reviews: 289,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Marathi', 'Hindi'],
    bio: 'Skin specialist with expertise in acne and skin conditions.',
    next_available: 'Tomorrow, 9:00 AM',
    distance: '1.8 km',
  },
  // Kolkata Doctors
  {
    _id: 'mock21',
    name: 'Dr. Amitabh Chatterjee',
    specialty: 'Neurologist',
    location: 'Kolkata, West Bengal',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience_years: 19,
    consultation_fee: 1350,
    rating: 4.9,
    reviews: 421,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Bengali', 'Hindi'],
    bio: 'Expert in neurological disorders and stroke management.',
    next_available: 'Today, 6:30 PM',
    distance: '2.3 km',
  },
  {
    _id: 'mock22',
    name: 'Dr. Sheila Patel',
    specialty: 'General Physician',
    location: 'Kolkata, West Bengal',
    qualification: 'MBBS, MD',
    experience_years: 11,
    consultation_fee: 500,
    rating: 4.6,
    reviews: 298,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Bengali', 'Hindi'],
    bio: 'Dedicated family physician with community healthcare experience.',
    next_available: 'Today, 4:00 PM',
    distance: '1.5 km',
  },
  // Ahmedabad Doctors
  {
    _id: 'mock23',
    name: 'Dr. Rajiv Verma',
    specialty: 'Cardiologist',
    location: 'Ahmedabad, Gujarat',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 16,
    consultation_fee: 1150,
    rating: 4.8,
    reviews: 367,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Gujarati', 'Hindi'],
    bio: 'Skilled cardiologist with expertise in cardiac interventions.',
    next_available: 'Today, 5:30 PM',
    distance: '2.1 km',
  },
  {
    _id: 'mock24',
    name: 'Dr. Neeta Gupta',
    specialty: 'Pediatrician',
    location: 'Ahmedabad, Gujarat',
    qualification: 'MBBS, MD (Pediatrics)',
    experience_years: 9,
    consultation_fee: 600,
    rating: 4.7,
    reviews: 312,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Gujarati', 'Hindi'],
    bio: 'Pediatrician focused on child immunization and growth.',
    next_available: 'Tomorrow, 11:00 AM',
    distance: '1.3 km',
  },
  // Jaipur Doctors
  {
    _id: 'mock25',
    name: 'Dr. Anil Sharma',
    specialty: 'General Physician',
    location: 'Jaipur, Rajasthan',
    qualification: 'MBBS, MD',
    experience_years: 13,
    consultation_fee: 520,
    rating: 4.7,
    reviews: 325,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Experienced physician offering comprehensive family healthcare.',
    next_available: 'Today, 3:30 PM',
    distance: '1.7 km',
  },
  {
    _id: 'mock26',
    name: 'Dr. Divya Saxena',
    specialty: 'Dermatologist',
    location: 'Jaipur, Rajasthan',
    qualification: 'MBBS, MD (Dermatology)',
    experience_years: 11,
    consultation_fee: 700,
    rating: 4.8,
    reviews: 276,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Skin specialist with focus on aesthetic treatments.',
    next_available: 'Today, 6:00 PM',
    distance: '2.0 km',
  },
  // Lucknow Doctors
  {
    _id: 'mock27',
    name: 'Dr. Neeraj Kumar',
    specialty: 'Orthopedic',
    location: 'Lucknow, Uttar Pradesh',
    qualification: 'MBBS, MS (Ortho)',
    experience_years: 14,
    consultation_fee: 850,
    rating: 4.7,
    reviews: 289,
    available_for_message: true,
    available_for_voice: false,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Orthopedic surgeon specializing in joint care.',
    next_available: 'Tomorrow, 10:30 AM',
    distance: '2.2 km',
  },
  {
    _id: 'mock28',
    name: 'Dr. Pooja Singh',
    specialty: 'General Physician',
    location: 'Lucknow, Uttar Pradesh',
    qualification: 'MBBS, MD',
    experience_years: 10,
    consultation_fee: 480,
    rating: 4.6,
    reviews: 267,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Compassionate doctor offering personalized patient care.',
    next_available: 'Today, 4:00 PM',
    distance: '1.4 km',
  },
  // Indore Doctors
  {
    _id: 'mock29',
    name: 'Dr. Mahesh Patel',
    specialty: 'Cardiologist',
    location: 'Indore, Madhya Pradesh',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 17,
    consultation_fee: 1100,
    rating: 4.8,
    reviews: 354,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Hindi'],
    bio: 'Expert cardiologist with experience in heart disease management.',
    next_available: 'Today, 5:00 PM',
    distance: '2.0 km',
  },
  // Chandigarh Doctors
  {
    _id: 'mock30',
    name: 'Dr. Ravi Kapoor',
    specialty: 'General Physician',
    location: 'Chandigarh, Chandigarh',
    qualification: 'MBBS, MD',
    experience_years: 12,
    consultation_fee: 550,
    rating: 4.7,
    reviews: 301,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Punjabi', 'Hindi'],
    bio: 'Dedicated family physician with patient-centric approach.',
    next_available: 'Today, 3:00 PM',
    distance: '1.6 km',
  },
  {
    _id: 'mock31',
    name: 'Dr. Simran Kaur',
    specialty: 'Pediatrician',
    location: 'Chandigarh, Chandigarh',
    qualification: 'MBBS, MD (Pediatrics)',
    experience_years: 8,
    consultation_fee: 600,
    rating: 4.8,
    reviews: 289,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Punjabi', 'Hindi'],
    bio: 'Pediatrician specializing in child wellness and vaccines.',
    next_available: 'Tomorrow, 9:30 AM',
    distance: '1.8 km',
  },
  // Kochi Doctors
  {
    _id: 'mock32',
    name: 'Dr. Gopal Menon',
    specialty: 'Neurologist',
    location: 'Kochi, Kerala',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience_years: 16,
    consultation_fee: 1250,
    rating: 4.9,
    reviews: 398,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Malayalam', 'Tamil'],
    bio: 'Leading neurologist with expertise in neurodegenerative disorders.',
    next_available: 'Today, 6:30 PM',
    distance: '2.4 km',
  },
  {
    _id: 'mock33',
    name: 'Dr. Anjana Krishnan',
    specialty: 'General Physician',
    location: 'Kochi, Kerala',
    qualification: 'MBBS, MD',
    experience_years: 11,
    consultation_fee: 530,
    rating: 4.7,
    reviews: 276,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Malayalam', 'Tamil'],
    bio: 'Holistic approach to general and preventive medicine.',
    next_available: 'Today, 4:00 PM',
    distance: '1.5 km',
  },
  // Visakhapatnam Doctors
  {
    _id: 'mock34',
    name: 'Dr. Suresh Naidu',
    specialty: 'Orthopedic',
    location: 'Visakhapatnam, Andhra Pradesh',
    qualification: 'MBBS, MS (Ortho), MCh',
    experience_years: 15,
    consultation_fee: 900,
    rating: 4.8,
    reviews: 312,
    available_for_message: true,
    available_for_voice: false,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Telugu', 'Hindi'],
    bio: 'Skilled orthopedic surgeon with trauma specialization.',
    next_available: 'Tomorrow, 11:00 AM',
    distance: '2.3 km',
  },
  {
    _id: 'mock35',
    name: 'Dr. Lavanya Rao',
    specialty: 'Pediatrician',
    location: 'Visakhapatnam, Andhra Pradesh',
    qualification: 'MBBS, MD (Pediatrics)',
    experience_years: 10,
    consultation_fee: 620,
    rating: 4.8,
    reviews: 245,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Telugu', 'Hindi'],
    bio: 'Pediatric specialist with focus on child development.',
    next_available: 'Today, 5:00 PM',
    distance: '1.7 km',
  },
  // Surat Doctors
  {
    _id: 'mock36',
    name: 'Dr. Yatin Shah',
    specialty: 'Cardiologist',
    location: 'Surat, Gujarat',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience_years: 18,
    consultation_fee: 1200,
    rating: 4.9,
    reviews: 401,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Gujarati', 'Hindi'],
    bio: 'Experienced cardiologist with expertise in coronary interventions.',
    next_available: 'Today, 6:00 PM',
    distance: '2.2 km',
  },
  {
    _id: 'mock37',
    name: 'Dr. Meena Desai',
    specialty: 'Dermatologist',
    location: 'Surat, Gujarat',
    qualification: 'MBBS, MD (Dermatology)',
    experience_years: 9,
    consultation_fee: 720,
    rating: 4.7,
    reviews: 234,
    available_for_message: true,
    available_for_voice: true,
    available_for_video: true,
    available_for_appointment: true,
    languages: ['English', 'Gujarati', 'Hindi'],
    bio: 'Skin specialist with expertise in cosmetic and clinical dermatology.',
    next_available: 'Tomorrow, 10:00 AM',
    distance: '1.9 km',
  },
];

function LocationBanner({ location, onRefresh, loading }) {
  return (
    <div className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Your Location</p>
          <p className="text-gray-900 dark:text-white font-semibold text-sm">
            {loading ? 'Detecting location...' : location || 'Location not detected'}
          </p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {loading ? 'Detecting...' : 'Refresh'}
      </button>
    </div>
  );
}

function ActionModal({ doctor, action, onClose }) {
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1c2127] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-2">
            {action === 'message' && 'Message Sent!'}
            {action === 'voice' && 'Call Initiated!'}
            {action === 'video' && 'Video Call Starting!'}
            {action === 'appointment' && 'Appointment Booked!'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {action === 'message' && `Your message to ${doctor.name} has been sent.`}
            {action === 'voice' && `Connecting you to ${doctor.name}...`}
            {action === 'video' && `Joining video session with ${doctor.name}...`}
            {action === 'appointment' && `Your appointment with ${doctor.name} is confirmed.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1c2127] rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#283039]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {action === 'message' && <MessageSquare className="w-5 h-5 text-primary" />}
              {action === 'voice' && <Phone className="w-5 h-5 text-primary" />}
              {action === 'video' && <Video className="w-5 h-5 text-primary" />}
              {action === 'appointment' && <Calendar className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold">
                {action === 'message' && 'Send Message'}
                {action === 'voice' && 'Voice Call'}
                {action === 'video' && 'Video Consultation'}
                {action === 'appointment' && 'Book Appointment'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{doctor.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] text-gray-500 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {(action === 'voice' || action === 'video') && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">{doctor.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{doctor.specialty}</p>
              <p className="text-green-500 text-sm mt-2 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Available Now
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-3">
                {action === 'voice' ? 'Consultation fee: ₹' : 'Video consultation fee: ₹'}{doctor.consultation_fee}
              </p>
            </div>
          )}

          {action === 'message' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe your symptoms or ask a question..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary resize-none text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Consultation fee: ₹{doctor.consultation_fee}</p>
            </>
          )}

          {action === 'appointment' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Time Slot</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                        selectedTime === slot
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 dark:bg-[#111418] border border-gray-200 dark:border-[#283039] text-gray-700 dark:text-gray-300 hover:border-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-[#111418] rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Consultation Fee</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{doctor.consultation_fee}</span>
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              (action === 'message' && !message.trim()) ||
              (action === 'appointment' && (!selectedDate || !selectedTime))
            }
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action === 'message' && 'Send Message'}
            {action === 'voice' && 'Start Voice Call'}
            {action === 'video' && 'Join Video Call'}
            {action === 'appointment' && 'Confirm Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DoctorCard({ doctor, onAction }) {
  const [expanded, setExpanded] = useState(false);

  const initials = doctor.name.split(' ').filter(p => p !== 'Dr.').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const actionButtons = [
    { key: 'message', icon: MessageSquare, label: 'Message', available: doctor.available_for_message, color: 'bg-blue-500 hover:bg-blue-600' },
    { key: 'voice', icon: Phone, label: 'Voice Call', available: doctor.available_for_voice, color: 'bg-green-500 hover:bg-green-600' },
    { key: 'video', icon: Video, label: 'Video Call', available: doctor.available_for_video, color: 'bg-purple-500 hover:bg-purple-600' },
    { key: 'appointment', icon: Calendar, label: 'Appointment', available: doctor.available_for_appointment, color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  return (
    <div className="bg-white dark:bg-[#1b252f] border border-gray-100 dark:border-[#283039] rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-200 hover:shadow-lg dark:hover:shadow-primary/5">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 dark:text-white font-bold text-base truncate">{doctor.name}</h3>
            <p className="text-primary text-sm font-medium">{doctor.specialty}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">{doctor.rating}</span>
                <span className="text-gray-400 text-xs">({doctor.reviews})</span>
              </div>
              {doctor.distance && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                  <MapPin className="w-3 h-3" />
                  {doctor.distance}
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-gray-900 dark:text-white font-bold text-sm">₹{doctor.consultation_fee}</p>
            <p className="text-gray-400 text-xs">per visit</p>
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 dark:bg-[#283039] text-gray-600 dark:text-gray-300 text-xs">
            <Stethoscope className="w-3 h-3" />
            {doctor.experience_years}y experience
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 dark:bg-[#283039] text-gray-600 dark:text-gray-300 text-xs">
            <MapPin className="w-3 h-3" />
            {doctor.location?.split(',')[0]}
          </span>
          {doctor.next_available && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
              <Clock className="w-3 h-3" />
              {doctor.next_available}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {actionButtons.map(({ key, icon: Icon, label, available, color }) => (
            <button
              key={key}
              onClick={() => available && onAction(doctor, key)}
              title={available ? label : `${label} not available`}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-white text-xs font-medium transition-all ${
                available ? `${color} shadow-sm` : 'bg-gray-100 dark:bg-[#283039] text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="leading-none">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors py-1"
        >
          {expanded ? 'Less info' : 'More info'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-50 dark:border-[#283039] space-y-3">
          {doctor.qualification && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Qualification</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{doctor.qualification}</p>
            </div>
          )}
          {doctor.bio && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">About</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{doctor.bio}</p>
            </div>
          )}
          {doctor.languages?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Languages</p>
              <div className="flex flex-wrap gap-1">
                {doctor.languages.map(lang => (
                  <span key={lang} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{lang}</span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Availability</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'available_for_message', label: 'Message', icon: MessageSquare },
                { key: 'available_for_voice', label: 'Voice', icon: Phone },
                { key: 'available_for_video', label: 'Video', icon: Video },
                { key: 'available_for_appointment', label: 'In-person', icon: Calendar },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  doctor[key]
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-gray-50 dark:bg-[#283039] text-gray-400'
                }`}>
                  {doctor[key] ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NearbyDoctors() {
  const [locationName, setLocationName] = useState('');
  const [searchLocation, setSearchLocation] = useState(''); // NEW: Allow searching any location
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // { doctor, action }

  const detectLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode using free nominatim API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';
          const fullLocation = [city, state].filter(Boolean).join(', ');
          setLocationName(fullLocation);
          localStorage.setItem('userLocation', fullLocation);
          localStorage.setItem('userCity', city);
        } catch {
          setLocationError('Could not determine city name.');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationError('Location access denied. Showing doctors in your area.');
        setLocationLoading(false);
        // Fall back to stored location
        const stored = localStorage.getItem('userLocation');
        if (stored) setLocationName(stored);
      }
    );
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('userLocation');
    if (stored) {
      setLocationName(stored);
    } else {
      detectLocation();
    }
  }, [detectLocation]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      // Use searchLocation if provided, otherwise use detected city
      const city = searchLocation.trim() || localStorage.getItem('userCity') || '';
      const params = new URLSearchParams();
      if (selectedSpecialty !== 'all') params.set('specialty', selectedSpecialty);
      if (search) params.set('search', search);
      if (city) params.set('city', city);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`http://localhost:8000/api/doctor/search?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const apiDoctors = data.data || [];
          
          // If API returns results, use them
          if (apiDoctors.length > 0) {
            setDoctors(apiDoctors);
            return;
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
      }
      
      // Fallback: Filter mock data based on search criteria
      let filtered = MOCK_DOCTORS;
      
      if (city) {
        filtered = filtered.filter(doc =>
          doc.location.toLowerCase().includes(city.toLowerCase())
        );
      }
      
      if (selectedSpecialty !== 'all') {
        filtered = filtered.filter(doc =>
          doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())
        );
      }
      
      if (search) {
        filtered = filtered.filter(doc =>
          doc.name.toLowerCase().includes(search.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
          doc.location.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setDoctors(filtered);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialty, search, searchLocation]);

  useEffect(() => {
    const t = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(t);
  }, [fetchDoctors]);

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#101922]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              <Navigation className="w-6 h-6 text-primary" />
              Find Doctors
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Find and connect with verified doctors near you or anywhere</p>
          </div>

          {/* Location Selection */}
          <div className="mb-6 space-y-3">
            {/* Current/Detected Location Banner */}
            <LocationBanner location={locationName} onRefresh={detectLocation} loading={locationLoading} />
            
            {/* City Dropdown */}
            <div className="relative">
              <div
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-[#1b252f] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary text-sm focus:ring-2 focus:ring-primary/20 cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className={searchLocation ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                    {searchLocation || 'Or search doctors in any city...'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Dropdown Menu */}
              {showCityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1b252f] border border-gray-200 dark:border-[#283039] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {CITIES.map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        setSearchLocation(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#283039] border-b border-gray-100 dark:border-[#283039] last:border-b-0 transition-colors ${
                        searchLocation === city
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{city}</span>
                        {searchLocation === city && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {searchLocation && (
                <button
                  onClick={() => setSearchLocation('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-[#283039] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
            
            {locationError && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs pl-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {locationError}
              </div>
            )}
            
            {/* Show current search location info */}
            {searchLocation && (
              <div className="text-xs text-gray-500 dark:text-gray-400 pl-4">
                Showing doctors in: <span className="font-semibold text-gray-700 dark:text-gray-300">{searchLocation}</span>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by doctor name or specialty..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#1b252f] border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
            />
          </div>

          {/* Specialty Filters */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {SPECIALTIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedSpecialty(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all shrink-0 ${
                  selectedSpecialty === id
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-[#1b252f] border border-gray-200 dark:border-[#283039] text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Finding doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Stethoscope className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-900 dark:text-white font-semibold mb-1">No doctors found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Try a different specialty, search term, or location</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
                {searchLocation 
                  ? ` in ${searchLocation}` 
                  : locationName ? ` near ${locationName.split(',')[0]}` : ''}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map(doctor => (
                  <DoctorCard
                    key={doctor._id}
                    doctor={doctor}
                    onAction={(doc, action) => setActiveModal({ doctor: doc, action })}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {activeModal && (
        <ActionModal
          doctor={activeModal.doctor}
          action={activeModal.action}
          onClose={() => setActiveModal(null)}
        />
      )}
    </ChatLayout>
  );
}

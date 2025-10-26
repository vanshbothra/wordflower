import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  age: number
  gender: string
  education: string
  occupation?: string
  nativeLanguage: string
  englishProficiency: string
  submittedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      age,
      gender,
      education,
      occupation,
      nativeLanguage,
      englishProficiency,
      submittedAt
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !age || !gender || !education || !nativeLanguage || !englishProficiency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate age
    if (typeof age !== 'number' || age < 16 || age > 100) {
      return NextResponse.json(
        { error: 'Invalid age. Must be between 16 and 100' },
        { status: 400 }
      )
    }

    const collection = await getCollection('requests')
    
    // Check if email already exists in requests
    const existingRequest = await collection.findOne({ email: email.toLowerCase() })
    if (existingRequest) {
      return NextResponse.json(
        { error: 'A request with this email already exists' },
        { status: 409 }
      )
    }

    // Create the signup request
    const signupRequest: SignUpRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      age,
      gender,
      education,
      occupation: occupation?.trim() || '',
      nativeLanguage: nativeLanguage.trim(),
      englishProficiency,
      submittedAt: new Date(submittedAt)
    }

    const result = await collection.insertOne(signupRequest)

    if (result.insertedId) {
      return NextResponse.json({ 
        success: true, 
        message: 'Signup request submitted successfully',
        requestId: result.insertedId
      })
    } else {
      throw new Error('Failed to insert signup request')
    }
  } catch (error) {
    console.error('Signup request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit signup request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    const collection = await getCollection('requests')
    
    if (email) {
      // Get specific request by email
      const request = await collection.findOne({ email: email.toLowerCase() })
      if (!request) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(request)
    } else {
      // Get all requests (for admin purposes)
      const requests = await collection.find({}).sort({ submittedAt: -1 }).toArray()
      return NextResponse.json({ requests })
    }
  } catch (error) {
    console.error('Get signup requests error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve signup requests' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer';
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
  wordflowerFamiliarity: string
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
      submittedAt,
      wordflowerFamiliarity
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !age || !gender || !education || !nativeLanguage || !englishProficiency || !wordflowerFamiliarity) {
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
    const usersCollection = await getCollection('thesis_users')

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
      wordflowerFamiliarity,
      submittedAt: new Date(submittedAt)
    }

    const result = await collection.insertOne(signupRequest)

    // Generate unique 6-character alphanumeric userid
    let userId = '';
    let isUnique = false;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    while (!isUnique) {
      userId = '';
      for (let i = 0; i < 6; i++) {
        userId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existingUser = await usersCollection.findOne({ user: userId });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Round-robin gameType: [1] → [2] → [3] → [1] → [2] → [3] …
    const lastUser = await usersCollection.findOne({}, { sort: { _id: -1 } });
    const lastType = Array.isArray(lastUser?.gameType) ? lastUser.gameType[0] : (lastUser?.gameType ?? 0);
    const nextGameType = [(lastType % 3) + 1];

    // Insert into thesis_users collection
    await usersCollection.insertOne({ user: userId, gameType: nextGameType });

    // Send notification email to admin addresses (if configured)
    try {
      const adminListRaw = process.env.ADMIN_EMAILS || ''
      const adminEmails = adminListRaw.split(',').map(e => e.trim()).filter(Boolean)

      const mailUser = process.env.MAIL_ID
      const mailPass = process.env.MAIL_PWD

      if (adminEmails.length > 0 && mailUser && mailPass) {
        // Create transporter
        const transporter = nodemailer.createTransport({
          service: process.env.MAIL_SERVICE || 'gmail',
          auth: {
            user: mailUser,
            pass: mailPass
          }
        })

        const subject = `Wordflower Study Registration - Thank You, ${signupRequest.firstName}!`
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Thank you for participating!</h2>
              <p style="font-size: 16px;">Hi ${signupRequest.firstName},</p>
              <p style="font-size: 15px;">Thank you so much for registering for the <strong>Wordflower Study</strong>. We deeply appreciate your time and participation.</p>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3498db; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h3 style="margin-top: 0; color: #2c3e50; font-size: 18px;">Your Registration Details</h3>
                <ul style="list-style-type: none; padding: 0; margin: 0; font-size: 15px;">
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Name:</strong> ${signupRequest.firstName} ${signupRequest.lastName}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Email:</strong> ${signupRequest.email}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Age:</strong> ${signupRequest.age}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Gender:</strong> ${signupRequest.gender}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Education:</strong> ${signupRequest.education}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Occupation:</strong> ${signupRequest.occupation}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>Native language:</strong> ${signupRequest.nativeLanguage}</li>
                  <li style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;"><strong>English proficiency:</strong> ${signupRequest.englishProficiency}</li>
                  <li style="padding: 6px 0;"><strong>Submitted At:</strong> ${new Date(signupRequest.submittedAt).toLocaleString()}</li>
                </ul>
              </div>

              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 1px solid #bce8f1;">
                <p style="margin: 0; font-size: 16px; color: #31708f;"><strong>Your Auto-Generated User ID:</strong></p>
                <div style="background-color: #ffffff; display: inline-block; padding: 10px 25px; border-radius: 6px; margin: 15px 0; border: 2px dashed #3498db;">
                  <span style="font-size: 26px; font-weight: bold; color: #2c3e50; letter-spacing: 3px; font-family: monospace;">${userId}</span>
                </div>
                <p style="font-size: 14px; color: #666; margin: 0;">Please keep this ID for your records and future reference.</p>
              </div>

              <p style="color: #777; font-size: 14px; margin-top: 30px; text-align: center; border-top: 1px solid #e9ecef; padding-top: 20px;">
                If you have any questions, feel free to reply to this email.<br><br>
                Thank you again from the <strong>Wordflower Team</strong>!
              </p>
            </div>
          </div>
        `
        // const fromHeader = `Wordflower Study <${mailUser}>`;
        await transporter.sendMail({
          from: `Wordflower Study <${mailUser}>`,
          to: signupRequest.email,
          cc: adminEmails,
          subject,
          html: htmlBody,
          replyTo: adminEmails
        })
      }
    } catch (emailErr) {
      console.error('Failed to send signup notification email:', emailErr)
      // do not fail the request because email failed
    }
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
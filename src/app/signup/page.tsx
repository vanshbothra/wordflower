"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { LanguageSelector } from "@/components/ui/language-selector"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"


interface SignUpForm {
  firstName: string
  lastName: string
  email: string
  age: string
  gender: string
  education: string
  occupation: string
  nativeLanguage: string
  englishProficiency: string
  wordflowerFrequency: string
}

interface OptionsProps {
  label: string
  value: string
  options: string[]
}

const ENGLISH: OptionsProps = {
  label: 'English Proficiency *',
  value: 'Select proficiency level',
  options:
    [
      'Native Speaker',
      'Fluent',
      'Advanced',
      'Intermediate',
      'Beginner'
    ]
}

const GENDER: OptionsProps = {
  label: 'Gender *',
  value: 'Select gender',
  options:
    [
      'Male',
      'Female',
      'Non-binary',
      'Prefer not to say',
      'Other'
    ]
}

const EDUCATION_OPTIONS: OptionsProps =
{
  label: "Education Level *",
  value: "Select education level",
  options: [
    "High School",
    "Bachelor's Degree",
    "Master's Degree",
    "PhD",
    "Other",
  ],
}

const WORDFLOWER_FREQUENCY: OptionsProps = {
  label: "Wordflower frequency *",
  value: "Select frequency",
  options: [
    "Never",
    "Rarely (less than once a month)",
    "Occasionally (about once a month)",
    "Sometimes (a few times a month)",
    "Often (a few times a week)",
    "Very often (almost every day)",
  ],
}



export default function SignUpPage() {
  const [formData, setFormData] = useState<SignUpForm>({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    gender: "",
    education: "",
    occupation: "",
    nativeLanguage: "",
    englishProficiency: "",
    wordflowerFrequency: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Check if user is already signed in
  useEffect(() => {
    const existingUserId = localStorage.getItem('wordflower_user_id')
    if (existingUserId) {
      router.push('/')
    }
  }, [router])


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // console.log("Form Data:", formData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    const requiredFields = ['firstName', 'lastName', 'email', 'age', 'gender', 'education', 'nativeLanguage', 'englishProficiency', 'wordflowerFrequency']
    const missingFields = requiredFields.filter(field => !formData[field as keyof SignUpForm].trim())

    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    // Age validation
    const age = parseInt(formData.age)
    if (isNaN(age) || age < 16 || age > 100) {
      toast.error("Please enter a valid age between 16 and 100")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          submittedAt: new Date()
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("Request submitted successfully! You will be contacted with your user ID soon.")

        // Redirect to signin page after a delay
        setTimeout(() => {
          router.push('/signin')
        }, 2000)
      } else {
        toast.error(result.error || "Failed to submit request")
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error("Failed to submit request. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold mb-2">🌻 Wordflower</h1>
          <p className="text-muted-foreground">Request Access to Study</p>
        </div>

        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-9"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-9"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-9"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium mb-2">
                    Age *
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="16"
                    max="100"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-9"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium mb-2">
                    Gender *
                  </label>
                  <CustomSelect
                    options={GENDER}
                    onChange={(val) => setFormData((prev) => ({ ...prev, gender: val }))}
                    selected={formData.gender}
                  />
                </div>
              </div>
            </div>

            {/* Education & Work */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Background</h3>
              <div className="space-y-4 w-full">
                <div className="w-full">
                  <label htmlFor="education" className="block text-sm font-medium mb-2">
                    Highest Level of Education *
                  </label>
                  <CustomSelect


                    options={EDUCATION_OPTIONS}
                    selected={formData.education}
                    onChange={(val) => setFormData((prev) => ({ ...prev, education: val }))}
                  />

                </div>
                <div className="w-full">
                  <label htmlFor="occupation" className="block text-sm font-medium mb-2">
                    Occupation
                  </label>
                  <input
                    id="occupation"
                    name="occupation"
                    type="text"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-9"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Language Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LanguageSelector onChange={(val) => setFormData((prev) => ({ ...prev, nativeLanguage: val }))} />
                <div>
                  <label htmlFor="englishProficiency" className="block text-sm font-medium mb-2">
                    English Proficiency *
                  </label>
                  <CustomSelect
                    options={ENGLISH}
                    onChange={(val) => setFormData((prev) => ({ ...prev, englishProficiency: val }))}
                    selected={formData.englishProficiency}
                  />
                </div>
              </div>
            </div>
            {/* Wordflower Experience */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Wordflower Experience</h3>
              <div className="space-y-4 w-full">
                <div className="w-full">
                  <label htmlFor="wordflowerFrequency" className="block text-sm font-medium mb-2">
                    How often do you play Wordflower? *
                  </label>
                  <CustomSelect
                    options={WORDFLOWER_FREQUENCY}
                    onChange={(val) => setFormData((prev) => ({ ...prev, wordflowerFrequency: val }))}
                    selected={formData.wordflowerFrequency}
                  />
                </div>
              </div>
            </div>


            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/signin')}
                className="flex-1"
                disabled={isLoading}
              >
                Back to Sign In
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

interface CustomSelectProps {
  options: OptionsProps
  onChange: (value: string) => void
  selected?: string
}

function CustomSelect({ options, onChange, selected }: CustomSelectProps) {
  const { label, value, options: opts } = options
  return (
    <Select value={selected} onValueChange={onChange}>
      <SelectTrigger
        className="w-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <SelectValue placeholder={value} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {opts.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
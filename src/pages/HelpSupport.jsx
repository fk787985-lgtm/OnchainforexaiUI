import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/axios'
import toast from 'react-hot-toast'

export default function HelpSupport() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('faq')
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button on the homepage, fill in your details, verify your email, and complete the KYC verification process.'
    },
    {
      question: 'How do I deposit funds?',
      answer: 'Go to your profile, select "Deposits", choose your preferred payment method, enter the amount, and follow the instructions.'
    },
    {
      question: 'How long do withdrawals take?',
      answer: 'Withdrawal processing times vary by method. Bank transfers typically take 1-3 business days, while cryptocurrency withdrawals are usually processed within 24 hours.'
    },
    {
      question: 'What is KYC verification?',
      answer: 'KYC (Know Your Customer) verification is a process to verify your identity. It helps us comply with regulations and protect your account from fraud.'
    },
    {
      question: 'How do I enable Two-Factor Authentication (2FA)?',
      answer: 'Go to Settings > Enable 2FA, scan the QR code with an authenticator app, and verify the code to complete setup.'
    },
    {
      question: 'What should I do if I forget my password?',
      answer: 'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your email to reset your password.'
    },
    {
      question: 'Are my funds safe?',
      answer: 'Yes, we use industry-standard security measures including encryption, cold storage for cryptocurrencies, and regular security audits.'
    },
    {
      question: 'What fees do you charge?',
      answer: 'Fees vary by transaction type. Trading fees, withdrawal fees, and deposit fees are clearly displayed before you confirm any transaction.'
    }
  ]

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/api/support/contact', contactForm)
      if (response.data.success) {
        toast.success('Your message has been sent. We will get back to you soon!')
        setContactForm({ subject: '', message: '', email: '' })
      }
    } catch (error) {
      console.error('Error sending contact form:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Help & Support</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'faq'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'contact'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Contact Us
          </button>
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Contact Support</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Have a question or need assistance? You can chat directly with our support team or fill out the form below.
            </p>
            <div className="mb-6">
              <button
                onClick={() => navigate('/customer-service')}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-semibold mb-4 transition shadow-sm hover:shadow-md"
              >
                Open Live Chat
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Or fill out the form below and our support team will get back to you as soon as possible.
            </p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Subject *</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="What can we help you with?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  placeholder="your@email.com (optional)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We'll use your account email if not provided
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Message *</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-none"
                  placeholder="Please describe your issue or question in detail..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-semibold disabled:opacity-50 transition shadow-sm hover:shadow-md"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Other Ways to Reach Us</h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p><strong className="text-gray-900 dark:text-white">Email:</strong> support@onchaindextrade.com</p>
                <p><strong className="text-gray-900 dark:text-white">Response Time:</strong> Usually within 24 hours</p>
                <p><strong className="text-gray-900 dark:text-white">Business Hours:</strong> Monday - Friday, 9 AM - 6 PM (UTC)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ConfirmSignup() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!code || code.length !== 6) {
      setError('Le code doit contenir 6 chiffres')
      return
    }

    if (!email) {
      setError('Email manquant. Veuillez vous réinscrire.')
      return
    }

    setIsLoading(true)
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      })

      // Success! Redirect to login
      navigate('/login', {
        state: {
          message: 'Compte confirmé ! Vous pouvez maintenant vous connecter.',
          email,
        },
      })
    } catch (err: any) {
      console.error('Confirmation error:', err)
      if (err.name === 'CodeMismatchException') {
        setError('Code incorrect. Veuillez réessayer.')
      } else if (err.name === 'ExpiredCodeException') {
        setError('Code expiré. Cliquez sur "Renvoyer le code".')
      } else {
        setError(err.message || 'Erreur lors de la confirmation')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) return

    setIsResending(true)
    setError('')

    try {
      await resendSignUpCode({ username: email })
      toast.success('Code renvoyé ! Vérifiez votre email.')
    } catch (err: any) {
      toast.error('Erreur lors du renvoi du code')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hq-blue-50 via-white to-hq-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">Session expirée</p>
          <Link to="/signup">
            <Button>Retour à l'inscription</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hq-blue-50 via-white to-hq-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-hq-blue rounded-2xl mb-4">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Vérifiez votre <span className="text-hq-blue">email</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Nous avons envoyé un code de vérification à
          </p>
          <p className="text-hq-blue font-medium mt-1">{email}</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleConfirm} className="space-y-5">
            <div>
              <Input
                type="text"
                label="Code de vérification"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                error={error}
                maxLength={6}
                autoFocus
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Entrez le code à 6 chiffres reçu par email
              </p>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Confirmer
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResendCode}
              disabled={isResending}
              className="w-full text-sm text-gray-600 hover:text-hq-blue transition-colors disabled:opacity-50"
            >
              {isResending ? 'Envoi en cours...' : 'Renvoyer le code'}
            </button>

            <div className="text-center">
              <Link to="/signup" className="text-sm text-gray-600 hover:underline">
                ← Retour à l'inscription
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


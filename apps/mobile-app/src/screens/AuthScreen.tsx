/**
 * Authentication Screen
 *
 * Handles user sign up and sign in using Clerk
 */

import { useState, useCallback } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  View,
  Text,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSignIn, useSignUp } from '@clerk/clerk-expo'
import { colors } from '@/theme/colors'
import { haptics } from '@/services/haptics'
import { useTranslation } from 'react-i18next'
import {
  AuthHeader,
  AuthErrorBanner,
  AuthEmailInput,
  AuthPasswordInput,
  AuthSubmitButton,
  AuthToggleLink,
  VerificationCodeInput,
  TwoFactorInput,
  ForgotPasswordFlow,
} from '@/components/auth'

/**
 * Helper function to extract and translate error messages from Clerk
 */
function getErrorMessage(err: unknown, t: (key: string) => string): string {
  const error = err as {
    errors?: Array<{ message?: string; code?: string }>
    message?: string
  }

  const errorMessage = error.errors?.[0]?.message || error.message || ''
  const errorCode = error.errors?.[0]?.code || ''

  // Check for rate limiting errors
  if (
    errorMessage.toLowerCase().includes('too many') ||
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('too many requests') ||
    errorCode === 'rate_limit_exceeded' ||
    errorCode === 'too_many_requests'
  ) {
    return t('auth.errors.tooManyRequests')
  }

  // Return the original error message or generic error
  return errorMessage || t('auth.errors.generic')
}

export function AuthScreen() {
  const { t } = useTranslation()
  const {
    signIn,
    isLoaded: signInLoaded,
    setActive: setActiveSignIn,
  } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetPasswordSent, setResetPasswordSent] = useState(false)
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false)
  const [secondFactorCode, setSecondFactorCode] = useState('')
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<
    'totp' | 'email_code' | null
  >(null)

  const handleToggleMode = useCallback(() => {
    setIsSignUp((prev) => !prev)
    setError(null)
    setEmail('')
    setPassword('')
    setCode('')
    setPendingVerification(false)
    setIsForgotPassword(false)
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
    setResetPasswordSent(false)
    setNeedsSecondFactor(false)
    setSecondFactorCode('')
    setSecondFactorStrategy(null)
    haptics.light()
  }, [])

  const handleForgotPassword = useCallback(() => {
    setIsForgotPassword(true)
    setError(null)
    setPassword('')
    haptics.light()
  }, [])

  const handleSendResetCode = useCallback(async () => {
    if (!signInLoaded || !email) return

    setIsLoading(true)
    setError(null)

    try {
      await signIn.create({ identifier: email })

      const supportedFirstFactors = signIn.supportedFirstFactors || []
      const emailFactor = supportedFirstFactors.find(
        (factor) => factor.strategy === 'reset_password_email_code',
      ) as { emailAddressId: string } | undefined

      if (!emailFactor) {
        throw new Error('Email reset not available')
      }

      await signIn.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: emailFactor.emailAddressId,
      })
      setResetPasswordSent(true)
      haptics.success()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t))
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [signIn, signInLoaded, email, t])

  const handleResetPassword = useCallback(async () => {
    if (!signInLoaded || !resetCode || !newPassword || !confirmPassword) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      haptics.error()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      })

      if (result.status === 'complete' && setActiveSignIn) {
        await setActiveSignIn({ session: result.createdSessionId })
        haptics.success()
        setIsForgotPassword(false)
        setResetCode('')
        setNewPassword('')
        setConfirmPassword('')
        setResetPasswordSent(false)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, t))
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [
    signIn,
    signInLoaded,
    resetCode,
    newPassword,
    confirmPassword,
    setActiveSignIn,
    t,
  ])

  const handleBackToSignIn = useCallback(() => {
    setIsForgotPassword(false)
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
    setResetPasswordSent(false)
    setError(null)
    haptics.light()
  }, [])

  const handleBackFromVerification = useCallback(() => {
    setPendingVerification(false)
    setCode('')
    setError(null)
    haptics.light()
  }, [])

  const handleResendVerificationCode = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (signUp && signUpLoaded) {
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        haptics.success()
      } else if (signIn && signInLoaded) {
        const supportedFirstFactors = signIn.supportedFirstFactors || []
        const emailFactor = supportedFirstFactors.find(
          (factor) => factor.strategy === 'email_code',
        )

        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: (emailFactor as { emailAddressId: string })
              .emailAddressId,
          })
          haptics.success()
        } else {
          setError(t('auth.errors.signInIncomplete'))
          haptics.error()
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, t))
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [signUp, signUpLoaded, signIn, signInLoaded, t])

  const handleSignUp = useCallback(async () => {
    if (!signUpLoaded || !email || !password) return

    setIsLoading(true)
    setError(null)

    try {
      await signUp.create({
        emailAddress: email,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
      haptics.success()
    } catch (err: unknown) {
      setError(getErrorMessage(err, t))
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [signUp, signUpLoaded, email, password, t])

  const handleVerifyEmail = useCallback(async () => {
    if (!code) return

    setIsLoading(true)
    setError(null)

    try {
      if (signUp && signUpLoaded) {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        })

        if (completeSignUp.status === 'complete' && setActiveSignIn) {
          await setActiveSignIn({ session: completeSignUp.createdSessionId })
          haptics.success()
        } else {
          setError(t('auth.errors.verificationFailed'))
          haptics.error()
        }
      } else if (signIn && signInLoaded) {
        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        })

        if (result.status === 'complete' && setActiveSignIn) {
          await setActiveSignIn({ session: result.createdSessionId })
          haptics.success()
          setPendingVerification(false)
        } else if (result.status === 'needs_second_factor') {
          // Check available second factors
          const supportedSecondFactors = signIn.supportedSecondFactors || []
          console.log('Available second factors:', supportedSecondFactors)

          // Try to find TOTP factor
          const totpFactor = supportedSecondFactors.find(
            (factor) => factor.strategy === 'totp',
          )

          if (totpFactor) {
            try {
              await signIn.prepareSecondFactor({
                strategy: 'totp' as unknown as
                  | 'phone_code'
                  | 'email_code'
                  | 'email_link',
              } as Parameters<typeof signIn.prepareSecondFactor>[0])
              setPendingVerification(false)
              setNeedsSecondFactor(true)
              setSecondFactorStrategy('totp')
              haptics.light()
            } catch (factorError: unknown) {
              setError(
                getErrorMessage(factorError, t) ||
                  t('auth.errors.twoFactorNotAvailable'),
              )
              haptics.error()
            }
          } else {
            // TOTP not available, try email_code as fallback
            const emailCodeFactor = supportedSecondFactors.find(
              (factor) => factor.strategy === 'email_code',
            )

            if (emailCodeFactor) {
              try {
                await signIn.prepareSecondFactor({
                  strategy: 'email_code',
                  emailAddressId: (
                    emailCodeFactor as { emailAddressId: string }
                  ).emailAddressId,
                })
                setPendingVerification(false)
                setNeedsSecondFactor(true)
                setSecondFactorStrategy('email_code')
                haptics.light()
              } catch (factorError: unknown) {
                setError(
                  getErrorMessage(factorError, t) ||
                    t('auth.errors.twoFactorNotAvailable'),
                )
                haptics.error()
              }
            } else {
              // No supported second factors available
              const availableStrategies = supportedSecondFactors.map(
                (f) => f.strategy,
              )
              console.log(
                'No supported second factors available. Available strategies:',
                availableStrategies,
              )
              setError(t('auth.errors.twoFactorNotAvailable'))
              haptics.error()
            }
          }
        } else {
          setError(t('auth.errors.verificationFailed'))
          haptics.error()
        }
      }
    } catch (err: unknown) {
      const error = err as { errors?: Array<{ message?: string }> }
      setError(error.errors?.[0]?.message || 'Invalid verification code')
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [code, signUp, signUpLoaded, signIn, signInLoaded, setActiveSignIn])

  const handleSecondFactor = useCallback(async () => {
    if (!signInLoaded || !secondFactorCode || !secondFactorStrategy) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy,
        code: secondFactorCode,
      })

      if (result.status === 'complete' && setActiveSignIn) {
        await setActiveSignIn({ session: result.createdSessionId })
        haptics.success()
        setNeedsSecondFactor(false)
        setSecondFactorCode('')
        setSecondFactorStrategy(null)
      } else {
        setError(t('auth.errors.twoFactorFailed'))
        haptics.error()
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, t) || t('auth.errors.invalidTwoFactorCode'))
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [
    signIn,
    signInLoaded,
    secondFactorCode,
    secondFactorStrategy,
    setActiveSignIn,
    t,
  ])

  const handleSignIn = useCallback(async () => {
    if (!signInLoaded || !email || !password) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        if (setActiveSignIn && result.createdSessionId) {
          await setActiveSignIn({ session: result.createdSessionId })
          haptics.success()
        } else {
          setError(t('auth.errors.sessionCreationFailed'))
          haptics.error()
        }
      } else if (result.status === 'needs_first_factor') {
        const supportedFirstFactors = signIn.supportedFirstFactors || []
        const emailFactor = supportedFirstFactors.find(
          (factor) => factor.strategy === 'email_code',
        )

        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: (emailFactor as { emailAddressId: string })
              .emailAddressId,
          })
          setPendingVerification(true)
          haptics.light()
        } else {
          setError(t('auth.errors.signInIncomplete'))
          haptics.error()
        }
      } else if (result.status === 'needs_second_factor') {
        // Check available second factors
        const supportedSecondFactors = signIn.supportedSecondFactors || []
        console.log('Available second factors:', supportedSecondFactors)

        // Try to find TOTP factor
        const totpFactor = supportedSecondFactors.find(
          (factor) => factor.strategy === 'totp',
        )

        if (totpFactor) {
          try {
            await signIn.prepareSecondFactor({
              strategy: 'totp' as unknown as
                | 'phone_code'
                | 'email_code'
                | 'email_link',
            } as Parameters<typeof signIn.prepareSecondFactor>[0])
            setNeedsSecondFactor(true)
            setSecondFactorStrategy('totp')
            haptics.light()
          } catch (factorError: unknown) {
            setError(
              getErrorMessage(factorError, t) ||
                t('auth.errors.twoFactorNotAvailable'),
            )
            haptics.error()
          }
        } else {
          // TOTP not available, try email_code as fallback
          const emailCodeFactor = supportedSecondFactors.find(
            (factor) => factor.strategy === 'email_code',
          )

          if (emailCodeFactor) {
            try {
              await signIn.prepareSecondFactor({
                strategy: 'email_code',
                emailAddressId: (emailCodeFactor as { emailAddressId: string })
                  .emailAddressId,
              })
              setNeedsSecondFactor(true)
              setSecondFactorStrategy('email_code')
              haptics.light()
            } catch (factorError: unknown) {
              setError(
                getErrorMessage(factorError, t) ||
                  t('auth.errors.twoFactorNotAvailable'),
              )
              haptics.error()
            }
          } else {
            // No supported second factors available
            const availableStrategies = supportedSecondFactors.map(
              (f) => f.strategy,
            )
            console.log(
              'No supported second factors available. Available strategies:',
              availableStrategies,
            )
            setError(t('auth.errors.twoFactorNotAvailable'))
            haptics.error()
          }
        }
      } else {
        console.log('Sign in status:', result.status)
        setError('Sign in requires additional steps')
        haptics.error()
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, t))
      haptics.error()
    } finally {
      setIsLoading(false)
    }
  }, [signIn, signInLoaded, email, password, setActiveSignIn, t])

  const handleSubmit = useCallback(() => {
    if (needsSecondFactor) {
      handleSecondFactor()
    } else if (pendingVerification) {
      handleVerifyEmail()
    } else if (isSignUp) {
      handleSignUp()
    } else {
      handleSignIn()
    }
  }, [
    needsSecondFactor,
    pendingVerification,
    isSignUp,
    handleSecondFactor,
    handleVerifyEmail,
    handleSignUp,
    handleSignIn,
  ])

  if (!signInLoaded || !signUpLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
      </SafeAreaView>
    )
  }

  const isSubmitDisabled =
    isLoading ||
    (needsSecondFactor && !secondFactorCode) ||
    (!pendingVerification &&
      !needsSecondFactor &&
      !isForgotPassword &&
      (!email || !password)) ||
    (pendingVerification && !code)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader isSignUp={isSignUp} />
          <AuthErrorBanner error={error} />

          {isForgotPassword ? (
            <ForgotPasswordFlow
              email={email}
              onEmailChange={setEmail}
              resetCode={resetCode}
              onResetCodeChange={setResetCode}
              newPassword={newPassword}
              onNewPasswordChange={setNewPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              resetPasswordSent={resetPasswordSent}
              isLoading={isLoading}
              onBack={handleBackToSignIn}
              onSendResetCode={handleSendResetCode}
              onResetPassword={handleResetPassword}
            />
          ) : needsSecondFactor ? (
            <TwoFactorInput
              code={secondFactorCode}
              onChangeText={setSecondFactorCode}
              editable={!isLoading}
              strategy={secondFactorStrategy || 'totp'}
            />
          ) : pendingVerification ? (
            <>
              <VerificationCodeInput
                code={code}
                onChangeText={setCode}
                email={email}
                editable={!isLoading}
              />
              <View className="flex-row gap-3 mb-4">
                <TouchableOpacity
                  onPress={handleBackFromVerification}
                  disabled={isLoading}
                  className={`flex-1 bg-card border border-border rounded-xl py-3 flex-row items-center justify-center ${
                    isLoading ? 'opacity-50' : ''
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-base font-medium">
                    {t('auth.backToSignIn')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResendVerificationCode}
                  disabled={isLoading}
                  className={`flex-1 bg-card border border-border rounded-xl py-3 flex-row items-center justify-center ${
                    isLoading ? 'opacity-50' : ''
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-base font-medium">
                    {t('auth.resendVerificationCode')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <AuthEmailInput
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
              <AuthPasswordInput
                value={password}
                onChangeText={setPassword}
                showPassword={showPassword}
                onToggleShowPassword={() => setShowPassword(!showPassword)}
                editable={!isLoading}
                showForgotPassword={!isSignUp}
                onForgotPassword={handleForgotPassword}
              />
            </>
          )}

          <AuthSubmitButton
            onPress={handleSubmit}
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            isSignUp={isSignUp}
            pendingVerification={pendingVerification}
            needsSecondFactor={needsSecondFactor}
          />

          {!pendingVerification && !isForgotPassword && !needsSecondFactor && (
            <AuthToggleLink
              isSignUp={isSignUp}
              onPress={handleToggleMode}
              disabled={isLoading}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

'use client'
import type { FormFieldBlock, Form as FormType } from '@payloadcms/plugin-form-builder/types'

import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import RichText from '@/components/RichText'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { fields } from './fields'
import { getClientSideURL } from '@/utilities/getURL'

export type FormBlockType = {
  blockName?: string
  blockType?: 'formBlock'
  enableIntro: boolean
  form: FormType
  introContent?: DefaultTypedEditorState
}

export const FormBlock: React.FC<
  {
    id?: string
  } & FormBlockType
> = (props) => {
  const {
    id,
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props

  const formMethods = useForm({
    defaultValues: formFromProps.fields,
  })
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods

  const [isLoading, setIsLoading] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>()
  const [error, setError] = useState<{ message: string; status?: string } | undefined>()
  const router = useRouter()

  const onSubmit = useCallback(
    (data: FormFieldBlock[]) => {
      let loadingTimerID: ReturnType<typeof setTimeout>
      const submitForm = async () => {
        setError(undefined)

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }))

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true)
        }, 1000)

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })

          const res = await req.json()

          clearTimeout(loadingTimerID)

          if (req.status >= 400) {
            setIsLoading(false)

            setError({
              message: res.errors?.[0]?.message || 'Internal Server Error',
              status: res.status,
            })

            return
          }

          setIsLoading(false)
          setHasSubmitted(true)

          if (confirmationType === 'redirect' && redirect) {
            const { url } = redirect

            const redirectUrl = url

            if (redirectUrl) router.push(redirectUrl)
          }
        } catch (err) {
          console.warn(err)
          setIsLoading(false)
          setError({
            message: 'L’envoi a échoué. Réessayez dans un instant.',
          })
        }
      }

      void submitForm()
    },
    [router, formID, redirect, confirmationType],
  )

  return (
    <div className="container lg:max-w-[46rem]" id={id ? `block-${id}` : undefined}>
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-10" data={introContent} enableGutter={false} />
      )}

      <div className="rounded-panneau border border-border bg-card p-6 md:p-9">
        <FormProvider {...formMethods}>
          {/* Confirmation : le formulaire disparaît au profit du message, pour
              qu'on ne se demande pas si l'envoi est parti. */}
          {!isLoading && hasSubmitted && confirmationType === 'message' && (
            <div className="flex flex-col gap-3">
              <p className="mono-label text-primary">Message envoyé</p>
              <RichText className="max-w-none" data={confirmationMessage} enableGutter={false} />
            </div>
          )}

          {isLoading && !hasSubmitted && (
            <p aria-live="polite" className="mono-label text-muted-foreground">
              Envoi en cours…
            </p>
          )}

          {error && (
            <p
              className="mono-label mb-5 rounded-xl border border-primary/40 bg-accent px-4 py-3 text-primary"
              role="alert"
            >
              {error.message}
            </p>
          )}

          {!hasSubmitted && (
            <form
              className="[&_input]:rounded-xl [&_select]:rounded-xl [&_textarea]:rounded-xl"
              id={formID}
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="flex flex-col gap-6">
                {formFromProps?.fields?.map((field, index) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
                  if (!Field) return null

                  return (
                    <Field
                      form={formFromProps}
                      key={index}
                      {...field}
                      {...formMethods}
                      control={control}
                      errors={errors}
                      register={register}
                    />
                  )
                })}
              </div>

              <button
                className="mt-8 inline-flex items-center gap-2.5 rounded-pilule bg-primary px-7 py-3.5 font-bold text-primary-foreground transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                form={formID}
                type="submit"
              >
                {submitButtonLabel || 'Envoyer'}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  )
}

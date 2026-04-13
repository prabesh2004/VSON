import { memo, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileText, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { readDocument } from '@/api/reader'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAppStore } from '@/store/useAppStore'
import { TextDisplay } from './TextDisplay'

/**
 * @typedef {Object} DocumentReaderProps
 * @property {(text: string, title: string) => void} [onReadAloud]
 * @property {(content: { text: string, title: string, total_pages: number, current_page: number, has_next: boolean }) => void} [onContentReady]
 * @property {{ type: string, nonce: number }|null} [voiceAction]
 */

export const DocumentReader = memo(
  /**
   * @param {DocumentReaderProps} props
   */
  function DocumentReader({ onReadAloud, onContentReady, voiceAction = null }) {
    const { isConnected } = useAppStore()
    const fileRef = useRef(null)
    const handledVoiceNonceRef = useRef(null)
    const [uploadedFile, setUploadedFile] = useState(null)

    const { mutate, data, isPending, error } = useMutation({
      mutationFn: ({ file, page }) => {
        const formData = new FormData()
        formData.append('file', file)
        return readDocument(formData, page)
      },
      retry: 1,
    })

    const loadPage = (file, page) => mutate({ file, page })

    const currentPage = data?.current_page ?? 1

    const handleFileChange = (e) => {
      if (!isConnected) return
      const file = e.target.files?.[0]
      if (!file) return
      setUploadedFile(file)
      loadPage(file, 1)
    }

    const handleNext = () => uploadedFile && loadPage(uploadedFile, currentPage + 1)
    const handlePrev = () => uploadedFile && currentPage > 1 && loadPage(uploadedFile, currentPage - 1)

    useEffect(() => {
      if (data && onContentReady) onContentReady(data)
    }, [data, onContentReady])

    useEffect(() => {
      if (!voiceAction || !uploadedFile || !data) return
      if (handledVoiceNonceRef.current === voiceAction.nonce) return

      handledVoiceNonceRef.current = voiceAction.nonce

      if (voiceAction.type === 'repeat' && onReadAloud) {
        onReadAloud(data.text, data.title)
      }
    }, [voiceAction, uploadedFile, data, currentPage, mutate, onReadAloud])

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 p-8 bg-[#161F2C] rounded-2xl border-2 border-dashed border-[#2F3C4C]">
          <FileText size={40} className="text-[#A9D1F5]" aria-hidden="true" />
          <p className="text-[#7A8B9B] font-body text-sm text-center">
            Upload a PDF or text document to read aloud
          </p>
          <input
            ref={fileRef}
            id="doc-upload"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            disabled={!isConnected || isPending}
            className="sr-only"
            aria-label="Upload document file"
            onChange={handleFileChange}
          />
          <Button
            variant="secondary"
            disabled={!isConnected || isPending}
            leftIcon={<Upload size={18} aria-hidden="true" />}
            onClick={() => fileRef.current?.click()}
            ariaLabel="Choose document to upload"
          >
            {uploadedFile ? uploadedFile.name : 'Choose File'}
          </Button>
        </div>

        {!isConnected && (
          <p role="status" aria-live="polite" className="text-[#FFB347] font-body text-sm text-center">
            You are offline. Document reading requires an internet connection.
          </p>
        )}

        {isPending && <Spinner label={`Loading page ${currentPage}…`} />}

        {error && (
          <p role="alert" className="text-[#FF6B6B] font-body text-sm text-center">
            {error.message ?? 'Failed to read the document. Please try again.'}
          </p>
        )}

        {data && (
          <div className="flex flex-col gap-4">
            <TextDisplay text={data.text} title={data.title} />

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                leftIcon={<ChevronLeft size={18} aria-hidden="true" />}
                onClick={handlePrev}
                disabled={!isConnected || currentPage <= 1}
                ariaLabel="Previous page"
              >
                Previous
              </Button>

              <span
                aria-live="polite"
                className="text-[#7A8B9B] font-body text-sm"
              >
                Page {data.current_page} of {data.total_pages}
              </span>

              <Button
                variant="ghost"
                rightIcon={<ChevronRight size={18} aria-hidden="true" />}
                onClick={handleNext}
                disabled={!isConnected || !data.has_next}
                ariaLabel="Next page"
              >
                Next
              </Button>
            </div>

            {onReadAloud && (
              <Button
                variant="secondary"
                onClick={() => onReadAloud(data.text, data.title)}
                ariaLabel={`Read aloud page ${data.current_page}`}
              >
                Read Page Aloud
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)

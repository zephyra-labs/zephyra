import { useActivityLogs } from './useActivityLogs'

export function useStorage() {
  const { addActivityLog } = useActivityLogs()

  const uploadToLocal = async (file: File, account: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload-local', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Local upload failed')

    const data = await res.json()
    const url = data.url

    await addActivityLog(account, {
      type: 'backend',
      action: `Upload file ${file.name}`,
      extra: {
        fileName: file.name,
        url,
        size: file.size,
        type: file.type
      },
      tags: ['file', 'upload']
    })

    return url
  }

  return { uploadToLocal }
}

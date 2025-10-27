import { create } from 'ipfs-http-client'

function toArrayBuffer(data: ArrayBuffer | SharedArrayBuffer | Buffer): ArrayBuffer {
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data).buffer
  }
  if (data instanceof ArrayBuffer) return data
  if (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer) {
    return new Uint8Array(data).slice().buffer
  }
  throw new Error('Unsupported file data type')
}

export default defineEventHandler(async (event) => {
  const formData = (await readMultipartFormData(event)) ?? []
  const uploadedFile = formData[0]
  if (!uploadedFile) throw new Error('No file uploaded')

  const config = useRuntimeConfig()
  const projectId = config.INFURA_PROJECT_ID
  const projectSecret = config.INFURA_PROJECT_SECRET

  if (!projectId || !projectSecret) throw new Error('Infura credentials not set')

  const auth = 'Basic ' + Buffer.from(`${projectId}:${projectSecret}`).toString('base64')

  const client = create({
    url: 'https://ipfs.infura.io:5001/api/v0',
    headers: { authorization: auth },
  })

  const arrayBuffer = toArrayBuffer(uploadedFile.data as any)

  const { cid } = await client.add(arrayBuffer, { wrapWithDirectory: false })

  return {
    cid: cid.toString(),
    url: `https://ipfs.io/ipfs/${cid.toString()}`,
  }
})

export const storageService = {
  async uploadJson(bucket: string, key: string, data: any): Promise<void> {
    const client = createBlobClient()
    const { PutObjectCommand } = require('@aws-sdk/client-s3')
    await ensureContainer(bucket)
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    }))
  },

  async downloadJson<T>(bucket: string, key: string): Promise<T | null> {
    const client = createBlobClient()
    const { GetObjectCommand } = require('@aws-sdk/client-s3')
    try {
      const res: any = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const stream = res.Body as NodeJS.ReadableStream
      const chunks: Buffer[] = []
      for await (const c of stream) chunks.push(Buffer.from(c))
      return JSON.parse(Buffer.concat(chunks).toString()) as T
    } catch {
      return null
    }
  },

  async deleteObject(bucket: string, key: string): Promise<void> {
    const client = createBlobClient()
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  }
}
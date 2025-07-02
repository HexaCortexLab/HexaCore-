export function createBlobClient(): any {
  const { S3Client } = require('@aws-sdk/client-s3')
  const endpoint   = process.env.STORAGE_ENDPOINT!
  const accessKey  = process.env.STORAGE_ACCESS_KEY!
  const secretKey  = process.env.STORAGE_SECRET_KEY!
  const region     = process.env.STORAGE_REGION || 'us-east-1'

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error('Missing STORAGE_ENDPOINT / ACCESS_KEY / SECRET_KEY')
  }

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true
  })
}
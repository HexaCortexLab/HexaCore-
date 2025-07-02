export async function ensureContainer(bucket: string): Promise<void> {
  const client = createBlobClient()
  const { HeadBucketCommand, CreateBucketCommand } = require('@aws-sdk/client-s3')

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode === 404) {
      await client.send(new CreateBucketCommand({ Bucket: bucket }))
      console.log(`Created container: ${bucket}`)
    } else {
      throw err
    }
  }
}
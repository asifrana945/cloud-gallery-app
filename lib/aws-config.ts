import AWS from "aws-sdk"

export function initializeS3Client() {
  try {
    // Check if all required environment variables are set
    const region = process.env.NEXT_PUBLIC_AWS_REGION
    const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error("Missing AWS configuration environment variables")
      return null
    }

    // Configure AWS SDK
    AWS.config.update({
      region,
      accessKeyId,
      secretAccessKey,
      signatureVersion: "v4",
    })

    // Create and return S3 client
    return new AWS.S3()
  } catch (error) {
    console.error("Error initializing AWS S3 client:", error)
    return null
  }
}

export function getBucketName() {
  return process.env.NEXT_PUBLIC_S3_BUCKET_NAME || ""
}

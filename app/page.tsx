import { CloudGallery } from "@/components/cloud-gallery"

// Add environment variables directly for the demo
// In a real app, these would be in .env.local
if (typeof window !== "undefined") {
  window.process = window.process || {}
  window.process.env = window.process.env || {}
  window.process.env.NEXT_PUBLIC_AWS_REGION = "us-east-1"
  window.process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID = "AKIA6ELKN3EGO3UZVGXI"
  window.process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY = "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"
  window.process.env.NEXT_PUBLIC_S3_BUCKET_NAME = "s3-gallery-project"
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <CloudGallery />
    </main>
  )
}
